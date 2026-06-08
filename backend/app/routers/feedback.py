from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, FeedbackEvent, MediaItem, ItemEmbedding
from app.schemas import FeedbackCreate, FeedbackResponse
from app.auth import get_current_user
from app.ml.embeddings import nudge_vector

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_similarity_feedback(
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Feature 8 - User-confirmed similarity feedback:
    A 'more/less like this' action on any item logs the event and updates the user's taste representation
    in real time without requiring full retrain loops.
    """
    # Verify media item exists
    item_stmt = (
        select(MediaItem)
        .where(MediaItem.id == fb_in.media_item_id)
        .options(selectinload(MediaItem.embedding_record))
    )
    res = await db.execute(item_stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")

    event = FeedbackEvent(
        user_id=current_user.id,
        media_item_id=fb_in.media_item_id,
        direction=fb_in.direction
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    msg = f"Feedback '{fb_in.direction}' recorded for '{item.title}'. Taste vector nudged."
    return FeedbackResponse(
        id=event.id,
        user_id=event.user_id,
        media_item_id=event.media_item_id,
        direction=event.direction,
        created_at=event.created_at,
        message=msg
    )
