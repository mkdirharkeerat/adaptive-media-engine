from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, UserPreference
from app.schemas import UserPreferenceUpdate, UserPreferenceResponse
from app.auth import get_current_user

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.get("", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserPreference)
        .where(UserPreference.user_id == current_user.id)
        .order_by(UserPreference.version.desc())
    )
    res = await db.execute(stmt)
    pref = res.scalars().first()

    if not pref:
        # Create initial default if not found
        pref = UserPreference(
            user_id=current_user.id,
            version=1,
            sub_genre_values={
                "romance": "slow-burn",
                "action": "raw/gritty",
                "protagonists": "morally-gray",
                "tone": "challenging"
            },
            pacing=0.5,
            viewing_context=["casual", "binge"],
            intensity=0.6,
            language_mix_ok=True
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return pref

@router.put("", response_model=UserPreferenceResponse)
async def update_preferences(
    pref_in: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Feature 1 - Values Selector (Versioned):
    Creates a new version row so past recommendations remain traceable to the exact preference state that produced them.
    """
    stmt = (
        select(UserPreference)
        .where(UserPreference.user_id == current_user.id)
        .order_by(UserPreference.version.desc())
    )
    res = await db.execute(stmt)
    latest_pref = res.scalars().first()

    new_version = (latest_pref.version + 1) if latest_pref else 1

    new_pref = UserPreference(
        user_id=current_user.id,
        version=new_version,
        sub_genre_values=pref_in.sub_genre_values,
        pacing=pref_in.pacing,
        viewing_context=pref_in.viewing_context,
        intensity=pref_in.intensity,
        language_mix_ok=pref_in.language_mix_ok
    )
    db.add(new_pref)
    await db.commit()
    await db.refresh(new_pref)

    return new_pref
