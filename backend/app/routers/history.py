import io
import csv
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, UserMediaHistory, MediaItem, ItemEmbedding
from app.schemas import (
    UserMediaHistoryCreate,
    UserMediaHistoryUpdate,
    UserMediaHistoryResponse,
    HistoryImportResult
)
from app.auth import get_current_user
from app.ml.embeddings import compute_text_embedding

router = APIRouter(prefix="/history", tags=["history"])

@router.get("", response_model=List[UserMediaHistoryResponse])
async def get_user_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserMediaHistory)
        .where(UserMediaHistory.user_id == current_user.id)
        .options(selectinload(UserMediaHistory.media_item))
        .order_by(UserMediaHistory.created_at.desc())
    )
    res = await db.execute(stmt)
    history_items = res.scalars().all()
    return history_items

@router.post("", response_model=UserMediaHistoryResponse, status_code=status.HTTP_201_CREATED)
async def add_history_item(
    hist_in: UserMediaHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify media item exists
    item_stmt = select(MediaItem).where(MediaItem.id == hist_in.media_item_id)
    item_res = await db.execute(item_stmt)
    media_item = item_res.scalars().first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found")

    # Check if history record already exists for this user and item
    existing_stmt = select(UserMediaHistory).where(
        UserMediaHistory.user_id == current_user.id,
        UserMediaHistory.media_item_id == hist_in.media_item_id
    )
    existing_res = await db.execute(existing_stmt)
    existing = existing_res.scalars().first()

    if existing:
        existing.completion_pct = hist_in.completion_pct
        existing.rewatch_count = hist_in.rewatch_count
        existing.rating = hist_in.rating
        existing.episode_progress = hist_in.episode_progress
        existing.drop_off_point = hist_in.drop_off_point
        await db.commit()
        await db.refresh(existing)
        # Reload relation
        stmt = select(UserMediaHistory).where(UserMediaHistory.id == existing.id).options(selectinload(UserMediaHistory.media_item))
        res = await db.execute(stmt)
        return res.scalars().first()

    new_hist = UserMediaHistory(
        user_id=current_user.id,
        media_item_id=hist_in.media_item_id,
        completion_pct=hist_in.completion_pct,
        rewatch_count=hist_in.rewatch_count,
        rating=hist_in.rating,
        episode_progress=hist_in.episode_progress,
        drop_off_point=hist_in.drop_off_point
    )
    db.add(new_hist)
    await db.commit()
    await db.refresh(new_hist)

    stmt = select(UserMediaHistory).where(UserMediaHistory.id == new_hist.id).options(selectinload(UserMediaHistory.media_item))
    res = await db.execute(stmt)
    return res.scalars().first()

@router.patch("/{history_id}", response_model=UserMediaHistoryResponse)
async def update_history_item(
    history_id: int,
    hist_update: UserMediaHistoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserMediaHistory)
        .where(UserMediaHistory.id == history_id, UserMediaHistory.user_id == current_user.id)
        .options(selectinload(UserMediaHistory.media_item))
    )
    res = await db.execute(stmt)
    history_record = res.scalars().first()
    if not history_record:
        raise HTTPException(status_code=404, detail="History record not found")

    if hist_update.completion_pct is not None:
        history_record.completion_pct = hist_update.completion_pct
    if hist_update.rewatch_count is not None:
        history_record.rewatch_count = hist_update.rewatch_count
    if hist_update.rating is not None:
        history_record.rating = hist_update.rating
    if hist_update.episode_progress is not None:
        history_record.episode_progress = hist_update.episode_progress
    if hist_update.drop_off_point is not None:
        history_record.drop_off_point = hist_update.drop_off_point

    await db.commit()
    await db.refresh(history_record)
    return history_record

@router.post("/import", response_model=HistoryImportResult)
async def import_history(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Onboarding - Import history:
    Auto-detects Letterboxd, Goodreads, or Steam/Generic CSV/JSON export formats.
    """
    content = await file.read()
    filename = file.filename.lower()
    imported_records = []
    detected_format = "generic"

    if filename.endswith(".json"):
        detected_format = "json"
        try:
            data = json.loads(content.decode("utf-8"))
            if not isinstance(data, list):
                data = [data]
            for row in data:
                title = row.get("title") or row.get("Name") or row.get("game") or row.get("book") or "Untitled"
                m_type = row.get("media_type") or ("book" if "book" in row or "author" in row else "movie")
                rating = float(row.get("rating", 4.0)) if row.get("rating") else 4.0
                comp = float(row.get("completion_pct", 100.0))
                
                # Check or create media item
                m_item = await _get_or_create_media_item(db, title, m_type, row.get("synopsis", ""))
                hist = UserMediaHistory(
                    user_id=current_user.id,
                    media_item_id=m_item.id,
                    completion_pct=comp,
                    rewatch_count=int(row.get("rewatch_count", 0)),
                    rating=rating,
                    episode_progress=[]
                )
                db.add(hist)
                imported_records.append(hist)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file: {e}")

    else:
        # CSV parsing
        try:
            text_stream = io.StringIO(content.decode("utf-8", errors="ignore"))
            reader = csv.DictReader(text_stream)
            headers = [h.strip().lower() for h in (reader.fieldnames or [])]

            # Detect format
            if "letterboxd uri" in headers or "name" in headers and "year" in headers and "rating" in headers:
                detected_format = "Letterboxd CSV"
            elif "book id" in headers or "my rating" in headers or "bookshelves" in headers:
                detected_format = "Goodreads CSV"
            elif "appid" in headers or "playtime_forever" in headers:
                detected_format = "Steam CSV"
            else:
                detected_format = "Generic CSV"

            for row in reader:
                # Format normalization
                title = (
                    row.get("Name") or row.get("Title") or row.get("title") or 
                    row.get("Game Title") or row.get("Book Title")
                )
                if not title or not title.strip():
                    continue
                title = title.strip()

                m_type = "movie"
                rating = None
                comp = 100.0

                if detected_format == "Letterboxd CSV":
                    m_type = "movie"
                    if row.get("Rating"):
                        try:
                            rating = float(row["Rating"])
                        except ValueError:
                            pass
                elif detected_format == "Goodreads CSV":
                    m_type = "book"
                    if row.get("My Rating"):
                        try:
                            r = float(row["My Rating"])
                            if r > 0:
                                rating = r
                        except ValueError:
                            pass
                elif detected_format == "Steam CSV":
                    m_type = "tv" # Interactive or series mapping
                    comp = 100.0
                else:
                    m_type = row.get("media_type", "movie")
                    if row.get("rating"):
                        try:
                            rating = float(row["rating"])
                        except ValueError:
                            pass

                m_item = await _get_or_create_media_item(db, title, m_type, synopsis=f"Imported from {detected_format}")
                hist = UserMediaHistory(
                    user_id=current_user.id,
                    media_item_id=m_item.id,
                    completion_pct=comp,
                    rewatch_count=0,
                    rating=rating,
                    episode_progress=[]
                )
                db.add(hist)
                imported_records.append(hist)

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {e}")

    await db.commit()

    # Re-query with relations
    stmt = (
        select(UserMediaHistory)
        .where(UserMediaHistory.user_id == current_user.id)
        .options(selectinload(UserMediaHistory.media_item))
        .order_by(UserMediaHistory.created_at.desc())
        .limit(len(imported_records))
    )
    res = await db.execute(stmt)
    saved_items = res.scalars().all()

    return HistoryImportResult(
        imported_count=len(imported_records),
        format_detected=detected_format,
        items=saved_items
    )

async def _get_or_create_media_item(db: AsyncSession, title: str, media_type: str, synopsis: str = "") -> MediaItem:
    stmt = select(MediaItem).where(MediaItem.title.ilike(title), MediaItem.media_type == media_type)
    res = await db.execute(stmt)
    existing = res.scalars().first()
    if existing:
        return existing

    new_item = MediaItem(
        media_type=media_type,
        title=title,
        synopsis=synopsis or f"{title} - A compelling {media_type} title.",
        themes=["intriguing", "narrative", media_type],
        sub_genres=["General"],
        raw_metadata={"pacing": 0.5, "intensity": 0.5, "total_episodes": 10 if media_type == "tv" else 1}
    )
    db.add(new_item)
    await db.flush()

    # Create embedding
    emb_vec = compute_text_embedding(f"{new_item.title} {new_item.synopsis}")
    db.add(ItemEmbedding(media_item_id=new_item.id, embedding=emb_vec))
    await db.flush()

    return new_item
