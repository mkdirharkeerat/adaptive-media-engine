from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, JSON, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base, is_sqlite
from app.config import settings

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    media_history = relationship("UserMediaHistory", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    feedback_events = relationship("FeedbackEvent", back_populates="user", cascade="all, delete-orphan")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    sub_genre_values = Column(JSON, default=dict, nullable=False)
    pacing = Column(Float, default=0.5, nullable=False)
    viewing_context = Column(JSON, default=list, nullable=False)
    intensity = Column(Float, default=0.5, nullable=False)
    language_mix_ok = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="preferences")

class MediaItem(Base):
    __tablename__ = "media_items"

    id = Column(Integer, primary_key=True, index=True)
    media_type = Column(String(50), index=True, nullable=False) # 'movie', 'tv', 'book'
    title = Column(String(255), index=True, nullable=False)
    external_id = Column(String(100), index=True, nullable=True)
    synopsis = Column(Text, nullable=False)
    themes = Column(JSON, default=list, nullable=False)
    sub_genres = Column(JSON, default=list, nullable=False)
    raw_metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    embedding_record = relationship("ItemEmbedding", back_populates="media_item", uselist=False, cascade="all, delete-orphan")
    user_history = relationship("UserMediaHistory", back_populates="media_item", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="media_item", cascade="all, delete-orphan")

class ItemEmbedding(Base):
    __tablename__ = "item_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    media_item_id = Column(Integer, ForeignKey("media_items.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    if is_sqlite:
        embedding = Column(JSON, nullable=False)
    else:
        embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)

    media_item = relationship("MediaItem", back_populates="embedding_record")

class UserMediaHistory(Base):
    __tablename__ = "user_media_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_item_id = Column(Integer, ForeignKey("media_items.id", ondelete="CASCADE"), nullable=False, index=True)
    
    completion_pct = Column(Float, default=100.0, nullable=False)
    rewatch_count = Column(Integer, default=0, nullable=False)
    rating = Column(Float, nullable=True)
    episode_progress = Column(JSON, default=list, nullable=False)
    drop_off_point = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="media_history")
    media_item = relationship("MediaItem", back_populates="user_history")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_item_id = Column(Integer, ForeignKey("media_items.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reasoning_text = Column(Text, nullable=False)
    cited_history_ids = Column(JSON, default=list, nullable=False)
    preference_version = Column(Integer, nullable=False)
    batch_number = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="recommendations")
    media_item = relationship("MediaItem", back_populates="recommendations")

class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_item_id = Column(Integer, ForeignKey("media_items.id", ondelete="CASCADE"), nullable=False, index=True)
    direction = Column(String(50), nullable=False) # 'more_like_this', 'less_like_this'
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="feedback_events")
