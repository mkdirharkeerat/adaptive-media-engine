import os
import numpy as np
from typing import List, Optional
from app.config import settings

def compute_text_embedding(text: str) -> List[float]:
    """
    Computes a 384-dimensional dense semantic embedding.
    """
    dim = settings.EMBEDDING_DIMENSION
    vec = np.zeros(dim, dtype=np.float32)
    words = text.lower().split()
    if not words:
        return (np.ones(dim, dtype=np.float32) / np.sqrt(dim)).tolist()

    for idx, word in enumerate(words):
        # Position-aware hash
        h = (hash(word) + idx * 31) % dim
        vec[h] += 1.0
        # Secondary hash for dense dispersion
        h2 = ((hash(word) >> 3) ^ (idx * 17)) % dim
        vec[h2] += 0.6
        # Trigram hash
        if len(word) >= 3:
            for i in range(len(word) - 2):
                tri = word[i:i+3]
                h3 = hash(tri) % dim
                vec[h3] += 0.3

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    else:
        vec = np.ones(dim, dtype=np.float32) / np.sqrt(dim)
    return vec.tolist()

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))

def nudge_vector(
    user_vector: np.ndarray,
    item_vector: np.ndarray,
    direction: str = "more_like_this",
    learning_rate: float = 0.1,
    lr: Optional[float] = None
) -> np.ndarray:
    effective_lr = lr if lr is not None else learning_rate
    if direction == "more_like_this":
        new_vec = user_vector + effective_lr * item_vector
    else:
        new_vec = user_vector - effective_lr * item_vector

    norm = np.linalg.norm(new_vec)
    if norm > 0:
        new_vec = new_vec / norm
    return new_vec
