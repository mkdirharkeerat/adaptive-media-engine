import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import MediaItem, ItemEmbedding, UserMediaHistory, UserPreference, Recommendation
from app.ml.embeddings import compute_cosine_similarity
from app.ml.depth_scorer import depth_scorer
from app.ml.context_classifier import context_classifier
from app.ml.reasoning import generate_grounded_reasoning
from app.ml.taxonomy import (
    PACING_CENTER,
    active_style_values,
    canonical_genres_for_item,
    classify_content_modes,
    item_matches_content_mode,
    preferred_pacing_bands,
    split_viewing_context,
)
from app.schemas import RecommendationResponse, CitedHistorySummary, MediaItemResponse


def _pref_dict(user_pref: Optional[UserPreference]) -> Dict[str, Any]:
    if not user_pref:
        return {
            "pacing": 0.5,
            "intensity": 0.5,
            "viewing_context": ["casual"],
            "sub_genre_values": {},
            "preferred_genres": [],
            "pacing_bands": ["balanced"],
            "pacing_by_mode": {},
            "content_modes": ["fiction", "entertainment"],
            "content_intent": [],
            "version": 1,
        }

    session_ctx, legacy_intent = split_viewing_context(user_pref.viewing_context)
    content_intent = list(user_pref.content_intent or []) + [i for i in legacy_intent if i not in (user_pref.content_intent or [])]
    return {
        "pacing": user_pref.pacing if user_pref.pacing is not None else 0.5,
        "intensity": user_pref.intensity if user_pref.intensity is not None else 0.5,
        "viewing_context": session_ctx or ["casual"],
        "sub_genre_values": user_pref.sub_genre_values or {},
        "preferred_genres": user_pref.preferred_genres or [],
        "pacing_bands": user_pref.pacing_bands or [],
        "pacing_by_mode": user_pref.pacing_by_mode or {},
        "content_modes": user_pref.content_modes or [],
        "content_intent": content_intent,
        "version": user_pref.version if user_pref else 1,
    }


def _history_depth_ratio(user_history: List[UserMediaHistory]) -> float:
    if not user_history:
        return 0.0
    scores = []
    for h in user_history:
        completion = (h.completion_pct or 0.0) / 100.0
        rewatch = min(1.0, (h.rewatch_count or 0) * 0.12)
        rating_boost = 0.0
        if h.rating:
            rating_boost = max(0.0, (h.rating - 3.0) / 10.0)
        scores.append(min(1.0, completion * 0.75 + rewatch + rating_boost))
    return round(float(sum(scores) / len(scores)), 2)


async def generate_user_recommendations(
    db: AsyncSession,
    user_id: int,
    media_type: Optional[str] = None,
    content_mode: Optional[str] = None,
    genre: Optional[str] = None,
    batch_number: int = 1,
    batch_size: int = 10
) -> Dict[str, Any]:
    """
    Core Recommendation Engine (Features 1, 2, 4, 5, 6, 7):
    Combines explicit preferences (hard prior) with implicit depth signals (weights).
    """
    pref_stmt = select(UserPreference).where(UserPreference.user_id == user_id).order_by(UserPreference.version.desc())
    pref_res = await db.execute(pref_stmt)
    user_pref = pref_res.scalars().first()
    pref_dict = _pref_dict(user_pref)

    hist_stmt = (
        select(UserMediaHistory)
        .where(UserMediaHistory.user_id == user_id)
        .options(selectinload(UserMediaHistory.media_item).selectinload(MediaItem.embedding_record))
    )
    hist_res = await db.execute(hist_stmt)
    user_history = hist_res.scalars().all()

    context_mode = context_classifier.predict_mode(user_history, pref_dict["viewing_context"])
    depth_ratio = _history_depth_ratio(user_history)

    consumed_item_ids = set()
    history_weights = []
    history_embeddings = []
    history_meta = []

    for h in user_history:
        consumed_item_ids.add(h.media_item_id)
        if h.media_item and h.media_item.embedding_record:
            emb = h.media_item.embedding_record.embedding
            if isinstance(emb, list) or hasattr(emb, '__iter__'):
                total_eps = h.media_item.raw_metadata.get("total_episodes", 1) if h.media_item.raw_metadata else 1
                score = depth_scorer.compute_interest_score(
                    completion_pct=h.completion_pct,
                    rewatch_count=h.rewatch_count,
                    rating=h.rating,
                    drop_off_point=h.drop_off_point,
                    total_episodes=total_eps
                )
                history_weights.append(score)
                history_embeddings.append(np.array(emb, dtype=np.float32))
                history_meta.append({
                    "history_id": h.id,
                    "media_item_id": h.media_item_id,
                    "title": h.media_item.title,
                    "media_type": h.media_item.media_type,
                    "rating": h.rating,
                    "rewatch_count": h.rewatch_count,
                    "completion_pct": h.completion_pct,
                    "embedding": np.array(emb, dtype=np.float32),
                    "score": score
                })

    if history_embeddings and sum(history_weights) > 0:
        norm_weights = np.array(history_weights) / sum(history_weights)
        user_vector = np.sum([w * vec for w, vec in zip(norm_weights, history_embeddings)], axis=0)
        norm = np.linalg.norm(user_vector)
        if norm > 0:
            user_vector /= norm
    else:
        user_vector = np.ones(384, dtype=np.float32) / np.sqrt(384)

    item_stmt = select(MediaItem).options(selectinload(MediaItem.embedding_record))
    if media_type and media_type != "all":
        item_stmt = item_stmt.where(MediaItem.media_type == media_type)

    item_res = await db.execute(item_stmt)
    all_candidates = item_res.scalars().all()

    candidates = [
        item for item in all_candidates
        if item.id not in consumed_item_ids
        and item.embedding_record
        and item_matches_content_mode(item, content_mode)
    ]

    genre_filter = (genre or "").strip().lower()
    if genre_filter and genre_filter != "all":
        filtered = []
        for item in candidates:
            item_genres = canonical_genres_for_item(item.themes, item.sub_genres, item.raw_metadata)
            tags = {str(t).lower() for t in (item.themes or [])} | {str(g).lower() for g in (item.sub_genres or [])}
            if genre_filter in item_genres or genre_filter in tags:
                filtered.append(item)
        candidates = filtered

    scored_candidates = []
    active_styles = active_style_values(pref_dict.get("sub_genre_values"))
    preferred_genres = {str(g).lower() for g in (pref_dict.get("preferred_genres") or [])}
    user_intents = set(str(c).lower() for c in (pref_dict.get("content_intent") or []))
    user_modes = set(str(m).lower() for m in (pref_dict.get("content_modes") or []))

    for item in candidates:
        emb = item.embedding_record.embedding
        emb_arr = np.array(emb, dtype=np.float32)
        sim = compute_cosine_similarity(user_vector, emb_arr)

        raw_meta = item.raw_metadata or {}
        item_pacing = float(raw_meta.get("pacing", 0.5))
        item_intensity = float(raw_meta.get("intensity", 0.5))
        item_modes = classify_content_modes(item.media_type, item.themes, item.sub_genres, raw_meta)
        item_genres = canonical_genres_for_item(item.themes, item.sub_genres, raw_meta)
        item_tags = {str(t).lower() for t in (item.themes or [])} | {str(g).lower() for g in (item.sub_genres or [])} | set(item_genres)
        category = str(raw_meta.get("category", "")).lower()

        match_reasons = []

        bands = preferred_pacing_bands(pref_dict, item_modes)
        band_centers = [PACING_CENTER[b] for b in bands if b in PACING_CENTER]
        if band_centers:
            pacing_diff = min(abs(item_pacing - c) for c in band_centers)
        else:
            pacing_diff = abs(item_pacing - float(pref_dict["pacing"]))
        pacing_penalty = pacing_diff * 0.18
        if pacing_diff < 0.18:
            match_reasons.append("pacing band")

        intensity_diff = abs(item_intensity - float(pref_dict["intensity"]))
        intensity_penalty = intensity_diff * 0.12
        if intensity_diff < 0.2:
            match_reasons.append("intensity")

        context_bonus = 0.0
        if context_mode == "binge" and item.media_type == "tv":
            context_bonus = 0.08
            match_reasons.append("binge-friendly series")
        elif context_mode == "one-off" and item.media_type in ("movie", "book"):
            context_bonus = 0.08
            match_reasons.append("one-off format")
        elif context_mode == "background" and item_pacing < 0.4:
            context_bonus = 0.05

        genre_bonus = 0.0
        if preferred_genres:
            overlap = preferred_genres & set(item_genres)
            if overlap:
                genre_bonus = min(0.28, 0.12 * len(overlap))
                match_reasons.append("genre: " + ", ".join(sorted(overlap)[:3]))

        style_bonus = 0.0
        for _, style_val in active_styles.items():
            if style_val in item_tags or style_val.replace("/", "-") in item_tags:
                style_bonus += 0.06
                match_reasons.append(style_val)
        style_bonus = min(style_bonus, 0.18)

        mode_bonus = 0.0
        if user_modes and set(item_modes) & user_modes:
            mode_bonus = 0.06

        intent_bonus = 0.0
        if "self-improvement" in user_intents:
            if any(t in item_tags for t in ("self-improvement", "habits", "psychology", "productivity", "discipline", "resilience")) or category == "self-improvement":
                intent_bonus += 0.22
                match_reasons.append("self-improvement intent")
        if "deep-learning" in user_intents:
            if any(t in item_tags for t in ("science", "history", "philosophy", "technology", "cognitive-bias")) or category == "deep-learning":
                intent_bonus += 0.22
                match_reasons.append("deep-learning intent")
        if "documentary" in user_intents:
            if item.media_type == "documentary" or any(t in item_tags for t in ("documentary", "investigative")) or category == "documentary":
                intent_bonus += 0.25
                match_reasons.append("documentary intent")

        final_score = sim - pacing_penalty - intensity_penalty + context_bonus + genre_bonus + style_bonus + mode_bonus + intent_bonus

        cited_items = []
        if history_meta:
            hist_sims = []
            for h in history_meta:
                h_sim = compute_cosine_similarity(h["embedding"], emb_arr) * h["score"]
                hist_sims.append((h_sim, h))
            hist_sims.sort(key=lambda x: x[0], reverse=True)
            cited_items = [h for _, h in hist_sims[:2]]

        scored_candidates.append({
            "item": item,
            "final_score": final_score,
            "cited_items": cited_items,
            "match_reasons": list(dict.fromkeys(match_reasons)),
            "content_modes": item_modes,
            "canonical_genres": item_genres,
        })

    scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

    start_idx = (batch_number - 1) * batch_size
    end_idx = start_idx + batch_size
    batch_candidates = scored_candidates[start_idx:end_idx]
    has_more = end_idx < len(scored_candidates)

    recommendations_list: List[RecommendationResponse] = []

    for entry in batch_candidates:
        item = entry["item"]
        cited = entry["cited_items"]
        cited_ids = [c["history_id"] for c in cited]

        reasoning = await generate_grounded_reasoning(
            target_item_title=item.title,
            target_media_type=item.media_type,
            target_synopsis=item.synopsis,
            target_themes=item.themes or [],
            cited_history_items=cited,
            user_preferences=pref_dict,
            match_reasons=entry["match_reasons"],
            canonical_genres=entry["canonical_genres"],
            content_modes=entry["content_modes"],
        )

        cited_summaries = [
            CitedHistorySummary(
                history_id=c["history_id"],
                title=c["title"],
                media_type=c["media_type"],
                completion_pct=c["completion_pct"],
                rating=c["rating"],
                rewatch_count=c["rewatch_count"]
            )
            for c in cited
        ]

        rec_response = RecommendationResponse(
            id=None,
            user_id=user_id,
            media_item_id=item.id,
            reasoning_text=reasoning,
            cited_history_ids=cited_ids,
            cited_items=cited_summaries,
            preference_version=pref_dict["version"],
            batch_number=batch_number,
            media_item=MediaItemResponse.model_validate(item),
            match_reasons=entry["match_reasons"],
            content_modes=entry["content_modes"],
            canonical_genres=entry["canonical_genres"],
        )
        recommendations_list.append(rec_response)

    return {
        "batch_number": batch_number,
        "media_type": media_type,
        "content_mode": content_mode,
        "genre": genre,
        "items": recommendations_list,
        "has_more": has_more,
        "context_mode": context_mode,
        "depth_ratio": depth_ratio,
    }
