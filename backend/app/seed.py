import asyncio
from sqlalchemy.future import select
from app.database import AsyncSessionLocal, engine, Base
from app.models import MediaItem, ItemEmbedding
from app.ml.embeddings import compute_text_embedding
from app.ml.clustering import cluster_media_items, get_sub_genre_name

SEED_ITEMS = [
    # Movies
    {
        "media_type": "movie",
        "title": "Blade Runner 2049",
        "external_id": "tmdb_335984",
        "synopsis": "Thirty years after the events of the first film, a new Blade Runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
        "themes": ["atmospheric", "speculative-fiction", "morally-gray", "identity", "cyberpunk", "philosophical"],
        "raw_metadata": {
            "director": "Denis Villeneuve",
            "year": 2017,
            "pacing": 0.3,
            "intensity": 0.7,
            "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Dune: Part Two",
        "external_id": "tmdb_693134",
        "synopsis": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe.",
        "themes": ["epic", "political-intrigue", "prophecy", "warfare", "philosophical", "worldbuilding"],
        "raw_metadata": {
            "director": "Denis Villeneuve",
            "year": 2024,
            "pacing": 0.6,
            "intensity": 0.8,
            "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Mad Max: Fury Road",
        "external_id": "tmdb_76341",
        "synopsis": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
        "themes": ["kinetic-action", "survival", "raw/gritty", "high-octane", "dystopia"],
        "raw_metadata": {
            "director": "George Miller",
            "year": 2015,
            "pacing": 0.95,
            "intensity": 0.85,
            "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Past Lives",
        "external_id": "tmdb_666277",
        "synopsis": "Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora's family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week.",
        "themes": ["slow-burn", "romance", "fate", "introspective", "melancholy", "slice-of-life"],
        "raw_metadata": {
            "director": "Celine Song",
            "year": 2023,
            "pacing": 0.25,
            "intensity": 0.4,
            "poster_url": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Everything Everywhere All at Once",
        "external_id": "tmdb_545611",
        "synopsis": "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
        "themes": ["multiverse", "existential", "family-dynamics", "kinetic-action", "subversive-comedy", "absurdist"],
        "raw_metadata": {
            "director": "Daniels",
            "year": 2022,
            "pacing": 0.85,
            "intensity": 0.6,
            "poster_url": "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Anatomy of a Fall",
        "external_id": "tmdb_915935",
        "synopsis": "A woman is suspected of her husband's murder, and their blind son faces a moral dilemma as the sole witness in an intense French courtroom thriller dissecting modern marriage and truth.",
        "themes": ["morally-gray", "courtroom-noir", "psychological", "introspective", "mystery"],
        "raw_metadata": {
            "director": "Justine Triet",
            "year": 2023,
            "pacing": 0.35,
            "intensity": 0.65,
            "poster_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Parasite",
        "external_id": "tmdb_496243",
        "synopsis": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        "themes": ["social-satire", "thriller", "morally-gray", "dark-comedy", "class-struggle"],
        "raw_metadata": {
            "director": "Bong Joon-ho",
            "year": 2019,
            "pacing": 0.75,
            "intensity": 0.8,
            "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "movie",
        "title": "Arrival",
        "external_id": "tmdb_329865",
        "synopsis": "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world, discovering nonlinear perception of time and memory.",
        "themes": ["linguistics", "philosophical", "hard-sci-fi", "atmospheric", "emotional-resonance"],
        "raw_metadata": {
            "director": "Denis Villeneuve",
            "year": 2016,
            "pacing": 0.4,
            "intensity": 0.5,
            "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60"
        }
    },

    # TV Shows
    {
        "media_type": "tv",
        "title": "Severance",
        "external_id": "tmdb_95396",
        "synopsis": "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
        "themes": ["slow-burn", "dystopian", "corporate-satire", "psychological-mystery", "morally-gray"],
        "raw_metadata": {
            "creator": "Dan Erickson",
            "year": 2022,
            "pacing": 0.45,
            "intensity": 0.75,
            "total_episodes": 9,
            "poster_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "Succession",
        "external_id": "tmdb_76331",
        "synopsis": "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.",
        "themes": ["corporate-intrigue", "family-trauma", "morally-gray", "sharp-satire", "power-struggle"],
        "raw_metadata": {
            "creator": "Jesse Armstrong",
            "year": 2018,
            "pacing": 0.65,
            "intensity": 0.75,
            "total_episodes": 39,
            "poster_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "The Bear",
        "external_id": "tmdb_125910",
        "synopsis": "A young chef from the fine dining world comes home to Chicago to run his family Italian beef sandwich shop after a heartbreaking death in his family.",
        "themes": ["kinetic-pacing", "high-stress", "kitchen-drama", "grief", "personal-redemption"],
        "raw_metadata": {
            "creator": "Christopher Storer",
            "year": 2022,
            "pacing": 0.9,
            "intensity": 0.85,
            "total_episodes": 28,
            "poster_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "Dark",
        "external_id": "tmdb_70523",
        "synopsis": "A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families across interlocking time loops.",
        "themes": ["time-travel", "existential-mystery", "intricate-puzzle", "atmospheric", "philosophical"],
        "raw_metadata": {
            "creator": "Baran bo Odar",
            "year": 2017,
            "pacing": 0.5,
            "intensity": 0.85,
            "total_episodes": 26,
            "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "Andor",
        "external_id": "tmdb_84773",
        "synopsis": "The story of the burgeoning rebellion against the Empire and how people and planets became involved in a gritty, high-stakes espionage revolution.",
        "themes": ["raw/gritty", "political-thriller", "espionage", "anti-fascism", "slow-burn"],
        "raw_metadata": {
            "creator": "Tony Gilroy",
            "year": 2022,
            "pacing": 0.55,
            "intensity": 0.7,
            "total_episodes": 12,
            "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "Arcane",
        "external_id": "tmdb_94605",
        "synopsis": "Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.",
        "themes": ["steampunk", "kinetic-action", "tragic-sisterhood", "political-strife", "visual-masterpiece"],
        "raw_metadata": {
            "creator": "Christian Linke",
            "year": 2021,
            "pacing": 0.8,
            "intensity": 0.8,
            "total_episodes": 18,
            "poster_url": "https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "tv",
        "title": "Fleabag",
        "external_id": "tmdb_67070",
        "synopsis": "A dry-witted woman, known only as Fleabag, has no filter as she navigates life and love in London while trying to cope with tragedy.",
        "themes": ["subversive-comedy", "introspective", "grief", "fourth-wall", "vulnerability"],
        "raw_metadata": {
            "creator": "Phoebe Waller-Bridge",
            "year": 2016,
            "pacing": 0.7,
            "intensity": 0.5,
            "total_episodes": 12,
            "poster_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60"
        }
    },

    # Books
    {
        "media_type": "book",
        "title": "Project Hail Mary",
        "external_id": "gb_54860443",
        "synopsis": "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish. Except right now, he doesn't know that. He can't even remember his own name.",
        "themes": ["hard-sci-fi", "interstellar-survival", "first-contact", "optimistic-science", "fast-paced"],
        "raw_metadata": {
            "author": "Andy Weir",
            "year": 2021,
            "pacing": 0.85,
            "intensity": 0.5,
            "total_chapters": 30,
            "poster_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "book",
        "title": "The Three-Body Problem",
        "external_id": "gb_20518872",
        "synopsis": "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens. A dying alien civilization captures the signal and plans to invade Earth.",
        "themes": ["cosmic-horror", "hard-sci-fi", "macro-civilizations", "philosophical", "slow-burn"],
        "raw_metadata": {
            "author": "Cixin Liu",
            "year": 2008,
            "pacing": 0.4,
            "intensity": 0.8,
            "total_chapters": 35,
            "poster_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "book",
        "title": "The Secret History",
        "external_id": "gb_29044",
        "synopsis": "Under the influence of their charismatic classics professor, a group of clever, eccentric misfits at an elite New England college discover a way of thinking and living that is a world away from the humdrum existence of their contemporaries.",
        "themes": ["dark-academia", "morally-gray", "slow-burn", "classical-allusions", "psychological-noir"],
        "raw_metadata": {
            "author": "Donna Tartt",
            "year": 1992,
            "pacing": 0.3,
            "intensity": 0.75,
            "total_chapters": 8,
            "poster_url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "book",
        "title": "Klara and the Sun",
        "external_id": "gb_54120408",
        "synopsis": "Told through the perspective of Klara, an Artificial Friend with outstanding observational qualities, who watches carefully the behavior of those who come in to browse.",
        "themes": ["artificial-intelligence", "introspective", "melancholy", "slice-of-life", "philosophical"],
        "raw_metadata": {
            "author": "Kazuo Ishiguro",
            "year": 2021,
            "pacing": 0.35,
            "intensity": 0.45,
            "total_chapters": 6,
            "poster_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60"
        }
    },
    {
        "media_type": "book",
        "title": "Piranesi",
        "external_id": "gb_50202953",
        "synopsis": "Piranesi lives in the House. Perhaps he always has. In his notebooks day after day he makes a clear and careful record of its wonders: the labyrinth of halls, the thousands upon thousands of statues, the tides that thunder up staircases.",
        "themes": ["labyrinthine-fantasy", "solitude", "atmospheric-mystery", "introspective", "poetic"],
        "raw_metadata": {
            "author": "Susanna Clarke",
            "year": 2020,
            "pacing": 0.45,
            "intensity": 0.4,
            "total_chapters": 7,
            "poster_url": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&auto=format&fit=crop&q=60"
        }
    }
]

async def seed_database():
    print("[Seed] Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check existing count
        stmt = select(MediaItem)
        res = await session.execute(stmt)
        existing_items = res.scalars().all()

        if len(existing_items) >= len(SEED_ITEMS):
            print(f"[Seed] Database already seeded with {len(existing_items)} media items.")
            return

        print(f"[Seed] Seeding {len(SEED_ITEMS)} starter media items with embeddings...")
        created_items = []
        embeddings_list = []

        for item_data in SEED_ITEMS:
            # Check if exists
            item_stmt = select(MediaItem).where(MediaItem.title == item_data["title"])
            r = await session.execute(item_stmt)
            existing = r.scalars().first()
            if existing:
                continue

            media_item = MediaItem(
                media_type=item_data["media_type"],
                title=item_data["title"],
                external_id=item_data.get("external_id"),
                synopsis=item_data["synopsis"],
                themes=item_data["themes"],
                sub_genres=[],
                raw_metadata=item_data["raw_metadata"]
            )
            session.add(media_item)
            await session.flush()

            # Compute dense embedding from title, synopsis, and themes
            text_for_embedding = f"{media_item.title}: {media_item.synopsis} Themes: {' '.join(media_item.themes)}"
            emb_vec = compute_text_embedding(text_for_embedding)

            embedding_record = ItemEmbedding(
                media_item_id=media_item.id,
                embedding=emb_vec
            )
            session.add(embedding_record)
            
            created_items.append(media_item)
            embeddings_list.append(emb_vec)

        await session.commit()

        # Run Feature 3: Cluster items into sub-genres
        if created_items and embeddings_list:
            print(f"[Seed] Running KMeans sub-genre clustering on {len(embeddings_list)} items...")
            cluster_labels = cluster_media_items(embeddings_list, n_clusters=6)
            for item, cluster_id in zip(created_items, cluster_labels):
                sub_genre = get_sub_genre_name(cluster_id)
                item.sub_genres = [sub_genre]
            await session.commit()
            print("[Seed] Successfully clustered and tagged items with discovered sub-genres.")

        print("[Seed] Seed process completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
