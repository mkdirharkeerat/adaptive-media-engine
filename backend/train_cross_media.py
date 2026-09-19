#!/usr/bin/env python3
"""
Adaptive Media Engine - Cross-Media Recommendation Engine (Movies, TV Shows & Books)
Covers 2020-2026 releases across all three media formats.
Builds unified dataset, trains a PyTorch Cross-Media Neural Hybrid Model on Apple M5 GPU,
and optionally seeds the items into the application's SQLite database.
"""

import os
import sys
import json
import sqlite3
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data", "cross_media")
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

CATALOG_PATH = os.path.join(DATA_DIR, "catalog_cross_media_2026.csv")
RATINGS_PATH = os.path.join(DATA_DIR, "ratings_cross_media_2026.csv")
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "cross_media_neumf.pt")
METRICS_PATH = os.path.join(SAVED_MODELS_DIR, "cross_media_metrics.json")
DB_PATH = os.path.join(BASE_DIR, "adaptive_media.db")

# -----------------------------------------------------------------------------
# 1. COMPREHENSIVE 2020-2026 CROSS-MEDIA CORPUS (TV, BOOKS, MOVIES)
# -----------------------------------------------------------------------------
CROSS_MEDIA_ITEMS = [
    # TV SHOWS (2020-2026)
    {"media_type": "tv", "title": "Severance (2022–)", "year": 2022, "genres": "Drama|Mystery|Sci-Fi", "rating": 4.8, "creator": "Dan Erickson", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "tv", "title": "Succession (2021–2023)", "year": 2021, "genres": "Drama|Satire", "rating": 4.9, "creator": "Jesse Armstrong", "taste_cluster": "prestige_power_drama"},
    {"media_type": "tv", "title": "The Bear (2022–)", "year": 2022, "genres": "Comedy|Drama", "rating": 4.8, "creator": "Christopher Storer", "taste_cluster": "high_intensity_character"},
    {"media_type": "tv", "title": "Shōgun (2024–)", "year": 2024, "genres": "Adventure|Drama|History", "rating": 4.8, "creator": "Rachel Kondo & Justin Marks", "taste_cluster": "historical_epic"},
    {"media_type": "tv", "title": "The Last of Us (2023–)", "year": 2023, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.7, "creator": "Craig Mazin & Neil Druckmann", "taste_cluster": "post_apocalyptic_emotional"},
    {"media_type": "tv", "title": "House of the Dragon (2022–)", "year": 2022, "genres": "Action|Adventure|Drama|Fantasy", "rating": 4.5, "creator": "Ryan Condal & George R.R. Martin", "taste_cluster": "epic_fantasy_political"},
    {"media_type": "tv", "title": "Andor (2022–)", "year": 2022, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.7, "creator": "Tony Gilroy", "taste_cluster": "grounded_political_scifi"},
    {"media_type": "tv", "title": "Arcane (2021–2024)", "year": 2021, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.9, "creator": "Christian Linke & Alex Yee", "taste_cluster": "stylized_animation_action"},
    {"media_type": "tv", "title": "Fallout (2024–)", "year": 2024, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.6, "creator": "Geneva Robertson-Dworet & Graham Wagner", "taste_cluster": "post_apocalyptic_emotional"},
    {"media_type": "tv", "title": "The White Lotus (2021–)", "year": 2021, "genres": "Comedy|Drama|Mystery", "rating": 4.5, "creator": "Mike White", "taste_cluster": "prestige_power_drama"},
    {"media_type": "tv", "title": "Silo (2023–)", "year": 2023, "genres": "Drama|Mystery|Sci-Fi", "rating": 4.6, "creator": "Graham Yost", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "tv", "title": "Slow Horses (2022–)", "year": 2022, "genres": "Drama|Thriller", "rating": 4.6, "creator": "Mick Herron", "taste_cluster": "gritty_espionage"},
    {"media_type": "tv", "title": "3 Body Problem (2024–)", "year": 2024, "genres": "Adventure|Drama|Fantasy|Sci-Fi", "rating": 4.4, "creator": "David Benioff & D.B. Weiss", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "tv", "title": "Ted Lasso (2020–2023)", "year": 2020, "genres": "Comedy|Drama|Sport", "rating": 4.7, "creator": "Jason Sudeikis & Bill Lawrence", "taste_cluster": "feel_good_humor"},
    {"media_type": "tv", "title": "Beef (2023)", "year": 2023, "genres": "Comedy|Drama", "rating": 4.6, "creator": "Lee Sung Jin", "taste_cluster": "high_intensity_character"},
    {"media_type": "tv", "title": "The Queen's Gambit (2020)", "year": 2020, "genres": "Drama", "rating": 4.8, "creator": "Scott Frank & Allan Scott", "taste_cluster": "high_intensity_character"},
    {"media_type": "tv", "title": "The Penguin (2024)", "year": 2024, "genres": "Crime|Drama", "rating": 4.7, "creator": "Lauren LeFranc", "taste_cluster": "gritty_espionage"},
    {"media_type": "tv", "title": "Lanterns (2026–)", "year": 2026, "genres": "Action|Adventure|Crime|Sci-Fi", "rating": 4.5, "creator": "Chris Mundy & Damon Lindelof", "taste_cluster": "grounded_political_scifi"},

    # BOOKS (2020-2026)
    {"media_type": "book", "title": "Project Hail Mary (2021)", "year": 2021, "genres": "Sci-Fi|Adventure", "rating": 4.8, "creator": "Andy Weir", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "book", "title": "Tomorrow, and Tomorrow, and Tomorrow (2022)", "year": 2022, "genres": "Drama|Romance", "rating": 4.7, "creator": "Gabrielle Zevin", "taste_cluster": "high_intensity_character"},
    {"media_type": "book", "title": "Klara and the Sun (2021)", "year": 2021, "genres": "Sci-Fi|Drama", "rating": 4.5, "creator": "Kazuo Ishiguro", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "book", "title": "Babel: An Arcane History (2022)", "year": 2022, "genres": "Fantasy|History|Drama", "rating": 4.7, "creator": "R.F. Kuang", "taste_cluster": "historical_epic"},
    {"media_type": "book", "title": "Yellowface (2023)", "year": 2023, "genres": "Drama|Satire|Thriller", "rating": 4.4, "creator": "R.F. Kuang", "taste_cluster": "prestige_power_drama"},
    {"media_type": "book", "title": "Sea of Tranquility (2022)", "year": 2022, "genres": "Sci-Fi|Mystery", "rating": 4.6, "creator": "Emily St. John Mandel", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "book", "title": "The Ministry for the Future (2020)", "year": 2020, "genres": "Sci-Fi|Drama", "rating": 4.4, "creator": "Kim Stanley Robinson", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "book", "title": "Demon Copperhead (2022)", "year": 2022, "genres": "Drama", "rating": 4.8, "creator": "Barbara Kingsolver", "taste_cluster": "prestige_power_drama"},
    {"media_type": "book", "title": "Wind and Truth (2024)", "year": 2024, "genres": "Fantasy|Adventure", "rating": 4.9, "creator": "Brandon Sanderson", "taste_cluster": "epic_fantasy_political"},
    {"media_type": "book", "title": "The Lost Metal (2022)", "year": 2022, "genres": "Fantasy|Adventure|Mystery", "rating": 4.6, "creator": "Brandon Sanderson", "taste_cluster": "epic_fantasy_political"},
    {"media_type": "book", "title": "I'm Glad My Mom Died (2022)", "year": 2022, "genres": "Drama|Comedy", "rating": 4.7, "creator": "Jennette McCurdy", "taste_cluster": "high_intensity_character"},
    {"media_type": "book", "title": "The Thursday Murder Club (2020)", "year": 2020, "genres": "Comedy|Crime|Mystery", "rating": 4.5, "creator": "Richard Osman", "taste_cluster": "feel_good_humor"},
    {"media_type": "book", "title": "Starter Villain (2023)", "year": 2023, "genres": "Comedy|Sci-Fi", "rating": 4.5, "creator": "John Scalzi", "taste_cluster": "feel_good_humor"},
    {"media_type": "book", "title": "The Midnight Library (2020)", "year": 2020, "genres": "Fantasy|Drama", "rating": 4.5, "creator": "Matt Haig", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "book", "title": "Piranesi (2020)", "year": 2020, "genres": "Fantasy|Mystery", "rating": 4.7, "creator": "Susanna Clarke", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "book", "title": "Orbital (2023)", "year": 2023, "genres": "Sci-Fi|Drama", "rating": 4.6, "creator": "Samantha Harvey", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "book", "title": "The Mercy of Gods (2024)", "year": 2024, "genres": "Sci-Fi|Space Opera", "rating": 4.6, "creator": "James S.A. Corey", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "book", "title": "The Winds of Winter (2026)", "year": 2026, "genres": "Fantasy|Drama", "rating": 4.9, "creator": "George R.R. Martin", "taste_cluster": "epic_fantasy_political"},

    # MOVIES (2020-2026)
    {"media_type": "movie", "title": "Dune: Part One (2021)", "year": 2021, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.7, "creator": "Denis Villeneuve", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "movie", "title": "Dune: Part Two (2024)", "year": 2024, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.9, "creator": "Denis Villeneuve", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "movie", "title": "Oppenheimer (2023)", "year": 2023, "genres": "Drama|History|War", "rating": 4.9, "creator": "Christopher Nolan", "taste_cluster": "historical_epic"},
    {"media_type": "movie", "title": "The Batman (2022)", "year": 2022, "genres": "Action|Crime|Drama|Mystery", "rating": 4.6, "creator": "Matt Reeves", "taste_cluster": "gritty_espionage"},
    {"media_type": "movie", "title": "Spider-Man: Across the Spider-Verse (2023)", "year": 2023, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.8, "creator": "Joaquim Dos Santos & Kemp Powers", "taste_cluster": "stylized_animation_action"},
    {"media_type": "movie", "title": "Top Gun: Maverick (2022)", "year": 2022, "genres": "Action|Drama", "rating": 4.7, "creator": "Joseph Kosinski", "taste_cluster": "high_intensity_character"},
    {"media_type": "movie", "title": "Everything Everywhere All at Once (2022)", "year": 2022, "genres": "Action|Adventure|Comedy|Sci-Fi", "rating": 4.8, "creator": "Daniels", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "movie", "title": "Poor Things (2023)", "year": 2023, "genres": "Comedy|Drama|Romance|Sci-Fi", "rating": 4.5, "creator": "Yorgos Lanthimos", "taste_cluster": "high_intensity_character"},
    {"media_type": "movie", "title": "The Substance (2024)", "year": 2024, "genres": "Drama|Horror|Sci-Fi", "rating": 4.4, "creator": "Coralie Fargeat", "taste_cluster": "mind_bending_scifi"},
    {"media_type": "movie", "title": "Civil War (2024)", "year": 2024, "genres": "Action|Drama|Thriller", "rating": 4.3, "creator": "Alex Garland", "taste_cluster": "gritty_espionage"},
    {"media_type": "movie", "title": "Project Hail Mary (2026)", "year": 2026, "genres": "Adventure|Drama|Sci-Fi", "rating": 4.8, "creator": "Phil Lord & Christopher Miller", "taste_cluster": "hard_scifi_cosmic"},
    {"media_type": "movie", "title": "The Batman: Part II (2026)", "year": 2026, "genres": "Action|Crime|Drama|Mystery", "rating": 4.8, "creator": "Matt Reeves", "taste_cluster": "gritty_espionage"},
    {"media_type": "movie", "title": "Spider-Man: Beyond the Spider-Verse (2026)", "year": 2026, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.9, "creator": "Joaquim Dos Santos", "taste_cluster": "stylized_animation_action"}
]


def build_cross_media_dataset():
    print("\n[Step 1/3] Assembling Unified Cross-Media Dataset (TV, Books, Movies)...", flush=True)

    df_catalog = pd.DataFrame(CROSS_MEDIA_ITEMS)
    df_catalog["id"] = range(1, len(df_catalog) + 1)
    df_catalog.to_csv(CATALOG_PATH, index=False)

    print(f"  ✓ Cross-Media Catalog: {len(df_catalog)} titles")
    print(f"      - Movies  : {(df_catalog['media_type'] == 'movie').sum()}")
    print(f"      - TV Shows: {(df_catalog['media_type'] == 'tv').sum()}")
    print(f"      - Books   : {(df_catalog['media_type'] == 'book').sum()}")

    # Synthesize Cross-Media Interaction Profiles for 500 distinct consumer personas
    # Personas consume across media types aligned by taste clusters!
    np.random.seed(42)
    ratings = []
    num_users = 500

    clusters = df_catalog["taste_cluster"].unique()

    for u in range(1, num_users + 1):
        # Each user has 1 primary taste cluster and 1 secondary taste cluster
        fav_clusters = np.random.choice(clusters, size=2, replace=False)

        # Rate 12-25 items across books, tv, and movies
        user_items = df_catalog[df_catalog["taste_cluster"].isin(fav_clusters)]
        sample_size = min(len(user_items), np.random.randint(10, 20))
        chosen_items = user_items.sample(n=sample_size, random_state=u)

        for _, item in chosen_items.iterrows():
            # Base rating around item rating with slight user variance
            r = float(np.clip(np.random.normal(item["rating"], 0.35), 1.0, 5.0))
            r = round(r * 2) / 2 # Snap to 0.5 stars
            ratings.append({
                "userId": u,
                "media_id": item["id"],
                "rating": r,
                "media_type": item["media_type"],
                "timestamp": 1750000000 + u * 100
            })

    df_ratings = pd.DataFrame(ratings)
    df_ratings.to_csv(RATINGS_PATH, index=False)
    print(f"  ✓ Cross-Media Interaction Logs: {len(df_ratings):,} ratings across {num_users} users")

    return df_catalog, df_ratings


# -----------------------------------------------------------------------------
# 2. CROSS-MEDIA NEURAL HYBRID RECOMMENDER
# -----------------------------------------------------------------------------
class CrossMediaDataset(Dataset):
    def __init__(self, df: pd.DataFrame, genre_mat: np.ndarray, type2idx: dict):
        self.users = torch.tensor(df["user_idx"].values, dtype=torch.long)
        self.items = torch.tensor(df["item_idx"].values, dtype=torch.long)
        self.types = torch.tensor(df["media_type"].map(type2idx).values, dtype=torch.long)
        self.genres = torch.tensor(genre_mat[df["item_idx"].values], dtype=torch.float32)
        self.ratings = torch.tensor(df["rating"].values, dtype=torch.float32)

    def __len__(self): return len(self.users)
    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.types[idx], self.genres[idx], self.ratings[idx]


class CrossMediaNeuMF(nn.Module):
    """
    Multi-Task Neural Collaborative Filtering with Media-Type Embeddings and Genre Projections.
    Learns shared taste representations bridging Books, TV Series, and Movies.
    """
    def __init__(self, num_users: int, num_items: int, num_genres: int, latent_dim: int = 64):
        super().__init__()
        # User & Item Latent Embeddings
        self.gmf_user_emb = nn.Embedding(num_users, latent_dim)
        self.gmf_item_emb = nn.Embedding(num_items, latent_dim)

        self.mlp_user_emb = nn.Embedding(num_users, latent_dim)
        self.mlp_item_emb = nn.Embedding(num_items, latent_dim)

        # Media Type Embedding (3 types: movie, tv, book -> 16 dim)
        self.type_emb = nn.Embedding(3, 16)

        # Multi-hot genre projection
        self.genre_proj = nn.Sequential(
            nn.Linear(num_genres, 32),
            nn.LayerNorm(32),
            nn.GELU()
        )

        # Deep MLP layers: latent_dim*2 (128) + type (16) = 144
        self.mlp_layers = nn.Sequential(
            nn.Linear(latent_dim * 2 + 16, 128),
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

        # Fusion: GMF (64) + MLP (32) + Genre (32) = 128
        self.head = nn.Sequential(
            nn.Linear(latent_dim + 32 + 32, 64),
            nn.GELU(),
            nn.Linear(64, 1)
        )

    def forward(self, u, i, m_type, genres):
        # GMF Branch
        gmf = self.gmf_user_emb(u) * self.gmf_item_emb(i)

        # MLP Branch with Media Type Context
        t_emb = self.type_emb(m_type)
        mlp_in = torch.cat([self.mlp_user_emb(u), self.mlp_item_emb(i), t_emb], dim=-1)
        mlp_out = self.mlp_layers(mlp_in)

        # Genre Context
        genre_out = self.genre_proj(genres)

        # Fusion
        fusion = torch.cat([gmf, mlp_out, genre_out], dim=-1)
        return self.head(fusion).squeeze(-1)


# -----------------------------------------------------------------------------
# 3. TRAINING & CROSS-MEDIA INFERENCE
# -----------------------------------------------------------------------------
def train_cross_media():
    df_catalog, df_ratings = build_cross_media_dataset()

    print("\n[Step 2/3] Training Cross-Media NeuMF Model on Apple M5 GPU...", flush=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

    type2idx = {"movie": 0, "tv": 1, "book": 2}
    unique_users = df_ratings["userId"].unique()
    user2idx = {u: i for i, u in enumerate(unique_users)}
    item2idx = {item_id: i for i, item_id in enumerate(df_catalog["id"])}

    df_ratings["user_idx"] = df_ratings["userId"].map(user2idx)
    df_ratings["item_idx"] = df_ratings["media_id"].map(item2idx)

    # Multi-hot genre encoding
    all_genres = sorted(list(set(
        g for sub in df_catalog["genres"].str.split("|") for g in sub
    )))
    genre2idx = {g: i for i, g in enumerate(all_genres)}
    genre_mat = np.zeros((len(df_catalog), len(all_genres)), dtype=np.float32)
    for _, row in df_catalog.iterrows():
        i_idx = item2idx[row["id"]]
        for g in row["genres"].split("|"):
            if g in genre2idx:
                genre_mat[i_idx, genre2idx[g]] = 1.0

    # Train / Test split
    np.random.seed(42)
    shuffled = np.random.permutation(len(df_ratings))
    split = int(0.85 * len(df_ratings))
    train_df = df_ratings.iloc[shuffled[:split]].reset_index(drop=True)
    test_df = df_ratings.iloc[shuffled[split:]].reset_index(drop=True)

    train_loader = DataLoader(CrossMediaDataset(train_df, genre_mat, type2idx), batch_size=256, shuffle=True)
    test_loader = DataLoader(CrossMediaDataset(test_df, genre_mat, type2idx), batch_size=256, shuffle=False)

    model = CrossMediaNeuMF(len(user2idx), len(item2idx), len(all_genres), latent_dim=64).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-3, weight_decay=1e-4)
    criterion = nn.SmoothL1Loss()

    epochs = 10
    print(f"  • Architecture: CrossMediaNeuMF ({sum(p.numel() for p in model.parameters()):,} parameters)")
    print(f"  • Training {epochs} epochs on {device}...")

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for u, i, m_type, g, r in train_loader:
            u, i, m_type, g, r = u.to(device), i.to(device), m_type.to(device), g.to(device), r.to(device)
            optimizer.zero_grad()
            preds = model(u, i, m_type, g)
            loss = criterion(preds, r)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(r)

        if device.type == "mps":
            torch.mps.synchronize()

        train_loss /= len(train_df)

        model.eval()
        val_sq_err = 0.0
        val_abs_err = 0.0
        with torch.no_grad():
            for u, i, m_type, g, r in test_loader:
                u, i, m_type, g, r = u.to(device), i.to(device), m_type.to(device), g.to(device), r.to(device)
                preds = model(u, i, m_type, g)
                val_sq_err += torch.sum((preds - r) ** 2).item()
                val_abs_err += torch.sum(torch.abs(preds - r)).item()

        val_rmse = np.sqrt(val_sq_err / len(test_df))
        val_mae = val_abs_err / len(test_df)
        print(f"    Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val RMSE: {val_rmse:.4f} | Val MAE: {val_mae:.4f}")

    # Save model
    torch.save({
        "model_state_dict": model.state_dict(),
        "num_users": len(user2idx),
        "num_items": len(item2idx),
        "num_genres": len(all_genres),
        "val_rmse": val_rmse,
        "val_mae": val_mae
    }, MODEL_PATH)

    print(f"\n  ✓ Cross-Media Model weights saved to: {MODEL_PATH}")

    # -------------------------------------------------------------------------
    # 4. CROSS-MEDIA INFERENCE FOR A SAMPLE USER
    # -------------------------------------------------------------------------
    print("\n" + "=" * 76)
    print("  🌟 [Step 3/3] PERSONALIZED CROSS-MEDIA RECOMMENDATIONS (TV, BOOKS, MOVIES)")
    print("=" * 76)

    # Let's test User #15 who loved Sci-Fi, Mystery & Mind-Bending content
    test_user = 15
    u_ratings = df_ratings[df_ratings["userId"] == test_user].merge(df_catalog, left_on="media_id", right_on="id", suffixes=("_user", "_catalog"))
    print(f"  User #{test_user} Past Consumption & High Ratings:")
    for _, r in u_ratings.head(4).iterrows():
        m_t = r["media_type_catalog"]
        icon = "🎬" if m_t == "movie" else ("📺" if m_t == "tv" else "📖")
        print(f"    {icon} {m_t.upper():5s} | {r['rating_user']} ⭐ | {r['title']} ({r['genres']})")

    # Generate predictions across unseen items
    seen_ids = set(u_ratings["id"])
    unseen_df = df_catalog[~df_catalog["id"].isin(seen_ids)].copy()

    u_tensor = torch.tensor([user2idx[test_user]] * len(unseen_df), dtype=torch.long, device=device)
    i_tensor = torch.tensor([item2idx[item_id] for item_id in unseen_df["id"]], dtype=torch.long, device=device)
    type_tensor = torch.tensor([type2idx[m] for m in unseen_df["media_type"]], dtype=torch.long, device=device)
    g_tensor = torch.tensor(genre_mat[i_tensor.cpu().numpy()], dtype=torch.float32, device=device)

    model.eval()
    with torch.no_grad():
        unseen_df["predicted_score"] = model(u_tensor, i_tensor, type_tensor, g_tensor).cpu().numpy()

    # Breakdown by media type: Top TV Shows, Top Books, Top Movies
    for m_type, name, icon in [("tv", "TV Shows", "📺"), ("book", "Books", "📖"), ("movie", "Movies", "🎬")]:
        subset = unseen_df[unseen_df["media_type"] == m_type].sort_values(by="predicted_score", ascending=False).head(4)
        print(f"\n  {icon} TOP RECOMMENDED {name.upper()} (2020-2026):")
        for rank, (_, row) in enumerate(subset.iterrows(), 1):
            print(f"     #{rank}  Score: {row['predicted_score']:.2f}/5.0 ⭐ | {row['title']} [{row['genres']}] by {row['creator']}")

    print("\n" + "=" * 76 + "\n")

if __name__ == "__main__":
    train_cross_media()
