from app.ml.taxonomy import DEFAULT_STYLE_AXES, bands_to_pacing_value

DEFAULT_PREFERENCE_FIELDS = {
    "sub_genre_values": dict(DEFAULT_STYLE_AXES),
    "pacing": 0.5,
    "viewing_context": ["casual"],
    "intensity": 0.6,
    "language_mix_ok": True,
    "preferred_genres": [],
    "pacing_bands": ["balanced"],
    "pacing_by_mode": {},
    "content_modes": ["fiction", "entertainment"],
    "content_intent": [],
}


def preference_kwargs_from_update(pref_in) -> dict:
    session_ctx = list(pref_in.viewing_context or [])
    bands = list(pref_in.pacing_bands or [])
    pacing = bands_to_pacing_value(bands, fallback=float(pref_in.pacing))
    return {
        "sub_genre_values": pref_in.sub_genre_values or dict(DEFAULT_STYLE_AXES),
        "pacing": pacing,
        "viewing_context": session_ctx,
        "intensity": pref_in.intensity,
        "language_mix_ok": pref_in.language_mix_ok,
        "preferred_genres": list(pref_in.preferred_genres or []),
        "pacing_bands": bands or ["balanced"],
        "pacing_by_mode": dict(pref_in.pacing_by_mode or {}),
        "content_modes": list(pref_in.content_modes or ["fiction", "entertainment"]),
        "content_intent": list(pref_in.content_intent or []),
    }
