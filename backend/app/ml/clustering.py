import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

SUB_GENRE_MAP = {
    0: "Atmospheric Speculative Sci-Fi & Dystopia",
    1: "Morally-Gray Crime, Noir & High-Stakes Power Struggles",
    2: "Introspective Character Study & Slice of Life",
    3: "Kinetic Survival Action & High-Octane Thrillers",
    4: "Hard Science, Macro-Civilization & Cosmic Mysteries",
    5: "Subversive Dark Satire, Absurdist & Witty Comedy",
    6: "Documentary, Investigative & Real-World Non-Fiction",
    7: "Self-Improvement, Psychology & Personal Mastery",
}

def evaluate_optimal_clusters(embeddings: List[List[float]], max_k: int = 6) -> Dict[str, Any]:
    """
    Evaluates KMeans clustering across multiple values of K using the Silhouette Score.
    """
    X = np.array(embeddings, dtype=np.float32)
    n_samples = len(X)
    
    if n_samples < 4:
        return {
            "optimal_k": 2,
            "silhouette_scores": {2: 0.5},
            "best_silhouette": 0.5
        }
    
    upper_k = min(max_k, n_samples - 1)
    scores = {}
    best_k = 2
    best_score = -1.0
    
    for k in range(2, upper_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X)
        score = float(silhouette_score(X, labels))
        scores[k] = round(score, 4)
        if score > best_score:
            best_score = score
            best_k = k
            
    return {
        "optimal_k": best_k,
        "silhouette_scores": scores,
        "best_silhouette": round(best_score, 4)
    }

def cluster_media_items(embeddings: List[List[float]], n_clusters: int = 6) -> List[int]:
    """
    Clusters media item embeddings into fine-grained sub-genres using KMeans.
    """
    if not embeddings:
        return []
        
    X = np.array(embeddings, dtype=np.float32)
    effective_k = min(n_clusters, len(X))
    
    if effective_k <= 1:
        return [0] * len(X)
        
    kmeans = KMeans(n_clusters=effective_k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X)
    return cluster_labels.tolist()

def get_sub_genre_name(cluster_id: int) -> str:
    return SUB_GENRE_MAP.get(cluster_id % len(SUB_GENRE_MAP), "Contemporary Narrative")
