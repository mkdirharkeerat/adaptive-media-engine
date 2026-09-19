from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    created_at: Optional[datetime] = None

# --- User Preferences (Feature 1 - Values Selector) ---
def _none_to_list(v):
    return v or []


def _none_to_dict(v):
    return v or {}


class UserPreferenceBase(BaseModel):
    sub_genre_values: Dict[str, str] = Field(
        default_factory=lambda: {
            "romance": "any",
            "action": "any",
            "protagonists": "any",
            "tone": "any"
        }
    )
    pacing: float = Field(0.5, ge=0.0, le=1.0)
    viewing_context: List[str] = Field(default_factory=lambda: ["casual"])
    intensity: float = Field(0.6, ge=0.0, le=1.0)
    language_mix_ok: bool = True
    preferred_genres: List[str] = Field(default_factory=list)
    pacing_bands: List[str] = Field(default_factory=lambda: ["balanced"])
    pacing_by_mode: Dict[str, List[str]] = Field(default_factory=dict)
    content_modes: List[str] = Field(default_factory=lambda: ["fiction", "entertainment"])
    content_intent: List[str] = Field(default_factory=list)

    @field_validator("preferred_genres", "pacing_bands", "content_modes", "content_intent", "viewing_context", mode="before")
    @classmethod
    def coerce_list(cls, v):
        return _none_to_list(v)

    @field_validator("pacing_by_mode", "sub_genre_values", mode="before")
    @classmethod
    def coerce_dict(cls, v):
        return _none_to_dict(v)

class UserPreferenceUpdate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    version: int
    created_at: Optional[datetime] = None

# --- Media Items ---
class MediaItemBase(BaseModel):
    media_type: str
    title: str
    external_id: Optional[str] = None
    synopsis: str
    themes: List[str] = Field(default_factory=list)
    sub_genres: List[str] = Field(default_factory=list)
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)

class MediaItemResponse(MediaItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None

# --- Media History (Feature 2 & 7 - Implicit Depth) ---
class EpisodeProgressItem(BaseModel):
    number: int
    completed: bool = False

class UserMediaHistoryCreate(BaseModel):
    media_item_id: int
    completion_pct: float = Field(100.0, ge=0.0, le=100.0)
    rewatch_count: int = Field(0, ge=0)
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    episode_progress: List[Dict[str, Any]] = Field(default_factory=list)
    drop_off_point: Optional[int] = None

class UserMediaHistoryUpdate(BaseModel):
    completion_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    rewatch_count: Optional[int] = Field(None, ge=0)
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    episode_progress: Optional[List[Dict[str, Any]]] = None
    drop_off_point: Optional[int] = None

class UserMediaHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    media_item_id: int
    completion_pct: float
    rewatch_count: int
    rating: Optional[float]
    episode_progress: List[Dict[str, Any]]
    drop_off_point: Optional[int]
    created_at: Optional[datetime] = None
    media_item: Optional[MediaItemResponse] = None

class HistoryImportResult(BaseModel):
    imported_count: int
    format_detected: str
    items: List[UserMediaHistoryResponse]

# --- Recommendations (Feature 4 & 6 - Grounded Reasoning & Fixed Batches) ---
class CitedHistorySummary(BaseModel):
    history_id: int
    title: str
    media_type: str
    completion_pct: float
    rating: Optional[float] = None
    rewatch_count: int = 0

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[int] = None
    user_id: int
    media_item_id: int
    reasoning_text: str
    cited_history_ids: List[int]
    cited_items: List[CitedHistorySummary] = Field(default_factory=list)
    preference_version: int
    batch_number: int = 1
    media_item: MediaItemResponse
    match_reasons: List[str] = Field(default_factory=list)
    content_modes: List[str] = Field(default_factory=list)
    canonical_genres: List[str] = Field(default_factory=list)

class RecommendationBatchResponse(BaseModel):
    batch_number: int
    media_type: Optional[str] = None
    content_mode: Optional[str] = None
    genre: Optional[str] = None
    items: List[RecommendationResponse]
    has_more: bool = True
    context_mode: Optional[str] = None
    depth_ratio: Optional[float] = None

# --- Feedback (Feature 8 - Online Nudge) ---
class FeedbackCreate(BaseModel):
    media_item_id: int
    direction: str = Field(..., pattern="^(more_like_this|less_like_this)$")

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    media_item_id: int
    direction: str
    created_at: Optional[datetime] = None
    message: str

class MediaItemDetailResponse(MediaItemResponse):
    user_history: Optional[UserMediaHistoryResponse] = None
