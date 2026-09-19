#!/usr/bin/env python3
"""
Adaptive Media Engine - Documentaries & Non-Fiction Learning Ingestion
Seeds real-world documentaries and non-fiction/self-improvement books into adaptive_media.db.
Generates 384-dimensional dense embeddings for intent-driven retrieval.
"""

import sys
import os
import asyncio
from sqlalchemy.future import select

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import AsyncSessionLocal
from app.models import MediaItem, ItemEmbedding
from app.ml.embeddings import compute_text_embedding

DOCUMENTARIES_AND_NONFICTION = [
    # -------------------------------------------------------------------------
    # 1. DOCUMENTARIES (Films & High-Impact Docuseries)
    # -------------------------------------------------------------------------
    {
        "media_type": "documentary",
        "title": "The Last Dance (2020)",
        "external_id": "doc_last_dance_2020",
        "synopsis": "Chronicling the rise of the 1990s Chicago Bulls and Michael Jordan's relentless pursuit of competitive excellence, team dynamics, and mental mastery.",
        "themes": ["mental-mastery", "sports", "excellence", "leadership", "resilience", "documentary"],
        "sub_genres": ["docuseries", "biography", "self-improvement"],
        "raw_metadata": {
            "director": "Jason Hehir",
            "year": 2020,
            "pacing": 0.8,
            "intensity": 0.85,
            "rating": 4.9,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "Free Solo (2018)",
        "external_id": "doc_free_solo_2018",
        "synopsis": "Alex Honnold attempts to achieve the lifelong dream of free solo climbing El Capitan without a rope, examining fear management, extreme focus, and human limits.",
        "themes": ["extreme-focus", "fear-management", "mastery", "nature", "mindset", "documentary"],
        "sub_genres": ["documentary", "adventure", "self-improvement"],
        "raw_metadata": {
            "director": "Elizabeth Chai Vasarhelyi & Jimmy Chin",
            "year": 2018,
            "pacing": 0.7,
            "intensity": 0.95,
            "rating": 4.8,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "My Octopus Teacher (2020)",
        "external_id": "doc_octopus_teacher_2020",
        "synopsis": "A filmmaker forges an unusual friendship with an octopus in a South African kelp forest, learning profound lessons on connection, nature, vulnerability, and mortality.",
        "themes": ["nature", "connection", "vulnerability", "mindfulness", "introspective", "documentary"],
        "sub_genres": ["documentary", "nature", "philosophy"],
        "raw_metadata": {
            "director": "Pippa Ehrlich & James Reed",
            "year": 2020,
            "pacing": 0.35,
            "intensity": 0.5,
            "rating": 4.7,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "Jiro Dreams of Sushi (2011)",
        "external_id": "doc_jiro_dreams_2011",
        "synopsis": "An intimate profile of 85-year-old sushi master Jiro Ono and his tireless lifelong dedication to craftsmanship, deliberate practice, and perfectionism (Shokunin spirit).",
        "themes": ["craftsmanship", "deliberate-practice", "perfectionism", "mastery", "discipline", "documentary"],
        "sub_genres": ["documentary", "biography", "self-improvement"],
        "raw_metadata": {
            "director": "David Gelb",
            "year": 2011,
            "pacing": 0.4,
            "intensity": 0.5,
            "rating": 4.8,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "14 Peaks: Nothing Is Impossible (2021)",
        "external_id": "doc_14_peaks_2021",
        "synopsis": "Fearless Nepali mountaineer Nimsdai Purja embarks on a seemingly impossible quest to summit all 14 of the world's 8,000-meter peaks in just seven months.",
        "themes": ["resilience", "impossible-goals", "leadership", "grit", "mental-toughness", "documentary"],
        "sub_genres": ["documentary", "adventure", "self-improvement"],
        "raw_metadata": {
            "director": "Torquil Jones",
            "year": 2021,
            "pacing": 0.85,
            "intensity": 0.9,
            "rating": 4.7,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "The Social Dilemma (2020)",
        "external_id": "doc_social_dilemma_2020",
        "synopsis": "Tech insiders blow the whistle on how social media algorithms are engineered to exploit human cognitive vulnerabilities, fuel addiction, and reshape democracy.",
        "themes": ["technology", "attention-economy", "psychology", "cognitive-bias", "society", "documentary"],
        "sub_genres": ["documentary", "science", "investigative"],
        "raw_metadata": {
            "director": "Jeff Orlowski",
            "year": 2020,
            "pacing": 0.65,
            "intensity": 0.75,
            "rating": 4.5,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "Our Planet II (2023)",
        "external_id": "doc_our_planet_2_2023",
        "synopsis": "David Attenborough narrates breathtaking migrations across the globe, revealing the intricate ecological balance of Earth's greatest natural phenomena.",
        "themes": ["science", "nature", "biodiversity", "planet", "awe", "documentary"],
        "sub_genres": ["docuseries", "nature", "science"],
        "raw_metadata": {
            "director": "Silverback Films",
            "year": 2023,
            "pacing": 0.5,
            "intensity": 0.6,
            "rating": 4.9,
            "category": "documentary"
        }
    },
    {
        "media_type": "documentary",
        "title": "Apollo 11 (2019)",
        "external_id": "doc_apollo_11_2019",
        "synopsis": "Crafted from newly discovered, pristine 70mm footage, this cinematic experience takes you straight to the heart of humanity's greatest scientific endeavor.",
        "themes": ["space", "engineering", "human-achievement", "science", "history", "documentary"],
        "sub_genres": ["documentary", "history", "science"],
        "raw_metadata": {
            "director": "Todd Douglas Miller",
            "year": 2019,
            "pacing": 0.6,
            "intensity": 0.8,
            "rating": 4.8,
            "category": "documentary"
        }
    },

    # -------------------------------------------------------------------------
    # 2. NON-FICTION & SELF-IMPROVEMENT BOOKS
    # -------------------------------------------------------------------------
    {
        "media_type": "book",
        "title": "Atomic Habits (2018)",
        "external_id": "book_atomic_habits_2018",
        "synopsis": "James Clear's foundational framework on habit formation, the 1% rule, habit stacking, and systems-based behavior change for compounding self-improvement.",
        "themes": ["self-improvement", "habits", "psychology", "systems-thinking", "productivity", "growth"],
        "sub_genres": ["non-fiction", "self-improvement", "psychology"],
        "raw_metadata": {
            "author": "James Clear",
            "year": 2018,
            "pacing": 0.6,
            "intensity": 0.4,
            "rating": 4.9,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "Deep Work (2016)",
        "external_id": "book_deep_work_2016",
        "synopsis": "Cal Newport makes the case for deep, distraction-free cognitive focus in an increasingly fragmented digital economy to master hard skills and produce elite output.",
        "themes": ["productivity", "focus", "cognitive-mastery", "self-improvement", "discipline"],
        "sub_genres": ["non-fiction", "productivity", "self-improvement"],
        "raw_metadata": {
            "author": "Cal Newport",
            "year": 2016,
            "pacing": 0.5,
            "intensity": 0.5,
            "rating": 4.7,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "The Psychology of Money (2020)",
        "external_id": "book_psych_money_2020",
        "synopsis": "Morgan Housel shares 19 short stories exploring the strange ways people think about wealth, ego, risk, patience, and behavioral decision-making.",
        "themes": ["psychology", "behavioral-economics", "decision-making", "wealth", "mindset"],
        "sub_genres": ["non-fiction", "finance", "psychology", "self-improvement"],
        "raw_metadata": {
            "author": "Morgan Housel",
            "year": 2020,
            "pacing": 0.65,
            "intensity": 0.4,
            "rating": 4.8,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "Outlive: The Science and Art of Longevity (2023)",
        "external_id": "book_outlive_2023",
        "synopsis": "Dr. Peter Attia delivers a groundbreaking tactical guide to extending both lifespan and healthspan through exercise physiology, metabolic health, sleep, and emotional health.",
        "themes": ["health", "science", "longevity", "self-improvement", "biology", "habits"],
        "sub_genres": ["non-fiction", "health", "science", "self-improvement"],
        "raw_metadata": {
            "author": "Peter Attia",
            "year": 2023,
            "pacing": 0.5,
            "intensity": 0.7,
            "rating": 4.8,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "Can't Hurt Me (2018)",
        "external_id": "book_cant_hurt_me_2018",
        "synopsis": "Navy SEAL David Goggins shares his astonishing life story and reveals the 40% Rule to overcome trauma, shatter self-imposed limitations, and build mental calluses.",
        "themes": ["mental-toughness", "resilience", "discipline", "self-improvement", "mindset", "grit"],
        "sub_genres": ["non-fiction", "memoir", "self-improvement"],
        "raw_metadata": {
            "author": "David Goggins",
            "year": 2018,
            "pacing": 0.85,
            "intensity": 0.95,
            "rating": 4.8,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "Thinking, Fast and Slow (2011)",
        "external_id": "book_thinking_fast_slow_2011",
        "synopsis": "Nobel laureate Daniel Kahneman explains the two systems that drive our thoughts: System 1 (fast, intuitive, emotional) and System 2 (slow, deliberate, logical).",
        "themes": ["psychology", "cognitive-bias", "decision-making", "science", "rationality"],
        "sub_genres": ["non-fiction", "psychology", "science"],
        "raw_metadata": {
            "author": "Daniel Kahneman",
            "year": 2011,
            "pacing": 0.35,
            "intensity": 0.8,
            "rating": 4.7,
            "category": "deep-learning"
        }
    },
    {
        "media_type": "book",
        "title": "Sapiens: A Brief History of Humankind (2015)",
        "external_id": "book_sapiens_2015",
        "synopsis": "Yuval Noah Harari explores how an insignificant ape became the ruler of planet Earth through the Cognitive, Agricultural, and Scientific Revolutions.",
        "themes": ["history", "anthropology", "evolution", "human-condition", "philosophy", "science"],
        "sub_genres": ["non-fiction", "history", "science", "philosophy"],
        "raw_metadata": {
            "author": "Yuval Noah Harari",
            "year": 2015,
            "pacing": 0.6,
            "intensity": 0.65,
            "rating": 4.8,
            "category": "deep-learning"
        }
    },
    {
        "media_type": "book",
        "title": "Chip War (2022)",
        "external_id": "book_chip_war_2022",
        "synopsis": "Chris Miller reveals the epic fight for semiconductor supremacy: the microscopic microchips powering AI, geopolitics, global trade, and the modern world.",
        "themes": ["technology", "geopolitics", "science", "history", "engineering", "economics"],
        "sub_genres": ["non-fiction", "technology", "history"],
        "raw_metadata": {
            "author": "Chris Miller",
            "year": 2022,
            "pacing": 0.7,
            "intensity": 0.7,
            "rating": 4.8,
            "category": "deep-learning"
        }
    },
    {
        "media_type": "book",
        "title": "Clear Thinking (2023)",
        "external_id": "book_clear_thinking_2023",
        "synopsis": "Shane Parrish reveals mental models and behavioral tools to master critical reasoning, eliminate emotional blindspots, and make better high-stakes decisions.",
        "themes": ["mental-models", "decision-making", "self-improvement", "rationality", "psychology"],
        "sub_genres": ["non-fiction", "self-improvement", "psychology"],
        "raw_metadata": {
            "author": "Shane Parrish",
            "year": 2023,
            "pacing": 0.6,
            "intensity": 0.5,
            "rating": 4.7,
            "category": "self-improvement"
        }
    },
    {
        "media_type": "book",
        "title": "Four Thousand Weeks: Time Management for Mortals (2021)",
        "external_id": "book_four_thousand_weeks_2021",
        "synopsis": "Oliver Burkeman presents a philosophical rejection of toxic productivity, helping readers confront their finite lifespan and choose what genuinely matters.",
        "themes": ["philosophy", "time-management", "self-improvement", "existential", "mindfulness"],
        "sub_genres": ["non-fiction", "philosophy", "self-improvement"],
        "raw_metadata": {
            "author": "Oliver Burkeman",
            "year": 2021,
            "pacing": 0.5,
            "intensity": 0.5,
            "rating": 4.7,
            "category": "self-improvement"
        }
    }
]

async def seed_learning_items():
    print("\n" + "=" * 76)
    print("  🌱 SEEDING DOCUMENTARIES & NON-FICTION LEARNING TITLES")
    print("=" * 76)

    async with AsyncSessionLocal() as session:
        # Fetch existing titles
        res = await session.execute(select(MediaItem.title))
        existing = set(r[0].lower() for r in res.fetchall())

        added = 0
        for item in DOCUMENTARIES_AND_NONFICTION:
            t = item["title"]
            if t.lower() in existing:
                continue

            # Compute embedding
            themes_str = " ".join(item["themes"])
            sub_str = " ".join(item["sub_genres"])
            text_for_embed = f"{t} {item['synopsis']} {themes_str} {sub_str} {item['raw_metadata'].get('category', '')}"
            vec = compute_text_embedding(text_for_embed)

            media_rec = MediaItem(
                media_type=item["media_type"],
                title=t,
                external_id=item["external_id"],
                synopsis=item["synopsis"],
                themes=item["themes"],
                sub_genres=item["sub_genres"],
                raw_metadata=item["raw_metadata"]
            )
            session.add(media_rec)
            await session.flush()

            emb_rec = ItemEmbedding(
                media_item_id=media_rec.id,
                embedding=vec
            )
            session.add(emb_rec)
            added += 1

            icon = "📽️" if item["media_type"] == "documentary" else "📖"
            cat = item["raw_metadata"].get("category", "").upper()
            print(f"  + Added {icon} {item['media_type'].upper():12s} [{cat:16s}]: {t}")

        await session.commit()
        print(f"\n  ✓ Successfully seeded {added} documentaries & non-fiction items with 384-dim embeddings!")

if __name__ == "__main__":
    asyncio.run(seed_learning_items())
