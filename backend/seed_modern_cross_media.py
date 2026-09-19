#!/usr/bin/env python3
"""
Seed modern 2020-2026 Books, TV Shows, and Movies into the Adaptive Media Engine SQLite DB.
Calculates 384-dimensional dense semantic embeddings for each item and creates ItemEmbedding records.
"""

import sys
import os
import json
import asyncio
from sqlalchemy.future import select

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import AsyncSessionLocal, engine, Base
from app.models import MediaItem, ItemEmbedding
from app.ml.embeddings import compute_text_embedding
from train_cross_media import CROSS_MEDIA_ITEMS

async def seed_modern():
    print("\n" + "=" * 76)
    print("  🌱 SEEDING MODERN 2020-2026 CROSS-MEDIA INTO ADAPTIVE MEDIA DATABASE")
    print("=" * 76)

    async with AsyncSessionLocal() as session:
        # Check existing titles
        result = await session.execute(select(MediaItem.title))
        existing_titles = set(r[0] for r in result.fetchall())

        added_count = 0
        for item in CROSS_MEDIA_ITEMS:
            title = item["title"]
            # Check if already present
            if any(title.lower() in ext.lower() or ext.lower() in title.lower() for ext in existing_titles):
                continue

            media_type = item["media_type"]
            genres = item["genres"].split("|")
            themes = [g.lower() for g in genres]
            creator = item["creator"]
            year = item["year"]
            synopsis = f"{title} ({year}) by {creator}. Acclaimed modern {media_type} exploring {', '.join(genres)}."

            raw_meta = {
                "year": year,
                "creator": creator,
                "pacing": 0.5,
                "intensity": 0.6,
                "rating": item["rating"]
            }

            new_media = MediaItem(
                media_type=media_type,
                title=title,
                external_id=f"modern_{media_type}_{year}_{added_count+1}",
                synopsis=synopsis,
                themes=themes,
                sub_genres=genres,
                raw_metadata=raw_meta
            )
            session.add(new_media)
            await session.flush()

            # Compute embedding
            text_for_embed = f"{title} {synopsis} {' '.join(themes)}"
            vec = compute_text_embedding(text_for_embed)

            emb_record = ItemEmbedding(
                media_item_id=new_media.id,
                embedding=vec
            )
            session.add(emb_record)
            added_count += 1
            icon = "🎬" if media_type == "movie" else ("📺" if media_type == "tv" else "📖")
            print(f"  + Added {icon} {media_type.upper():5s}: {title} [{', '.join(genres)}]")

        await session.commit()
        print(f"\n  ✓ Successfully committed {added_count} new modern 2020-2026 media items to database!")

if __name__ == "__main__":
    asyncio.run(seed_modern())
