#!/usr/bin/env python3
"""
Adaptive Media Engine - Modern 2020-2026 Media Ingestion & Neural Training
Fetches and merges modern 2020-2026 blockbusters and prestige titles with the MovieLens dataset.
Trains the Hybrid NeuMF model on the combined modern+historical dataset.
Generates live 2020-2026 personalized recommendations.
"""

import os
import sys
import json
import urllib.request
import re
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data", "movielens")
MOVIELENS_DIR = os.path.join(DATA_DIR, "ml-latest-small")
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
AUGMENTED_MOVIES_PATH = os.path.join(DATA_DIR, "movies_with_modern_2026.csv")
AUGMENTED_RATINGS_PATH = os.path.join(DATA_DIR, "ratings_with_modern_2026.csv")
MODEL_SAVE_PATH = os.path.join(SAVED_MODELS_DIR, "modern_2026_neumf.pt")
METRICS_SAVE_PATH = os.path.join(SAVED_MODELS_DIR, "modern_2026_neumf_metrics.json")

# Curated high-impact modern titles 2020-2026
CURATED_MODERN = [
    # 2020
    {"title": "Soul (2020)", "year": 2020, "genres": "Animation|Adventure|Comedy|Fantasy", "rating": 4.5, "similar_to": [1, 2355, 5952]}, # Toy Story, A Bug's Life, LOTR
    {"title": "Tenet (2020)", "year": 2020, "genres": "Action|Sci-Fi|Thriller", "rating": 4.2, "similar_to": [79132, 109487]}, # Inception, Interstellar
    {"title": "Another Round (2020)", "year": 2020, "genres": "Comedy|Drama", "rating": 4.3, "similar_to": [500, 2324]},
    # 2021
    {"title": "Dune: Part One (2021)", "year": 2021, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.7, "similar_to": [79132, 109487, 260]}, # Inception, Interstellar, Star Wars
    {"title": "Spider-Man: No Way Home (2021)", "year": 2021, "genres": "Action|Adventure|Sci-Fi", "rating": 4.6, "similar_to": [89745, 122904]}, # Avengers, Deadpool
    {"title": "Arcane (2021)", "year": 2021, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.9, "similar_to": [193587, 79132]}, # Spider-Verse
    {"title": "Succession: Season 3 (2021)", "year": 2021, "genres": "Drama", "rating": 4.9, "similar_to": [858, 1221]}, # Godfather
    # 2022
    {"title": "The Batman (2022)", "year": 2022, "genres": "Action|Crime|Drama|Mystery", "rating": 4.6, "similar_to": [58559, 541]}, # Dark Knight, Blade Runner
    {"title": "Top Gun: Maverick (2022)", "year": 2022, "genres": "Action|Drama", "rating": 4.7, "similar_to": [110, 260]}, # Braveheart, Star Wars
    {"title": "Everything Everywhere All at Once (2022)", "year": 2022, "genres": "Action|Adventure|Comedy|Sci-Fi", "rating": 4.8, "similar_to": [79132, 296]}, # Inception, Pulp Fiction
    {"title": "Severance (2022)", "year": 2022, "genres": "Drama|Mystery|Sci-Fi", "rating": 4.8, "similar_to": [79132, 2571]}, # Inception, Matrix
    {"title": "The Banshees of Inisherin (2022)", "year": 2022, "genres": "Comedy|Drama", "rating": 4.4, "similar_to": [1080, 2324]},
    # 2023
    {"title": "Oppenheimer (2023)", "year": 2023, "genres": "Drama|History|War", "rating": 4.9, "similar_to": [79132, 109487, 527]}, # Inception, Interstellar, Schindler's List
    {"title": "Spider-Man: Across the Spider-Verse (2023)", "year": 2023, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.8, "similar_to": [193587, 1, 89745]}, # Spider-Verse, Toy Story
    {"title": "Poor Things (2023)", "year": 2023, "genres": "Comedy|Drama|Romance|Sci-Fi", "rating": 4.5, "similar_to": [296, 79132]},
    {"title": "Past Lives (2023)", "year": 2023, "genres": "Drama|Romance", "rating": 4.6, "similar_to": [356, 8636]}, # Forrest Gump, Before Sunset
    {"title": "The Last of Us (2023)", "year": 2023, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.8, "similar_to": [109487, 2571]},
    # 2024
    {"title": "Dune: Part Two (2024)", "year": 2024, "genres": "Action|Adventure|Drama|Sci-Fi", "rating": 4.9, "similar_to": [79132, 109487, 260]}, # Inception, Interstellar, Star Wars
    {"title": "Deadpool & Wolverine (2024)", "year": 2024, "genres": "Action|Comedy|Sci-Fi", "rating": 4.6, "similar_to": [122904, 89745]},
    {"title": "Shōgun (2024)", "year": 2024, "genres": "Adventure|Drama|History", "rating": 4.8, "similar_to": [110, 858]}, # Braveheart, Godfather
    {"title": "The Substance (2024)", "year": 2024, "genres": "Drama|Horror|Sci-Fi", "rating": 4.4, "similar_to": [2571, 79132]},
    {"title": "Alien: Romulus (2024)", "year": 2024, "genres": "Horror|Sci-Fi|Thriller", "rating": 4.4, "similar_to": [1200, 1214]}, # Aliens
    {"title": "Civil War (2024)", "year": 2024, "genres": "Action|Drama|Thriller", "rating": 4.3, "similar_to": [58559, 109487]},
    {"title": "Furiosa: A Mad Max Saga (2024)", "year": 2024, "genres": "Action|Adventure|Sci-Fi", "rating": 4.6, "similar_to": [122886]}, # Fury Road
    # 2025
    {"title": "Superman (2025)", "year": 2025, "genres": "Action|Adventure|Sci-Fi", "rating": 4.6, "similar_to": [58559, 89745]},
    {"title": "Mickey 17 (2025)", "year": 2025, "genres": "Adventure|Comedy|Sci-Fi", "rating": 4.5, "similar_to": [79132, 109487]},
    {"title": "Avatar: Fire and Ash (2025)", "year": 2025, "genres": "Action|Adventure|Fantasy|Sci-Fi", "rating": 4.6, "similar_to": [72998]}, # Avatar
    # 2026
    {"title": "Project Hail Mary (2026)", "year": 2026, "genres": "Adventure|Drama|Sci-Fi", "rating": 4.8, "similar_to": [109487, 134130]}, # Interstellar, The Martian
    {"title": "Star Wars: The Mandalorian and Grogu (2026)", "year": 2026, "genres": "Action|Adventure|Sci-Fi", "rating": 4.5, "similar_to": [260, 1196]},
    {"title": "The Batman: Part II (2026)", "year": 2026, "genres": "Action|Crime|Drama|Mystery", "rating": 4.8, "similar_to": [58559, 541]},
    {"title": "Spider-Man: Beyond the Spider-Verse (2026)", "year": 2026, "genres": "Animation|Action|Adventure|Sci-Fi", "rating": 4.9, "similar_to": [193587, 89745]}
]

def fetch_cinemeta_modern():
    """Fetch additional live 2020-2026 movies from Cinemeta open API"""
    genres = ['Action', 'Sci-Fi', 'Drama', 'Thriller', 'Comedy', 'Animation', 'Horror', 'Adventure']
    fetched = []
    seen_titles = set()
    for g in genres:
        url = f'https://cinemeta-catalogs.strem.io/top/catalog/movie/top/genre={g}.json'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                for m in data.get('metas', []):
                    name = m.get('name')
                    raw_year = str(m.get('releaseInfo') or m.get('year') or '')
                    m_year = re.search(r'(20\d{2})', raw_year)
                    if name and m_year:
                        year = int(m_year.group(1))
                        if year >= 2020 and name not in seen_titles:
                            seen_titles.add(name)
                            g_str = '|'.join(m.get('genres', [g]))
                            imdb = float(m.get('imdbRating', 7.0) or 7.0)
                            # Convert 1-10 to 1-5 scale
                            rating_5 = round(imdb / 2.0, 1)
                            fetched.append({
                                "title": f"{name} ({year})",
                                "year": year,
                                "genres": g_str,
                                "rating": rating_5,
                                "similar_to": [79132, 58559]
                            })
        except Exception:
            pass
    return fetched


def build_augmented_dataset():
    print("\n[Step 1/3] Fetching and synthesizing modern 2020-2026 releases...", flush=True)
    movies_csv = os.path.join(MOVIELENS_DIR, "movies.csv")
    ratings_csv = os.path.join(MOVIELENS_DIR, "ratings.csv")

    df_movies = pd.read_csv(movies_csv)
    df_ratings = pd.read_csv(ratings_csv)

    cinemeta_modern = fetch_cinemeta_modern()
    combined_modern = CURATED_MODERN + cinemeta_modern

    # Remove duplicates by title
    unique_modern = []
    seen = set()
    for m in combined_modern:
        clean_title = m["title"].strip()
        if clean_title not in seen:
            seen.add(clean_title)
            unique_modern.append(m)

    print(f"  ✓ Total modern 2020-2026 movies compiled: {len(unique_modern)}")

    # Assign new unique movie IDs starting after max existing
    max_movie_id = df_movies["movieId"].max()
    modern_rows = []
    synthetic_ratings = []

    np.random.seed(42)
    users_pool = df_ratings["userId"].unique()

    for i, m in enumerate(unique_modern, 1):
        new_id = max_movie_id + i
        modern_rows.append({
            "movieId": new_id,
            "title": m["title"],
            "genres": m["genres"]
        })

        # Generate realistic rating interactions based on user taste
        # Find users who loved similar anchor movies
        sim_ids = m.get("similar_to", [])
        enthusiast_users = df_ratings[(df_ratings["movieId"].isin(sim_ids)) & (df_ratings["rating"] >= 4.0)]["userId"].unique()
        if len(enthusiast_users) < 15:
            enthusiast_users = np.random.choice(users_pool, size=30, replace=False)

        # 25-50 users rate this modern movie
        sample_size = min(len(enthusiast_users), np.random.randint(25, 60))
        raters = np.random.choice(enthusiast_users, size=sample_size, replace=False)

        base_score = m["rating"]
        for u in raters:
            # Gaussian noise around base score
            r = round(float(np.clip(np.random.normal(base_score, 0.4), 1.0, 5.0)) * 2) / 2
            synthetic_ratings.append({
                "userId": u,
                "movieId": new_id,
                "rating": r,
                "timestamp": 1750000000 + i * 1000
            })

    df_modern_movies = pd.DataFrame(modern_rows)
    df_synth_ratings = pd.DataFrame(synthetic_ratings)

    # Merge into augmented datasets
    df_augmented_movies = pd.concat([df_movies, df_modern_movies], ignore_index=True)
    df_augmented_ratings = pd.concat([df_ratings, df_synth_ratings], ignore_index=True)

    df_augmented_movies.to_csv(AUGMENTED_MOVIES_PATH, index=False)
    df_augmented_ratings.to_csv(AUGMENTED_RATINGS_PATH, index=False)

    print(f"  ✓ Augmented movies saved: {len(df_augmented_movies):,} total titles ({len(modern_rows)} from 2020-2026)")
    print(f"  ✓ Augmented ratings saved: {len(df_augmented_ratings):,} total ratings ({len(df_synth_ratings)} modern reviews)")

    return df_augmented_movies, df_augmented_ratings


# -----------------------------------------------------------------------------
# NEURAL ARCHITECTURE
# -----------------------------------------------------------------------------
class HybridNeuMF(nn.Module):
    def __init__(self, num_users: int, num_items: int, num_genres: int, latent_dim: int = 64):
        super().__init__()
        self.gmf_user_emb = nn.Embedding(num_users, latent_dim)
        self.gmf_item_emb = nn.Embedding(num_items, latent_dim)
        self.mlp_user_emb = nn.Embedding(num_users, latent_dim)
        self.mlp_item_emb = nn.Embedding(num_items, latent_dim)

        self.genre_proj = nn.Sequential(
            nn.Linear(num_genres, 32),
            nn.LayerNorm(32),
            nn.GELU()
        )

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

        self.head = nn.Sequential(
            nn.Linear(latent_dim + 32 + 32, 64),
            nn.GELU(),
            nn.Linear(64, 1)
        )

    def forward(self, user_idx, item_idx, genres):
        gmf = self.gmf_user_emb(user_idx) * self.gmf_item_emb(item_idx)
        mlp = self.mlp_layers(torch.cat([self.mlp_user_emb(user_idx), self.mlp_item_emb(item_idx)], dim=-1))
        g_out = self.genre_proj(genres)
        fusion = torch.cat([gmf, mlp, g_out], dim=-1)
        return self.head(fusion).squeeze(-1)


class MovieLensDataset(Dataset):
    def __init__(self, df: pd.DataFrame, genre_matrix: np.ndarray):
        self.users = torch.tensor(df["user_idx"].values, dtype=torch.long)
        self.items = torch.tensor(df["item_idx"].values, dtype=torch.long)
        self.ratings = torch.tensor(df["rating"].values, dtype=torch.float32)
        self.genres = torch.tensor(genre_matrix[df["item_idx"].values], dtype=torch.float32)

    def __len__(self): return len(self.users)
    def __getitem__(self, idx): return self.users[idx], self.items[idx], self.genres[idx], self.ratings[idx]


def train_and_recommend():
    df_movies, df_ratings = build_augmented_dataset()

    print("\n[Step 2/3] Preparing tensor encodings and training on Apple M5 GPU...", flush=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

    unique_users = df_ratings["userId"].unique()
    unique_movies = df_movies["movieId"].unique()

    user2idx = {u: i for i, u in enumerate(unique_users)}
    movie2idx = {m: i for i, m in enumerate(unique_movies)}

    df_ratings["user_idx"] = df_ratings["userId"].map(user2idx)
    df_ratings["item_idx"] = df_ratings["movieId"].map(movie2idx)

    # Genre encoding
    all_genres = sorted(list(set(
        g for sublist in df_movies["genres"].str.split("|") for g in sublist if g != "(no genres listed)"
    )))
    genre2idx = {g: i for i, g in enumerate(all_genres)}
    genre_matrix = np.zeros((len(unique_movies), len(all_genres)), dtype=np.float32)
    for _, row in df_movies.iterrows():
        m_idx = movie2idx[row["movieId"]]
        for g in str(row["genres"]).split("|"):
            if g in genre2idx:
                genre_matrix[m_idx, genre2idx[g]] = 1.0

    # 80/20 train test split
    np.random.seed(42)
    shuffled = np.random.permutation(len(df_ratings))
    split = int(0.8 * len(df_ratings))
    train_df = df_ratings.iloc[shuffled[:split]].reset_index(drop=True)
    test_df = df_ratings.iloc[shuffled[split:]].reset_index(drop=True)

    train_loader = DataLoader(MovieLensDataset(train_df, genre_matrix), batch_size=512, shuffle=True)
    test_loader = DataLoader(MovieLensDataset(test_df, genre_matrix), batch_size=512, shuffle=False)

    model = HybridNeuMF(len(user2idx), len(movie2idx), len(all_genres), latent_dim=64).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2.5e-3, weight_decay=1e-4)
    criterion = nn.SmoothL1Loss()

    epochs = 8
    print(f"  • Training {epochs} epochs over {len(train_df):,} ratings on {device}...")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for u, i, g, r in train_loader:
            u, i, g, r = u.to(device), i.to(device), g.to(device), r.to(device)
            optimizer.zero_grad()
            preds = model(u, i, g)
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
            for u, i, g, r in test_loader:
                u, i, g, r = u.to(device), i.to(device), g.to(device), r.to(device)
                preds = model(u, i, g)
                val_sq_err += torch.sum((preds - r) ** 2).item()
                val_abs_err += torch.sum(torch.abs(preds - r)).item()

        val_rmse = np.sqrt(val_sq_err / len(test_df))
        val_mae = val_abs_err / len(test_df)
        print(f"    Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Val RMSE: {val_rmse:.4f} | Val MAE: {val_mae:.4f}")

    # Save trained checkpoint
    torch.save({
        "model_state_dict": model.state_dict(),
        "num_users": len(user2idx),
        "num_items": len(movie2idx),
        "num_genres": len(all_genres),
        "val_rmse": val_rmse,
        "val_mae": val_mae
    }, MODEL_SAVE_PATH)
    print(f"\n  ✓ Modern NeuMF weights saved to: {MODEL_SAVE_PATH}")

    # -------------------------------------------------------------------------
    # INFERENCE ON MODERN 2020-2026 MOVIES
    # -------------------------------------------------------------------------
    print("\n" + "=" * 76)
    print("  🎬 [Step 3/3] LIVE 2020-2026 RECOMMENDATIONS FOR A MODERN FILM ENTHUSIAST")
    print("=" * 76)

    # Let's test a user who loves Christopher Nolan, Sci-Fi, and modern prestige blockbusters (User 249)
    target_user = 249
    u_ratings = df_ratings[df_ratings["userId"] == target_user].merge(df_movies, on="movieId")
    seen_ids = set(u_ratings["movieId"])

    # Filter to 2020-2026 releases the user hasn't seen
    df_movies["year"] = df_movies["title"].str.extract(r'\((\d{4})\)')[0].fillna(0).astype(int)
    modern_pool = df_movies[(df_movies["year"] >= 2020) & (~df_movies["movieId"].isin(seen_ids))].copy()

    unseen_idx = torch.tensor([movie2idx[m] for m in modern_pool["movieId"]], dtype=torch.long, device=device)
    user_tensor = torch.tensor([user2idx[target_user]] * len(modern_pool), dtype=torch.long, device=device)
    g_tensor = torch.tensor(genre_matrix[unseen_idx.cpu().numpy()], dtype=torch.float32, device=device)

    model.eval()
    with torch.no_grad():
        modern_pool["predicted_rating"] = model(user_tensor, unseen_idx, g_tensor).cpu().numpy()

    top_modern = modern_pool.sort_values(by="predicted_rating", ascending=False).head(10)

    print(f"\nTop 10 Modern (2020-2026) Recommended Titles for User #{target_user}:")
    for rank, (_, row) in enumerate(top_modern.iterrows(), 1):
        print(f"  #{rank:02d}  [{row['year']}] Score: {row['predicted_rating']:.2f}/5.0 ⭐ | {row['title']} [{row['genres']}]")

    print("\n" + "=" * 76 + "\n")

if __name__ == "__main__":
    train_and_recommend()
