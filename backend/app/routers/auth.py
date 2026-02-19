from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, UserPreference
from app.schemas import UserSignup, UserLogin, Token, UserResponse
from app.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserSignup, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(user)
    await db.flush()

    # Create default preference version 1
    default_pref = UserPreference(
        user_id=user.id,
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
    db.add(default_pref)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)
