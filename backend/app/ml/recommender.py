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
from app.schemas import RecommendationResponse, CitedHistorySummary, MediaItemResponse

async def generate_user_recommendations(
    db: AsyncSession,
    user_id: int,
    media_type: Optional[str] = None,
    batch_number: int = 1,
    batch_size: int = 10
) -> Dict[str, Any]:
    """
    Core Recommendation Engine (Features 1, 2, 4, 5, 6, 7):
    Combines explicit preferences (hard prior) with implicit depth signals (weights).
    """
    # 1. Fetch user's latest preferences
    pref_stmt = select(UserPreference).where(UserPreference.user_id == user_id).order_by(UserPreference.version.desc())
    pref_res = await db.execute(pref_stmt)
    user_pref = pref_res.scalars().first()
    
    pref_dict = {
        "pacing": user_pref.pacing if user_pref else 0.5,
        "intensity": user_pref.intensity if user_pref else 0.5,
        "viewing_context": user_pref.viewing_context if user_pref and user_pref.viewing_context else ["casual"],
        "sub_genre_values": user_pref.sub_genre_values if user_pref else {},
        "version": user_pref.version if user_pref else 1
    }

    # 2. Fetch user's media history with loaded media_item and embeddings
    hist_stmt = (
        select(UserMediaHistory)
        .where(UserMediaHistory.user_id == user_id)
        .options(selectinload(UserMediaHistory.media_item).selectinload(MediaItem.embedding_record))
    )
    hist_res = await db.execute(hist_stmt)
    user_history = hist_res.scalars().all()

    # 3. Predict context mode
    context_mode = context_classifier.predict_mode(user_history, pref_dict["viewing_context"])

    # 4. Compute User Taste Centroid from weighted history items
    consumed_item_ids = set()
    history_weights = []
    history_embeddings = []
    history_meta = []

    for h in user_history:
        consumed_item_ids.add(h.media_item_id)
        if h.media_item and h.media_item.embedding_record:
            emb = h.media_item.embedding_record.embedding
            if isinstance(emb, list) or hasattr(emb, '__iter__'):
                # Total episodes from raw_metadata
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

    # Default baseline vector if user has no history
    if history_embeddings and sum(history_weights) > 0:
        norm_weights = np.array(history_weights) / sum(history_weights)
        user_vector = np.sum([w * vec for w, vec in zip(norm_weights, history_embeddings)], axis=0)
        norm = np.linalg.norm(user_vector)
        if norm > 0:
            user_vector /= norm
    else:
        user_vector = np.ones(384, dtype=np.float32) / np.sqrt(384)

    # 5. Query candidate media items
    item_stmt = select(MediaItem).options(selectinload(MediaItem.embedding_record))
    if media_type and media_type != "all":
        item_stmt = item_stmt.where(MediaItem.media_type == media_type)
    
    item_res = await db.execute(item_stmt)
    all_candidates = item_res.scalars().all()

    # Filter out already consumed items
    candidates = [item for item in all_candidates if item.id not in consumed_item_ids and item.embedding_record]

    # 6. Rank candidate items
    scored_candidates = []
    for item in candidates:
        emb = item.embedding_record.embedding
        emb_arr = np.array(emb, dtype=np.float32)
        sim = compute_cosine_similarity(user_vector, emb_arr)

        # Context & Pacing adjustment
        raw_meta = item.raw_metadata or {}
        item_pacing = raw_meta.get("pacing", 0.5)
        pacing_diff = abs(item_pacing - pref_dict["pacing"])
        pacing_penalty = pacing_diff * 0.15

        # Format context matching bonus
        context_bonus = 0.0
        if context_mode == "binge" and item.media_type == "tv":
            context_bonus = 0.08
        elif context_mode == "one-off" and item.media_type in ("movie", "book"):
            context_bonus = 0.08

        final_score = sim - pacing_penalty + context_bonus

        # Find top 2 cited history items that contributed most to this candidate's similarity
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
            "cited_items": cited_items
        })

    # Sort descending
    scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

    # 7. Pagination for fixed batches (10 items per batch, Feature 6)
    start_idx = (batch_number - 1) * batch_size
    end_idx = start_idx + batch_size
    batch_candidates = scored_candidates[start_idx:end_idx]
    has_more = end_idx < len(scored_candidates)

    # 8. Generate grounded reasoning and build response models
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
            user_preferences=pref_dict
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
            media_item=MediaItemResponse.model_validate(item)
        )
        recommendations_list.append(rec_response)

    return {
        "batch_number": batch_number,
        "media_type": media_type,
        "items": recommendations_list,
        "has_more": has_more,
        "context_mode": context_mode
    }
