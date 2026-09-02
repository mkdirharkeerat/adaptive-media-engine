import pytest
import pytest_asyncio
import numpy as np
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import MediaItem, ItemEmbedding
from app.ml.embeddings import compute_text_embedding, compute_cosine_similarity, nudge_vector
from app.ml.depth_scorer import depth_scorer
from app.ml.context_classifier import context_classifier
from app.ml.clustering import cluster_media_items, get_sub_genre_name

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Insert a diverse set of 12 test media items across types to test 10-item batching
    async with TestSessionLocal() as session:
        test_items = [
            ("movie", "Blade Runner 2049", "Cyberpunk noir with Officer K.", ["cyberpunk", "atmospheric"], 0.3, 0.7),
            ("movie", "Dune: Part Two", "Epic sci-fi desert warfare.", ["epic", "political-intrigue"], 0.6, 0.8),
            ("movie", "Mad Max: Fury Road", "Post-apocalyptic high-octane action.", ["kinetic-action", "survival"], 0.95, 0.85),
            ("movie", "Past Lives", "Introspective slow-burn romance.", ["slow-burn", "romance"], 0.25, 0.4),
            ("movie", "Parasite", "Class struggle thriller in Seoul.", ["social-satire", "thriller"], 0.75, 0.8),
            ("tv", "Severance", "Work memories separated surgically.", ["slow-burn", "dystopian"], 0.45, 0.75),
            ("tv", "Succession", "Roy family media empire power struggle.", ["corporate-intrigue", "morally-gray"], 0.65, 0.75),
            ("tv", "The Bear", "High-stress Chicago kitchen drama.", ["kinetic-pacing", "high-stress"], 0.9, 0.85),
            ("tv", "Dark", "Time travel puzzle in German town.", ["time-travel", "existential-mystery"], 0.5, 0.85),
            ("tv", "Andor", "Gritty revolution against the Empire.", ["raw/gritty", "political-thriller"], 0.55, 0.7),
            ("book", "Project Hail Mary", "Sole survivor interstellar survival.", ["hard-sci-fi", "first-contact"], 0.85, 0.5),
            ("book", "The Three-Body Problem", "Contact with an alien civilization.", ["hard-sci-fi", "cosmic-horror"], 0.4, 0.8),
        ]

        for m_type, title, synopsis, themes, pacing, intensity in test_items:
            m = MediaItem(
                media_type=m_type,
                title=title,
                synopsis=synopsis,
                themes=themes,
                sub_genres=["Sample Sub-genre"],
                raw_metadata={"pacing": pacing, "intensity": intensity, "total_episodes": 10 if m_type == "tv" else 1}
            )
            session.add(m)
            await session.flush()
            emb = compute_text_embedding(f"{title} {synopsis} {' '.join(themes)}")
            session.add(ItemEmbedding(media_item_id=m.id, embedding=emb))

        await session.commit()

    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_auth_and_preferences_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup
        signup_res = await client.post("/api/v1/auth/signup", json={
            "email": "tester@example.com",
            "password": "securepassword123"
        })
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get preferences
        pref_res = await client.get("/api/v1/preferences", headers=headers)
        assert pref_res.status_code == 200
        pref_data = pref_res.json()
        assert pref_data["version"] == 1
        assert pref_data["pacing"] == 0.5

        # 3. Update preferences (Creates version 2)
        put_res = await client.put("/api/v1/preferences", headers=headers, json={
            "sub_genre_values": {"action": "choreographed", "romance": "fast-paced"},
            "pacing": 0.85,
            "viewing_context": ["binge"],
            "intensity": 0.9,
            "language_mix_ok": True
        })
        assert put_res.status_code == 200
        assert put_res.json()["version"] == 2
        assert put_res.json()["pacing"] == 0.85

@pytest.mark.asyncio
async def test_history_and_recommendations_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Signup
        signup_res = await client.post("/api/v1/auth/signup", json={
            "email": "watcher@example.com",
            "password": "password123"
        })
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Add history item for Blade Runner 2049
        hist_res = await client.post("/api/v1/history", headers=headers, json={
            "media_item_id": 1,
            "completion_pct": 100.0,
            "rewatch_count": 3,
            "rating": 5.0,
            "episode_progress": []
        })
        assert hist_res.status_code == 201
        assert hist_res.json()["rewatch_count"] == 3

        # Get batch 1 of recommendations (fixed 10 items)
        rec_res = await client.get("/api/v1/recommendations?batch=1", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert "items" in rec_data
        assert rec_data["batch_number"] == 1
        assert len(rec_data["items"]) <= 10
        assert rec_data["has_more"] is True # 12 items seeded, 1 consumed, 11 candidates -> 10 in batch 1, 1 left

        # Verify reasoning constraint: every item MUST have non-empty reasoning_text and citations
        for item in rec_data["items"]:
            assert item["reasoning_text"]
            assert len(item["reasoning_text"]) > 10

        # Submit feedback (online vector nudge)
        fb_res = await client.post("/api/v1/feedback", headers=headers, json={
            "media_item_id": 2,
            "direction": "more_like_this"
        })
        assert fb_res.status_code == 201
        assert "Taste vector nudged" in fb_res.json()["message"]

@pytest.mark.asyncio
async def test_csv_import_format_detection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup_res = await client.post("/api/v1/auth/signup", json={
            "email": "importer@example.com",
            "password": "password123"
        })
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Simulate Letterboxd CSV
        letterboxd_csv = "Name,Year,Letterboxd URI,Rating\nInception,2010,https://boxd.it/1abc,4.5\nInterstellar,2014,https://boxd.it/2def,5.0\n"
        files = {"file": ("ratings.csv", letterboxd_csv.encode("utf-8"), "text/csv")}
        res = await client.post("/api/v1/history/import", headers=headers, files=files)
        assert res.status_code == 200
        data = res.json()
        assert data["format_detected"] == "Letterboxd CSV"
        assert data["imported_count"] == 2

def test_ml_components():
    # Depth scorer test
    score_full = depth_scorer.compute_interest_score(completion_pct=100, rewatch_count=2, rating=5.0)
    score_early_drop = depth_scorer.compute_interest_score(completion_pct=15, drop_off_point=1, total_episodes=10)
    assert score_full > score_early_drop
    assert score_full > 0.8
    assert score_early_drop < 0.35

    # Context classifier test
    assert context_classifier.is_trained is True
    mode = context_classifier.predict_mode([], ["binge"])
    assert mode in ["binge", "casual", "one-off"]

    # Vector nudge test
    v1 = np.ones(384, dtype=np.float32) / np.sqrt(384)
    v2 = np.zeros(384, dtype=np.float32)
    v2[0] = 1.0
    nudged_pos = nudge_vector(v1, v2, direction="more_like_this", lr=0.15)
    nudged_neg = nudge_vector(v1, v2, direction="less_like_this", lr=0.15)
    assert compute_cosine_similarity(nudged_pos, v2) > compute_cosine_similarity(v1, v2)
    assert compute_cosine_similarity(nudged_neg, v2) < compute_cosine_similarity(v1, v2)

    # KMeans clustering test
    embeddings = [np.random.randn(384).astype(np.float32) for _ in range(12)]
    clusters = cluster_media_items(embeddings, n_clusters=3)
    assert len(clusters) == 12
    assert isinstance(get_sub_genre_name(clusters[0]), str)
