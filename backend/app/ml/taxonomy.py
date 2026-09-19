"""Canonical genres, pacing bands, and content-mode classification."""

from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

CONTENT_MODES = [
    {"id": "fiction", "label": "Fiction"},
    {"id": "entertainment", "label": "Entertainment"},
    {"id": "non-fiction", "label": "Non-fiction"},
]

GENRES_BY_MODE: Dict[str, List[Dict[str, str]]] = {
    "fiction": [
        {"id": "literary", "label": "Literary"},
        {"id": "speculative", "label": "Speculative / Sci-Fi"},
        {"id": "fantasy", "label": "Fantasy"},
        {"id": "mystery", "label": "Mystery"},
        {"id": "crime-noir", "label": "Crime / Noir"},
        {"id": "historical", "label": "Historical"},
        {"id": "romance", "label": "Romance"},
        {"id": "horror", "label": "Horror"},
        {"id": "magical-realism", "label": "Magical Realism"},
        {"id": "character-study", "label": "Character Study"},
    ],
    "entertainment": [
        {"id": "action", "label": "Action"},
        {"id": "thriller", "label": "Thriller"},
        {"id": "comedy", "label": "Comedy"},
        {"id": "adventure", "label": "Adventure"},
        {"id": "animation", "label": "Animation"},
        {"id": "sports", "label": "Sports"},
        {"id": "feel-good", "label": "Feel-good"},
        {"id": "prestige-drama", "label": "Prestige Drama"},
        {"id": "survival", "label": "Survival / Disaster"},
    ],
    "non-fiction": [
        {"id": "documentary", "label": "Documentary"},
        {"id": "biography", "label": "Biography / Memoir"},
        {"id": "history", "label": "History"},
        {"id": "science", "label": "Science"},
        {"id": "philosophy", "label": "Philosophy"},
        {"id": "psychology", "label": "Psychology"},
        {"id": "technology", "label": "Technology"},
        {"id": "nature", "label": "Nature"},
        {"id": "investigative", "label": "Investigative"},
        {"id": "self-improvement", "label": "Self-improvement"},
    ],
}

PACING_BANDS = [
    {"id": "glacial", "label": "Glacial / atmospheric", "center": 0.12},
    {"id": "slow-burn", "label": "Slow-burn", "center": 0.28},
    {"id": "measured", "label": "Measured / literary", "center": 0.42},
    {"id": "balanced", "label": "Balanced", "center": 0.50},
    {"id": "plot-forward", "label": "Plot-forward", "center": 0.72},
    {"id": "kinetic", "label": "Kinetic / high-octane", "center": 0.90},
]

STYLE_AXES = [
    {
        "key": "romance",
        "label": "Romance Arc",
        "options": [
            {"id": "any", "label": "Doesn't matter"},
            {"id": "slow-burn", "label": "Slow-burn & atmospheric"},
            {"id": "fast-paced", "label": "Fast-paced & urgent"},
        ],
    },
    {
        "key": "action",
        "label": "Conflict & Action",
        "options": [
            {"id": "any", "label": "Doesn't matter"},
            {"id": "raw/gritty", "label": "Raw & gritty"},
            {"id": "choreographed", "label": "Choreographed & stylized"},
        ],
    },
    {
        "key": "protagonists",
        "label": "Protagonist Morality",
        "options": [
            {"id": "any", "label": "Doesn't matter"},
            {"id": "morally-gray", "label": "Morally gray & complex"},
            {"id": "clear-cut", "label": "Clear-cut & idealistic"},
        ],
    },
    {
        "key": "tone",
        "label": "Intellectual & Emotional Depth",
        "options": [
            {"id": "any", "label": "Doesn't matter"},
            {"id": "challenging", "label": "Challenging & layered"},
            {"id": "comfort", "label": "Comforting & restorative"},
        ],
    },
]

SESSION_CONTEXTS = [
    {"id": "binge", "label": "Binge (whole weekend)", "hint": "High-density multi-episode arcs"},
    {"id": "casual", "label": "Ongoing daily", "hint": "One episode or chapter at a time"},
    {"id": "one-off", "label": "One-off feature", "hint": "Self-contained evening experience"},
    {"id": "background", "label": "Contemplative background", "hint": "Ambient, low-attention viewing"},
]

CONTENT_INTENTS = [
    {"id": "self-improvement", "label": "Self-improvement & mastery"},
    {"id": "deep-learning", "label": "Intellectual deep dive"},
    {"id": "documentary", "label": "Documentaries & real-world"},
]

SESSION_CONTEXT_IDS = {c["id"] for c in SESSION_CONTEXTS}
CONTENT_INTENT_IDS = {c["id"] for c in CONTENT_INTENTS}
ALL_GENRE_IDS = {g["id"] for genres in GENRES_BY_MODE.values() for g in genres}
FICTION_GENRE_IDS = {g["id"] for g in GENRES_BY_MODE["fiction"]}
ENTERTAINMENT_GENRE_IDS = {g["id"] for g in GENRES_BY_MODE["entertainment"]}
NONFICTION_GENRE_IDS = {g["id"] for g in GENRES_BY_MODE["non-fiction"]}
PACING_CENTER = {b["id"]: b["center"] for b in PACING_BANDS}
PACING_LABEL = {b["id"]: b["label"] for b in PACING_BANDS}

TAG_ALIASES: Dict[str, str] = {
    "sci-fi": "speculative",
    "scifi": "speculative",
    "science-fiction": "speculative",
    "speculative-fiction": "speculative",
    "speculative realism": "speculative",
    "hard-sci-fi": "speculative",
    "hard science": "science",
    "cyberpunk": "speculative",
    "dystopia": "speculative",
    "dystopian": "speculative",
    "multiverse": "speculative",
    "time-travel": "speculative",
    "cosmic-horror": "horror",
    "first-contact": "speculative",
    "worldbuilding": "fantasy",
    "prophecy": "fantasy",
    "epic": "historical",
    "political-intrigue": "prestige-drama",
    "corporate-intrigue": "prestige-drama",
    "power": "prestige-drama",
    "noir": "crime-noir",
    "crime": "crime-noir",
    "morally-gray": "crime-noir",
    "kinetic-action": "action",
    "high-octane": "action",
    "kinetic-pacing": "action",
    "raw/gritty": "action",
    "survival": "survival",
    "high-stress": "prestige-drama",
    "thriller": "thriller",
    "political-thriller": "thriller",
    "social-satire": "comedy",
    "subversive-comedy": "comedy",
    "absurdist": "comedy",
    "witty": "comedy",
    "feel good": "feel-good",
    "feel-good": "feel-good",
    "slice-of-life": "character-study",
    "introspective": "character-study",
    "identity": "character-study",
    "family-dynamics": "character-study",
    "melancholy": "literary",
    "philosophical": "philosophy",
    "atmospheric": "literary",
    "slow-burn": "literary",
    "romance": "romance",
    "existential": "literary",
    "existential-mystery": "mystery",
    "warfare": "adventure",
    "docuseries": "documentary",
    "documentary": "documentary",
    "non-fiction": "biography",
    "nonfiction": "biography",
    "memoir": "biography",
    "biography": "biography",
    "self-improvement": "self-improvement",
    "productivity": "self-improvement",
    "habits": "self-improvement",
    "discipline": "self-improvement",
    "resilience": "self-improvement",
    "mental-mastery": "self-improvement",
    "psychology": "psychology",
    "cognitive-bias": "psychology",
    "finance": "self-improvement",
    "health": "science",
    "science": "science",
    "history": "history",
    "philosophy": "philosophy",
    "technology": "technology",
    "nature": "nature",
    "investigative": "investigative",
    "adventure": "adventure",
    "animation": "animation",
    "comedy": "comedy",
    "action": "action",
    "mystery": "mystery",
    "fantasy": "fantasy",
    "horror": "horror",
    "sports": "sports",
    "literary": "literary",
}

NONFICTION_HINTS = {
    "documentary", "docuseries", "non-fiction", "nonfiction", "self-improvement",
    "biography", "memoir", "history", "science", "philosophy", "psychology",
    "productivity", "investigative", "nature", "technology", "finance", "health",
    "habits", "cognitive-bias",
}

DEFAULT_STYLE_AXES = {
    "romance": "any",
    "action": "any",
    "protagonists": "any",
    "tone": "any",
}


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def canonicalize_tag(tag: Any) -> Optional[str]:
    raw = _norm(tag)
    if not raw:
        return None
    if raw in ALL_GENRE_IDS:
        return raw
    if raw in TAG_ALIASES:
        return TAG_ALIASES[raw]
    compact = raw.replace("_", "-").replace(" ", "-")
    if compact in ALL_GENRE_IDS:
        return compact
    if compact in TAG_ALIASES:
        return TAG_ALIASES[compact]
    return None


def collect_tags(themes: Optional[Iterable], sub_genres: Optional[Iterable], raw_metadata: Optional[Dict] = None) -> Set[str]:
    tags: Set[str] = set()
    for source in (themes or [], sub_genres or []):
        for item in source:
            tags.add(_norm(item))
            canon = canonicalize_tag(item)
            if canon:
                tags.add(canon)
    meta = raw_metadata or {}
    for key in ("category", "genre"):
        val = meta.get(key)
        if val:
            tags.add(_norm(val))
            canon = canonicalize_tag(val)
            if canon:
                tags.add(canon)
    return tags


def canonical_genres_for_item(
    themes: Optional[Iterable] = None,
    sub_genres: Optional[Iterable] = None,
    raw_metadata: Optional[Dict] = None,
) -> List[str]:
    found = []
    seen = set()
    for source in (themes or [], sub_genres or []):
        for item in source:
            canon = canonicalize_tag(item)
            if canon and canon not in seen:
                seen.add(canon)
                found.append(canon)
    meta = raw_metadata or {}
    for key in ("category", "genre"):
        canon = canonicalize_tag(meta.get(key))
        if canon and canon not in seen:
            seen.add(canon)
            found.append(canon)
    return found


def classify_content_modes(
    media_type: Optional[str],
    themes: Optional[Iterable] = None,
    sub_genres: Optional[Iterable] = None,
    raw_metadata: Optional[Dict] = None,
) -> List[str]:
    mtype = _norm(media_type)
    tags = collect_tags(themes, sub_genres, raw_metadata)
    genres = set(canonical_genres_for_item(themes, sub_genres, raw_metadata))
    category = _norm((raw_metadata or {}).get("category"))
    modes: Set[str] = set()

    is_nonfiction = (
        mtype == "documentary"
        or category in {"documentary", "self-improvement", "deep-learning", "non-fiction"}
        or bool(tags & NONFICTION_HINTS)
        or bool(genres & NONFICTION_GENRE_IDS)
    )
    if is_nonfiction:
        modes.add("non-fiction")

    fiction_hit = bool(genres & FICTION_GENRE_IDS) or bool(
        tags & {"speculative-fiction", "literary", "slow-burn", "introspective", "character-study"}
    )
    entertainment_hit = bool(genres & ENTERTAINMENT_GENRE_IDS) or bool(
        tags & {"kinetic-action", "high-octane", "feel-good", "comedy"}
    )

    if mtype == "book" and not is_nonfiction:
        modes.add("fiction")
        if entertainment_hit:
            modes.add("entertainment")
    elif mtype in {"movie", "tv"}:
        if entertainment_hit or not fiction_hit:
            modes.add("entertainment")
        if fiction_hit or not entertainment_hit:
            modes.add("fiction")
        if not modes:
            modes.update({"fiction", "entertainment"})
    elif mtype == "documentary":
        modes.add("non-fiction")
    else:
        if fiction_hit:
            modes.add("fiction")
        if entertainment_hit:
            modes.add("entertainment")
        if not modes and not is_nonfiction:
            modes.add("fiction")

    return [m for m in ("fiction", "entertainment", "non-fiction") if m in modes]


def item_matches_content_mode(item: Any, content_mode: Optional[str]) -> bool:
    if not content_mode or content_mode in {"all", ""}:
        return True
    modes = classify_content_modes(
        getattr(item, "media_type", None),
        getattr(item, "themes", None),
        getattr(item, "sub_genres", None),
        getattr(item, "raw_metadata", None),
    )
    return content_mode in modes


def pacing_value_to_band(value: float) -> str:
    closest = "balanced"
    best = 1.0
    for band in PACING_BANDS:
        diff = abs(float(value) - band["center"])
        if diff < best:
            best = diff
            closest = band["id"]
    return closest


def bands_to_pacing_value(bands: Iterable[str], fallback: float = 0.5) -> float:
    centers = [PACING_CENTER[b] for b in bands if b in PACING_CENTER]
    if not centers:
        return fallback
    return float(sum(centers) / len(centers))


def split_viewing_context(raw_contexts: Optional[Iterable[str]]) -> Tuple[List[str], List[str]]:
    session = []
    intent = []
    for ctx in raw_contexts or []:
        key = _norm(ctx)
        if key in SESSION_CONTEXT_IDS:
            session.append(key)
        elif key in CONTENT_INTENT_IDS:
            intent.append(key)
    return session, intent


def active_style_values(sub_genre_values: Optional[Dict[str, str]]) -> Dict[str, str]:
    active = {}
    for key, value in (sub_genre_values or {}).items():
        if key.startswith("_"):
            continue
        norm_val = _norm(value)
        if norm_val and norm_val not in {"any", "doesn't-matter", "doesnt-matter", "n/a", "na"}:
            active[key] = norm_val
    return active


def preferred_pacing_bands(pref: Dict[str, Any], item_modes: Iterable[str]) -> List[str]:
    by_mode = pref.get("pacing_by_mode") or {}
    selected_modes = [m for m in item_modes if by_mode.get(m)]
    if selected_modes:
        bands = []
        for mode in selected_modes:
            bands.extend(by_mode.get(mode) or [])
        return list(dict.fromkeys(bands))
    bands = pref.get("pacing_bands") or []
    if bands:
        return list(bands)
    return [pacing_value_to_band(pref.get("pacing", 0.5))]


def describe_pacing(pref: Dict[str, Any]) -> str:
    bands = pref.get("pacing_bands") or []
    if bands:
        labels = [PACING_LABEL.get(b, b) for b in bands]
        return ", ".join(labels)
    value = float(pref.get("pacing", 0.5))
    return PACING_LABEL[pacing_value_to_band(value)]
