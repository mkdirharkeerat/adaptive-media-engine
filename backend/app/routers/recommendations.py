from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import RecommendationBatchResponse
from app.auth import get_current_user
from app.ml.recommender import generate_user_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=RecommendationBatchResponse)
async def get_recommendations(
    media_type: Optional[str] = Query(None, description="movie, tv, book, documentary, or all"),
    content_mode: Optional[str] = Query(None, description="fiction, entertainment, non-fiction, or all"),
    genre: Optional[str] = Query(None, description="canonical genre id"),
    batch: int = Query(1, ge=1, description="Batch number (fixed 10 per batch, non-infinite scroll)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Feature 4 & 6 - Recommendations feed:
    Returns a fixed batch of 10 items. Every recommendation object strictly contains
    plain-language reasoning and cited history items.
    """
    results = await generate_user_recommendations(
        db=db,
        user_id=current_user.id,
        media_type=media_type if media_type and media_type != "all" else None,
        content_mode=content_mode if content_mode and content_mode != "all" else None,
        genre=genre if genre and genre != "all" else None,
        batch_number=batch,
        batch_size=10
    )

    return RecommendationBatchResponse(
        batch_number=results["batch_number"],
        media_type=results["media_type"],
        content_mode=results.get("content_mode"),
        genre=results.get("genre"),
        items=results["items"],
        has_more=results["has_more"],
        context_mode=results["context_mode"],
        depth_ratio=results.get("depth_ratio"),
    )
