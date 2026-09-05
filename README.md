# Adaptive Media Recommendation System
### High-Affinity Media Discovery via Explicit Values & Completion Depth Signals

An end-to-end, production-grade web application and machine learning engine for cross-media recommendations (Movies, TV Shows, Books). Unlike mainstream algorithms that optimize for addiction, watch-time streaks, and click-through rates, this engine optimizes strictly for **genuine user taste**, **completion depth**, and **explicit preference boundaries**, with **every recommendation backed by grounded citations to past media**.

---

## Key Implemented Features

### 1. Preference / Values Selector (Explicit Prior)
- **Granular Controls**: Pacing slider (*Atmospheric* to *Plot-Driven*), content intensity (*Light/Gentle* to *Dark/Heavy*), sub-genre tags (*Slow-Burn Romance*, *Raw Action*, *Morally-Gray Protagonists*, *Challenging Tone*), and multi-select viewing contexts (*Binge*, *Casual*, *One-Off*).
- **Versioned State**: Every update is saved as a new version (`version: int`) in `user_preferences`, allowing past recommendation batches to remain traceable.

### 2. Genuine Preference Engine & Depth Weighting
- **Implicit Signals**: Instead of simple click events, candidates are weighted by completion percentage, rewatch counts, and episode/chapter drop-off points.
- **Taste Centroid**: Computes the user's vector representation $\vec{u}$ by taking a normalized weighted sum of finished/high-affinity media embeddings.

### 3. Sub-Genre Embeddings & Clustering
- Generates 384-dimensional dense semantic embeddings using transformer text encoders.
- Discovers fine-grained sub-genres across the library using unsupervised KMeans clustering.

### 4. Grounded, Plain-Language Reasoning
- Every recommendation object strictly contains `reasoning_text` explaining *why* the item was selected based on explicit values and citing specific finished titles (`cited_items`).

### 5. Context-Aware Mode Classifier
- Automatically classifies the active consumption mode (*Binge*, *Casual*, *One-Off*) using a trained Logistic Regression classifier over history cadence and user context preferences.

### 6. Architectural Exclusion of Dark Patterns
- **No Session Timing & No Streaks**: The database schema contains no columns or metrics for session length, daily streaks, or push notifications.
- **Fixed Batching**: Delivers recommendations in fixed batches of 10 items with an explicit `"Load Next Batch"` button (no infinite scroll).

### 7. Episode & Chapter-Level Depth Tracker
- Interactive checklist for episodic TV shows and book chapters.
- Non-linear drop-off interest scorer: dropping off at episode 2 of 10 signals disinterest, whereas dropping off at episode 9 of 10 signals high interest.

### 8. Online Real-Time Similarity Feedback
- `"More like this"` and `"Less like this"` feedback buttons trigger immediate vector nudges ($\vec{u} \leftarrow \vec{u} \pm \eta \vec{v}_{\text{item}}$) in real-time online learning without requiring full retrain cycles.

### 9. Multi-Format History Ingestion
- Auto-detects and parses **Letterboxd** (`ratings.csv`), **Goodreads** (`books.csv`), and **Steam** (JSON/CSV) export files, and supports manual catalog additions.

---

## System Architecture

```
Adaptive Media Recommendation Architecture
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)                │
│    - Tailored Dark Theme + Custom Glassmorphism        │
│    - Values Selector Form (Versioned v1, v2, ...)      │
│    - Fixed Batch Recommendation Feed + Citations       │
│    - Episode / Chapter Depth Tracker & Drop-Off Signal │
│    - CSV / JSON Onboarding & Import Auto-Detector      │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs (JSON / JWT)
┌───────────────────────────▼────────────────────────────┐
│                  Backend (FastAPI)                     │
│    - Auth (JWT + Native Bcrypt)                        │
│    - Preference State Versioning                       │
│    - Multi-format CSV / JSON Import Engine             │
│    - Real-time Similarity Feedback Vector Nudging      │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────────────┐    ┌───────────────────────────┐
│       ML Engine Layer        │    │ PostgreSQL + pgvector     │
│ - 384-dim Dense Embeddings   │    │ - 7 relational tables     │
│ - KMeans Sub-genre Discovery │    │ - Vector(384) cosine index│
│ - Logistic Context Predictor │    │ - History with drop-offs  │
│ - Non-linear Depth Scorer    │    │ - Versioned preferences   │
│ - Grounded Reasoning LLM     │    │ - Async SQLAlchemy        │
└──────────────────────────────┘    └───────────────────────────┘
```

---

## Quickstart & Local Development

### Option A: Running with Docker Compose
Ensure Docker is installed and run:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

### Option B: Running Locally

#### 1. Backend Setup
```bash
# In repository root
export PATH="$HOME/.local/bin:$PATH"
uv pip install -r backend/requirements.txt

# Run database seed
python backend/app/seed.py

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 3. Run Backend Test Suite
```bash
PYTHONPATH=backend uv run pytest backend/tests/test_api.py -v
```

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `users` | User accounts with secure bcrypt password hashing. |
| `user_preferences` | Versioned explicit values (pacing, intensity, context, sub-genres). |
| `media_items` | Catalog items (movies, tv shows, books) with metadata and themes. |
| `item_embeddings` | 384-dimensional dense vectors stored using `pgvector`. |
| `user_media_history` | History records with completion percentage, rewatch counts, ratings, and episode drop-off points. |
| `recommendations` | Traceable recommendations strictly storing grounded `reasoning_text` and cited items. |
| `feedback_events` | Real-time online learning feedback logs (`more_like_this` / `less_like_this`). |

---

## Verified Quality & Test Results
- **Backend**: 4 test suites passed with 100% success (Auth, Preferences Versioning, History & Recommendations Grounded Reasoning, CSV Format Detection, Depth Scorer & Vector Nudges).
- **Frontend**: Vite production build generated in under 1 second with 0 bundling errors.
