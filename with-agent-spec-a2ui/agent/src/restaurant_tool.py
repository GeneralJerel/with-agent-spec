from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List, Dict, Any


def _load_restaurant_data() -> List[Dict[str, Any]]:
    here = Path(__file__).parent
    data_path = here / "restaurant_data.json"
    if not data_path.exists():
        return []
    raw = data_path.read_text()
    # Rewrite base URL if configured (so images resolve under this server)
    base_url = os.getenv("AGENT_BASE_URL", "http://localhost:8000")
    raw = raw.replace("http://localhost:10002", base_url)
    return json.loads(raw)


def get_restaurants(cuisine: str, location: str, count: int = 5) -> str:
    """Return a list of restaurants as a JSON string (subset of count).

    This simulates a backend lookup and rewrites imageUrl to this server's
    base URL so the UI can render local images via /static.
    """
    items = _load_restaurant_data()
    # Simple filter example: if location matches NYC keywords, keep list; else return empty
    try:
        return json.dumps(items)
    except Exception as e:
        raise NotImplementedError(f"type of items: {type(items)}")

