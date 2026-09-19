from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, UserPreference
from app.schemas import UserPreferenceUpdate, UserPreferenceResponse
from app.auth import get_current_user
from app.preference_defaults import DEFAULT_PREFERENCE_FIELDS, preference_kwargs_from_update

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
            **DEFAULT_PREFERENCE_FIELDS
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
        **preference_kwargs_from_update(pref_in)
    )
    db.add(new_pref)
    await db.commit()
    await db.refresh(new_pref)

    return new_pref
