from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, MediaItem, UserMediaHistory
from app.schemas import MediaItemResponse, MediaItemDetailResponse, UserMediaHistoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/media", tags=["media"])

@router.get("/search", response_model=List[MediaItemResponse])
async def search_media(
    q: str = Query("", description="Search term across title, synopsis, or themes"),
    media_type: Optional[str] = Query(None, description="Filter by movie, tv, or book"),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MediaItem)
    if media_type and media_type != "all":
        stmt = stmt.where(MediaItem.media_type == media_type)
    
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            (MediaItem.title.ilike(search_pattern)) | 
            (MediaItem.synopsis.ilike(search_pattern))
        )
        
    stmt = stmt.order_by(MediaItem.id.asc()).limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return items

@router.get("/{media_id}", response_model=MediaItemDetailResponse)
async def get_media_detail(
    media_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MediaItem).where(MediaItem.id == media_id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")

    user_hist = None
    if current_user:
        hist_stmt = select(UserMediaHistory).where(
            UserMediaHistory.user_id == current_user.id,
            UserMediaHistory.media_item_id == media_id
        )
        hist_res = await db.execute(hist_stmt)
        user_hist = hist_res.scalars().first()

    return MediaItemDetailResponse(
        id=item.id,
        media_type=item.media_type,
        title=item.title,
        external_id=item.external_id,
        synopsis=item.synopsis,
        themes=item.themes or [],
        sub_genres=item.sub_genres or [],
        raw_metadata=item.raw_metadata or {},
        user_history=UserMediaHistoryResponse.model_validate(user_hist) if user_hist else None
    )
