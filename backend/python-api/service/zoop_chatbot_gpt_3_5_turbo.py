"""Legacy import-safe helpers for the original ZOOP chatbot notebook.

The runnable chatbot lives in ``../chatbot/chatbot_api.py``.  This module used
to contain a copied Jupyter notebook with shell magics, which made the Python
service fail during module discovery.  Keep a small compatibility surface for
older scripts while directing runtime traffic to the maintained FastAPI app.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any


CHATBOT_MODULE = Path(__file__).resolve().parents[1] / "chatbot" / "chatbot_api.py"


def service_location() -> str:
    """Return the maintained chatbot module location for diagnostics."""

    return str(CHATBOT_MODULE)


def build_legacy_context(question: str, guide_text: str, limit: int = 4000) -> dict[str, Any]:
    """Build a bounded context payload for callers migrating from the notebook."""

    return {
        "question": str(question or "")[:2000],
        "context": str(guide_text or "")[:limit],
        "source": "zoop-chatbot-guide",
    }


__all__ = ["CHATBOT_MODULE", "service_location", "build_legacy_context"]
