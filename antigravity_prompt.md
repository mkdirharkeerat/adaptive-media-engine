# Build Prompt for Antigravity (agy)

Paste everything below into Antigravity as a single prompt.

---

Build the complete, fully working full-stack web app **"Adaptive Media
Recommendation"** — a media recommendation system for movies, TV shows, and
books that recommends based on genuine interest signals instead of
engagement/click behavior, and always explains its reasoning. Build the whole
thing end to end, every feature below fully wired and working, not a stub or
a thin demo slice.

## Core idea

Users import or manually log what they've watched/read (completion, rewatch,
rating, episode/chapter drop-off point), plus set explicit taste values
up front. The system extracts taste signals from history, clusters it into
sub-genres/themes, and generates recommendations with a plain-language
explanation attached to every single one — no recommendation is ever shown
without its reasoning. There is no session-time tracking, no streak counters,
no infinite scroll, and no push notifications anywhere in the schema — this
is a structural constraint, not a UI choice. Do not add any field or table
that could support those, even for logging/analytics.

## Feature 1 — Preference / Values Selector (build this first, it's the entry point)

Before a user gets any recommendations, they go through a values selector
screen — explicit and editable, separate from and in addition to whatever the
system infers from their history:

- **Sub-genre / tone values**: slow-burn vs. fast-paced romance, raw/gritty vs.
  choreographed action, morally-gray vs. clear-cut protagonists, comfort vs.
  challenging.
- **Pacing preference**: slow and atmospheric → fast and plot-driven (slider).
- **Viewing/reading context**: binge (whole weekend), ongoing-daily (one
  episode/chapter after work), one-off (single movie night). Multi-select.
- **Content intensity**: how dark/heavy vs. light the content can go.
- **Language mix**: whether they're fine with content described in mixed
  languages / slang in reviews and summaries — this feeds into how the LLM
  reads source text, not just output.

Store these as a `user_preferences` row per user, versioned, so every past
recommendation can be traced back to the preference state that produced it.
The recommendation engine combines this explicit preference vector with the
implicit one learned from history — explicit values act as a hard filter /
strong prior, implicit signals refine within that. Editable anytime from a
settings page, not just onboarding.

## Feature 2 — Genuine Preference Recommendation Engine

Train on implicit feedback, not clicks: completion, rewatch count, rating, and
episode/chapter drop-off point as weighted signal strengths. Items with
stronger signals (finished + rewatched + highly rated) count as stronger
training examples than items merely clicked or started.

## Feature 3 — Fine-grained taste modeling (sub-genres)

Convert each media item's description into an embedding and cluster similar
items together to discover sub-genres that weren't manually tagged (e.g. a
"slow-burn, morally-gray protagonist" cluster emerging from the data itself).
Also run a lightweight classifier to tag items with finer sub-genres beyond
standard broad categories.

## Feature 4 — Explains recommendations

For every recommendation, retrieve the specific past items and signals that
justify it and use them as grounding context for an LLM call that writes the
explanation. The explanation must cite concrete history (e.g. "recommended
because you rewatched X three times and finished Y despite its slow pacing"),
not generic text. No recommendation object may exist without a populated
reasoning field — enforce this in the API response schema itself.

## Feature 5 — Context-aware delivery (binge / casual / one-off)

A classifier trained on the user's own viewing patterns (session length, gaps
between episodes, time of day) predicts which mode the user is currently in
and filters/reorders recommendations accordingly. This mode can also be
directly overridden by the user via Feature 1's viewing-context selector.

## Feature 6 — Architecturally excludes dark-pattern mechanisms

No `session_time`, `streak`, `last_active`, or any engagement-timing field
anywhere in the schema. Recommendations are delivered in fixed, non-infinite
batches (e.g. 10 at a time) with an explicit "load next batch" action — never
an auto-loading infinite scroll. No push notifications. This must be true of
the data model itself, verifiable by inspecting the schema, not just the UI.

## Feature 7 — Episode/chapter-level depth tracking

Track progress at the individual episode/chapter level, not just
finished/not-finished. Use the drop-off point as a numeric "true interest
score" input — dropping off at episode 2 of 10 signals something different
than dropping off at episode 9 of 10.

## Feature 8 — User-confirmed similarity feedback

A "more/less like this" action on any item nudges that user's preference
vector (their embedding) slightly toward or away from the target item's
embedding — real-time online learning, no full retrain needed, no loss
function or training loop, just vector addition/subtraction with a small step
size.

## Feature 9 — Shared cross-user tag vocabulary (no per-user model fine-tuning by default)

Instead of fine-tuning the embedding model separately per user, maintain one
shared tag/sub-genre vocabulary across all users that improves matching as
more users' data flows in, without retraining any model per user.

## Feature 10 (stretch, optional) — LoRA fine-tuning of the embedding model

If time allows: lightly fine-tune the local embedding model using accumulated
similarity-feedback pairs (from Feature 8) as training data, so the model
itself gets better at reflecting real taste over time rather than only
nudging a preference vector. Build this behind a flag — the rest of the app
must work fully without it.

## Feature 11 (stretch, only if low-cost given the schema) — Cross-media recommendation

Recommend a book from a finished show or vice versa, using the shared
embedding space across media types. If this meaningfully complicates the
schema, skip it and leave a comment in the README explaining why, rather than
half-building it.

## Models & libraries (use these specifically)

- **Embedding model**: local sentence-transformers model (bge-small,
  all-MiniLM, or nomic-embed) — pretrained, used as-is, not trained by us.
- **Clustering**: scikit-learn KMeans or HDBSCAN on the embedding vectors.
- **Context/mode classifier**: logistic regression or a small XGBoost model,
  trained on session-pattern features (session length, gaps, time of day) →
  binge/casual/one-off, with an actual train/test split and reported accuracy.
- **Depth/drop-off scorer**: logistic regression or small XGBoost regression,
  trained on (episodes watched / total, rewatched or not, rating,
  time-to-drop-off) → a numeric true-interest score.
- **LLM reasoning/explanation step**: call an LLM API (Anthropic) — this is
  the only component doing actual language generation; ground it in the
  retrieved signals, don't let it invent unsupported reasoning.
- **Preference vector update**: plain vector math, no model.
- **LoRA fine-tuning**: optional, stretch goal, see Feature 10.

## Data sources / external APIs (for populating the media catalog, not for scraping user profiles)

- TMDB or OMDb API — movie/TV metadata.
- Google Books API or Open Library — book genre, cast/authors, themes, synopsis.
- Goodreads / MovieLens — public review data, if accessible without scraping.
- Kaggle datasets as a fallback/seed source for initial catalog population.

User's own history is only ever imported via CSV/JSON (Letterboxd, Goodreads,
Steam export formats) or manual entry — never scraped.

## Stack

- **Backend**: Python, FastAPI, PostgreSQL with the `pgvector` extension,
  SQLAlchemy, Alembic for migrations, `asyncpg` or `psycopg` as the driver.
- **Frontend**: React + Vite + Tailwind, React Router for navigation.
- **Auth**: JWT-based, email/password, `passlib` for hashing.
- **Containerization**: `docker-compose.yml` with a Postgres service that has
  `pgvector` enabled, plus the backend and frontend services.

## Data model (exact tables)

- `users`: id, email, password_hash, created_at.
- `user_preferences`: id, user_id, version, sub_genre_values (json), pacing
  (numeric), viewing_context (array), intensity (numeric), language_mix_ok
  (bool), created_at.
- `media_items`: id, media_type (movie/tv/book), title, external_id (TMDB/
  OMDb/Google Books id), synopsis, themes (json), sub_genres (json, populated
  by the clustering step), raw_metadata (json).
- `item_embeddings`: media_item_id (FK), embedding (pgvector column).
- `user_media_history`: id, user_id, media_item_id, completion_pct,
  rewatch_count, rating, episode_progress (json array of per-episode/chapter
  status), drop_off_point, created_at, updated_at.
- `recommendations`: id, user_id, media_item_id, reasoning_text,
  cited_history_ids (json array), preference_version, generated_at,
  batch_number.
- `feedback_events`: id, user_id, media_item_id, direction (more/less like
  this), created_at.

No table or column here or anywhere else may store session duration, streaks,
or last-active timestamps used for engagement purposes.

## API endpoints (exhaustive)

- `POST /auth/signup`, `POST /auth/login`
- `GET /preferences`, `PUT /preferences` (creates a new version)
- `POST /history` (manual entry), `POST /history/import` (CSV/JSON upload,
  auto-detect Letterboxd/Goodreads/Steam export format)
- `GET /history` (list with progress/rating per item)
- `PATCH /history/{id}` (update episode/chapter progress, rating, rewatch)
- `GET /recommendations?media_type=&batch=` — returns a fixed batch, each item
  with its reasoning and cited history inline in the same response object
- `POST /feedback` — `{ media_item_id, direction }`, updates the preference
  vector
- `GET /media/{id}` — item detail
- `GET /media/search?q=` — catalog search across ingested items

## Frontend pages/components (exhaustive)

1. **Auth**: signup / login forms.
2. **Onboarding — import history**: file upload (CSV/JSON) with format
   auto-detection, plus a manual "add item" form.
3. **Values selector** (Feature 1): sliders for pacing/intensity, tag toggles
   for sub-genre values, multi-select for viewing context, language-mix
   toggle. Also reachable later from Settings.
4. **Recommendations feed**: media-type tabs (Movies / TV / Books), each card
   shows the item, its reasoning text, and the specific history items it
   cites. "Load next batch" button — no auto-loading scroll.
5. **Item detail**: full metadata, episode/chapter progress tracker (mark
   each episode/chapter watched, see drop-off visualized), rate, mark
   rewatched, "more/less like this" buttons.
6. **Settings**: edit the values selector; view/edit imported history.

## Build/run instructions

- Provide a `docker-compose.yml` that spins up Postgres (with `pgvector`
  enabled via `CREATE EXTENSION IF NOT EXISTS vector;` in an init script),
  the FastAPI backend, and the Vite dev server for the frontend.
- Backend: `backend/requirements.txt`, Alembic migrations for every table
  above, a seed script that pulls a small starter catalog from TMDB/OMDb and
  Google Books/Open Library so the app isn't empty on first run.
- Frontend: `frontend/package.json`, `.env.example` for the API base URL.
- Root-level `.env.example` listing every required key: `DATABASE_URL`,
  `JWT_SECRET`, `ANTHROPIC_API_KEY`, `TMDB_API_KEY` or `OMDB_API_KEY`,
  `GOOGLE_BOOKS_API_KEY`.
- Root-level `README.md` with exact setup steps: install deps, start
  `docker-compose up`, run migrations, run the seed script, start both dev
  servers, and how to hit each endpoint for a quick manual smoke test.

Scaffold `backend/` and `frontend/` now, implement every feature above fully
wired end to end, seed the database, and get the whole app running locally.
