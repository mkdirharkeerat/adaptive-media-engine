#!/usr/bin/env python3
"""
Adaptive Media Engine - Real-World Neural Recommendation Model
Dataset: MovieLens 100K (100,836 real user ratings on 9,742 movies)
Architecture: Hybrid Neural Matrix Factorization (NeuMF) with Genre Context on Apple Silicon Metal (MPS)
"""

import os
import sys
import time
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "movielens", "ml-latest-small"))
SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "saved_models"))
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

MODEL_SAVE_PATH = os.path.join(SAVED_MODELS_DIR, "real_world_neumf.pt")
METRICS_SAVE_PATH = os.path.join(SAVED_MODELS_DIR, "real_world_neumf_metrics.json")

# -----------------------------------------------------------------------------
# 1. DATASET PREPROCESSING & MULTI-HOT GENRE ENCODING
# -----------------------------------------------------------------------------
class MovieLensDataset(Dataset):
    def __init__(self, df: pd.DataFrame, genre_matrix: np.ndarray):
        self.users = torch.tensor(df["user_idx"].values, dtype=torch.long)
        self.items = torch.tensor(df["item_idx"].values, dtype=torch.long)
        self.ratings = torch.tensor(df["rating"].values, dtype=torch.float32)
        self.genres = torch.tensor(genre_matrix[df["item_idx"].values], dtype=torch.float32)

    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.genres[idx], self.ratings[idx]


# -----------------------------------------------------------------------------
# 2. HYBRID NEURAL COLLABORATIVE FILTERING (NeuMF + Content Embeddings)
# -----------------------------------------------------------------------------
class HybridNeuMF(nn.Module):
    def __init__(self, num_users: int, num_items: int, num_genres: int, latent_dim: int = 64):
        super().__init__()
        self.num_users = num_users
        self.num_items = num_items

        # GMF (Generalized Matrix Factorization) Embeddings
        self.gmf_user_emb = nn.Embedding(num_users, latent_dim)
        self.gmf_item_emb = nn.Embedding(num_items, latent_dim)

        # MLP Embeddings
        self.mlp_user_emb = nn.Embedding(num_users, latent_dim)
        self.mlp_item_emb = nn.Embedding(num_items, latent_dim)

        # Genre feature projection
        self.genre_proj = nn.Sequential(
            nn.Linear(num_genres, 32),
            nn.LayerNorm(32),
            nn.GELU()
        )

        # Deep MLP layers
        self.mlp_layers = nn.Sequential(
            nn.Linear(latent_dim * 2, 128),
            nn.LayerNorm(128),
            nn.GELU(),
            nn.Dropout(0.15),
            nn.Linear(128, 64),
            nn.LayerNorm(64),
            nn.GELU(),
            nn.Dropout(0.15),
            nn.Linear(64, 32),
            nn.LayerNorm(32),
            nn.GELU()
        )

        # Final NeuMF prediction head: GMF (64) + MLP (32) + Genre (32) = 128
        self.head = nn.Sequential(
            nn.Linear(latent_dim + 32 + 32, 64),
            nn.GELU(),
            nn.Linear(64, 1)
        )

        # Weight initialization
        self._init_weights()

    def _init_weights(self):
        nn.init.normal_(self.gmf_user_emb.weight, std=0.01)
        nn.init.normal_(self.gmf_item_emb.weight, std=0.01)
        nn.init.normal_(self.mlp_user_emb.weight, std=0.01)
        nn.init.normal_(self.mlp_item_emb.weight, std=0.01)

    def forward(self, user_idx: torch.Tensor, item_idx: torch.Tensor, genres: torch.Tensor) -> torch.Tensor:
        # GMF Branch
        gmf_u = self.gmf_user_emb(user_idx)
        gmf_i = self.gmf_item_emb(item_idx)
        gmf_out = gmf_u * gmf_i  # element-wise interaction

        # MLP Branch
        mlp_u = self.mlp_user_emb(user_idx)
        mlp_i = self.mlp_item_emb(item_idx)
        mlp_in = torch.cat([mlp_u, mlp_i], dim=-1)
        mlp_out = self.mlp_layers(mlp_in)

        # Genre Context Branch
        genre_out = self.genre_proj(genres)

        # Concat all latent representations
        fusion = torch.cat([gmf_out, mlp_out, genre_out], dim=-1)
        pred_rating = self.head(fusion).squeeze(-1)
        return pred_rating


# -----------------------------------------------------------------------------
# 3. TRAIN & EVALUATE PIPELINE
# -----------------------------------------------------------------------------
def load_and_prepare_data():
    ratings_path = os.path.join(DATA_DIR, "ratings.csv")
    movies_path = os.path.join(DATA_DIR, "movies.csv")

    if not os.path.exists(ratings_path) or not os.path.exists(movies_path):
        raise FileNotFoundError(f"MovieLens data files not found in {DATA_DIR}")

    df_ratings = pd.read_csv(ratings_path)
    df_movies = pd.read_csv(movies_path)

    # Encode user and movie IDs to continuous indices [0, N-1]
    unique_users = df_ratings["userId"].unique()
    unique_movies = df_movies["movieId"].unique()

    user2idx = {u: i for i, u in enumerate(unique_users)}
    movie2idx = {m: i for i, m in enumerate(unique_movies)}

    # Filter ratings for movies present in movies.csv
    df_ratings = df_ratings[df_ratings["movieId"].isin(movie2idx)].copy()
    df_ratings["user_idx"] = df_ratings["userId"].map(user2idx)
    df_ratings["item_idx"] = df_ratings["movieId"].map(movie2idx)

    # Multi-hot genre encoding
    all_genres = sorted(list(set(
        g for sublist in df_movies["genres"].str.split("|") for g in sublist if g != "(no genres listed)"
    )))
    genre2idx = {g: i for i, g in enumerate(all_genres)}
    num_genres = len(all_genres)

    genre_matrix = np.zeros((len(unique_movies), num_genres), dtype=np.float32)
    for _, row in df_movies.iterrows():
        m_idx = movie2idx[row["movieId"]]
        for g in str(row["genres"]).split("|"):
            if g in genre2idx:
                genre_matrix[m_idx, genre2idx[g]] = 1.0

    return df_ratings, df_movies, user2idx, movie2idx, genre_matrix, all_genres


def train_real_world_model(epochs: int = 8, batch_size: int = 512, lr: float = 2e-3):
    print("\n" + "=" * 76)
    print("  🚀 ADAPTIVE MEDIA ENGINE: REAL-WORLD MOVIELENS RECOMMENDATION TRAINING")
    print("=" * 76, flush=True)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"  • Compute Target   : {device} ({'Apple Silicon Metal Acceleration' if device.type == 'mps' else 'CPU'})")

    # Load Data
    df_ratings, df_movies, user2idx, movie2idx, genre_matrix, all_genres = load_and_prepare_data()
    num_users = len(user2idx)
    num_items = len(movie2idx)
    num_genres = len(all_genres)
    total_ratings = len(df_ratings)

    print(f"  • Real-World Data  : {total_ratings:,} ratings across {num_users:,} users and {num_items:,} movies")
    print(f"  • Unique Genres    : {num_genres} categories ({', '.join(all_genres[:5])}...)")

    # 80 / 20 Train-Test split
    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(df_ratings))
    split_pt = int(0.8 * len(df_ratings))
    train_indices = shuffled_indices[:split_pt]
    test_indices = shuffled_indices[split_pt:]

    train_df = df_ratings.iloc[train_indices].reset_index(drop=True)
    test_df = df_ratings.iloc[test_indices].reset_index(drop=True)

    train_dataset = MovieLensDataset(train_df, genre_matrix)
    test_dataset = MovieLensDataset(test_df, genre_matrix)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    # Initialize Hybrid NeuMF Model
    model = HybridNeuMF(num_users=num_users, num_items=num_items, num_genres=num_genres, latent_dim=64).to(device)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  • Neural Model     : Hybrid NeuMF ({total_params:,} parameters, {total_params*4/(1024**2):.2f} MB)")

    criterion = nn.SmoothL1Loss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    print("\n[Starting Training on Apple Metal GPU...]")
    print(f"  Epochs: {epochs} | Batch Size: {batch_size} | Batches/Epoch: {len(train_loader)}")
    print("-" * 76)

    history = []
    t_start = time.perf_counter()

    for epoch in range(1, epochs + 1):
        epoch_start = time.perf_counter()
        model.train()
        train_loss = 0.0

        for users, items, genres, ratings in train_loader:
            users, items, genres, ratings = users.to(device), items.to(device), genres.to(device), ratings.to(device)
            optimizer.zero_grad()
            preds = model(users, items, genres)
            loss = criterion(preds, ratings)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(ratings)

        if device.type == "mps":
            torch.mps.synchronize()

        scheduler.step()
        train_loss /= len(train_dataset)

        # Validation evaluation
        model.eval()
        val_sq_err = 0.0
        val_abs_err = 0.0
        with torch.no_grad():
            for users, items, genres, ratings in test_loader:
                users, items, genres, ratings = users.to(device), items.to(device), genres.to(device), ratings.to(device)
                preds = model(users, items, genres)
                val_sq_err += torch.sum((preds - ratings) ** 2).item()
                val_abs_err += torch.sum(torch.abs(preds - ratings)).item()

        val_rmse = np.sqrt(val_sq_err / len(test_dataset))
        val_mae = val_abs_err / len(test_dataset)
        epoch_time = time.perf_counter() - epoch_start
        throughput = len(train_dataset) / epoch_time

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_rmse": round(val_rmse, 4),
            "val_mae": round(val_mae, 4),
            "time_s": round(epoch_time, 2)
        })

        print(f"  Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val RMSE: {val_rmse:.4f} | Val MAE: {val_mae:.4f} | {throughput:,.0f} ratings/s ({epoch_time:.2f}s)")

    total_training_time = time.perf_counter() - t_start
    print("-" * 76)
    print(f"  ✓ Training completed in {total_training_time:.2f}s on Apple M5 GPU")
    print(f"  ✓ Final Val RMSE: {history[-1]['val_rmse']:.4f} | Val MAE: {history[-1]['val_mae']:.4f}")

    # Save Model Weights & Metadata
    torch.save({
        "model_state_dict": model.state_dict(),
        "num_users": num_users,
        "num_items": num_items,
        "num_genres": num_genres,
        "latent_dim": 64,
        "history": history
    }, MODEL_SAVE_PATH)

    metadata = {
        "dataset": "MovieLens 100K",
        "num_ratings": total_ratings,
        "num_users": num_users,
        "num_movies": num_items,
        "final_rmse": history[-1]["val_rmse"],
        "final_mae": history[-1]["val_mae"],
        "training_time_s": round(total_training_time, 2),
        "history": history
    }
    with open(METRICS_SAVE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    # -------------------------------------------------------------------------
    # 4. TEST INFERENCE: RECOMMEND REAL MOVIES FOR A REAL USER
    # -------------------------------------------------------------------------
    print("\n" + "=" * 76)
    print("  🎬 REAL-WORLD INFERENCE: ADAPTIVE RECOMMENDATIONS FOR USER #1")
    print("=" * 76)

    # Inspect what User #1 actually rated 5.0 in the real dataset
    u1_ratings = df_ratings[df_ratings["userId"] == 1].merge(df_movies, on="movieId")
    u1_favorites = u1_ratings.sort_values(by="rating", ascending=False).head(5)
    print("  User #1 Real Favorites in Dataset:")
    for _, r in u1_favorites.iterrows():
        print(f"    ⭐ {r['rating']} | {r['title']} ({r['genres']})")

    # Generate top recommendations for movies User #1 HAS NOT seen
    seen_movie_ids = set(u1_ratings["movieId"].tolist())
    unseen_df = df_movies[~df_movies["movieId"].isin(seen_movie_ids)].copy()

    unseen_movie_indices = torch.tensor([movie2idx[m] for m in unseen_df["movieId"]], dtype=torch.long, device=device)
    user_tensor = torch.tensor([user2idx[1]] * len(unseen_df), dtype=torch.long, device=device)
    genre_tensor = torch.tensor(genre_matrix[unseen_movie_indices.cpu().numpy()], dtype=torch.float32, device=device)

    model.eval()
    with torch.no_grad():
        predicted_ratings = model(user_tensor, unseen_movie_indices, genre_tensor).cpu().numpy()

    unseen_df["predicted_rating"] = predicted_ratings
    top_recs = unseen_df.sort_values(by="predicted_rating", ascending=False).head(8)

    print("\n  Top 8 Real-World Recommendations Generated by Model:")
    for rank, (_, row) in enumerate(top_recs.iterrows(), 1):
        print(f"    #{rank}  Predicted Score: {row['predicted_rating']:.2f}/5.0 | {row['title']} [{row['genres']}]")

    print("\n" + "=" * 76)
    print(f"  ✓ Model weights saved to: {MODEL_SAVE_PATH}")
    print(f"  ✓ Metrics saved to: {METRICS_SAVE_PATH}")
    print("=" * 76 + "\n")

if __name__ == "__main__":
    train_real_world_model()
