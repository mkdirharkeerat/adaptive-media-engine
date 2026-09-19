import os
import json
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings

def _format_cited_evidence(cited_history_items: List[Dict[str, Any]]) -> str:
    if not cited_history_items:
        return "your general taste preferences"
    
    parts = []
    for item in cited_history_items:
        title = item.get("title", "a past title")
        rating = item.get("rating")
        rewatches = item.get("rewatch_count", 0)
        completion = item.get("completion_pct", 100)
        
        detail_tokens = []
        if rating:
            detail_tokens.append(f"rated ★{rating}")
        if rewatches > 0:
            detail_tokens.append(f"rewatched {rewatches}x")
        if completion < 100:
            detail_tokens.append(f"{completion}% completed")
        else:
            detail_tokens.append("finished completely")

        desc = f"'{title}' ({', '.join(detail_tokens)})"
        parts.append(desc)
        
    return " and ".join(parts)

async def generate_grounded_reasoning(
    target_item_title: str,
    target_media_type: str,
    target_synopsis: str,
    target_themes: List[str],
    cited_history_items: List[Dict[str, Any]],
    user_preferences: Dict[str, Any],
    match_reasons: Optional[List[str]] = None,
    canonical_genres: Optional[List[str]] = None,
    content_modes: Optional[List[str]] = None,
) -> str:
    """
    Feature 4 & Model 4 - LLM Grounded Reasoning & Explanation Step:
    Uses an LLM (Anthropic Claude or Local Ollama/OpenAI-compatible server)
    to write a natural-language, grounded explanation citing concrete history & depth signals.
    """
    from app.ml.taxonomy import describe_pacing

    evidence_str = _format_cited_evidence(cited_history_items)
    themes_str = ", ".join((canonical_genres or target_themes)[:4]) if (canonical_genres or target_themes) else "narrative depth"
    pacing_desc = describe_pacing(user_preferences)
    reasons_str = ", ".join((match_reasons or [])[:4]) or "taste overlap"
    modes_str = ", ".join(content_modes or []) or target_media_type
    
    prompt = f"""You are the explanation engine for an ethical, value-aligned media recommendation system.
Write a 1-2 sentence plain-language explanation of why '{target_item_title}' ({target_media_type}) was recommended to this user.

Evidence & Constraints:
- Grounded history citations: {evidence_str}
- Explicit user preferences: favors {pacing_desc} pacing and genres around {themes_str}.
- Content modes: {modes_str}
- Matched filters: {reasons_str}
- Target synopsis: {target_synopsis}

Rules:
1. Ground the explanation explicitly in the user's specific history citations and depth metrics (e.g. rewatches, ratings, completion).
2. Mention pacing, genre, or mode matches when they appear in the matched filters.
3. Be concise, direct, natural, and never mention algorithms, loss functions, or embeddings."""

    # 1. Try Anthropic Claude API if key exists
    if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY.startswith("sk-"):
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=150,
                temperature=0.3,
                system="You are an explainable media recommender. Provide grounded, concise 1-2 sentence explanations.",
                messages=[{"role": "user", "content": prompt}]
            )
            content = message.content[0].text.strip()
            if content:
                return content
        except Exception as e:
            print(f"[Reasoning LLM] Anthropic API notice: {e}")

    # 2. Try Local Ollama / vLLM if running on localhost:11434
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            res = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False
                }
            )
            if res.status_code == 200:
                data = res.json()
                text = data.get("response", "").strip()
                if text:
                    return text
    except Exception:
        pass

    # 3. Deterministic Grounded Synthesis Fallback
    if cited_history_items:
        first_item = cited_history_items[0]
        f_title = first_item.get("title", "your past favorites")
        f_rewatches = first_item.get("rewatch_count", 0)
        f_rating = first_item.get("rating")
        
        signal_details = []
        if f_rewatches > 0:
            signal_details.append(f"you rewatched {f_rewatches}x")
        if f_rating and f_rating >= 4.0:
            signal_details.append(f"rated ★{f_rating}")
        if not signal_details:
            signal_details.append("you completed with high affinity")

        signals_text = " and ".join(signal_details)

        if len(cited_history_items) > 1:
            s_title = cited_history_items[1].get("title", "other works")
            return f"Recommended because {signals_text} '{f_title}' and completed '{s_title}'. '{target_item_title}' matches your {pacing_desc} pacing and {themes_str} ({reasons_str})."
        else:
            return f"Recommended because {signals_text} '{f_title}', matching '{target_item_title}' in {pacing_desc} pacing and {themes_str}."
            
    return f"Recommended for '{target_item_title}' because it fits your {pacing_desc} pacing, {themes_str} genres, and {reasons_str}."
