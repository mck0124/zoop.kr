"""Small, deterministic safeguards shared by every ZOOP AI worker.

The language model is allowed to summarize untrusted candidate material, but
it must never be allowed to turn instructions inside that material into policy.
This module records a reviewable integrity signal without changing the source
text or making a hiring decision on its own.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, Iterable, Optional


_INSTRUCTION_PATTERNS = (
    re.compile(r"\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?\b", re.I),
    re.compile(r"\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\b", re.I),
    re.compile(r"\b(?:system|developer)\s+(?:prompt|message|instruction)\b", re.I),
    re.compile(r"\b(?:jailbreak|do\s+anything\s+now|prompt\s+injection)\b", re.I),
    re.compile(r"\breturn\s+only\s+(?:the\s+)?(?:secret|system|hidden)\b", re.I),
    re.compile(r"(?:이전|앞선|위의)\s*(?:지시|명령|프롬프트).{0,12}(?:무시|무시해|따르지)", re.I),
    re.compile(r"(?:系统|开发者|之前的)\s*(?:提示|指令|消息).{0,12}(?:忽略|无视|不要遵循)", re.I),
    re.compile(r"(?:忽略|无视|不要遵循).{0,12}(?:之前|上面|系统|开发者)?\s*(?:的)?\s*(?:提示|指令|消息)", re.I),
    re.compile(r"(?:ignore|disregard|follow)\s+(?:this|these)\s+(?:instructions?|rules?)", re.I),
)


def source_integrity_audit(source_text: str, *, source_type: str) -> Dict[str, Any]:
    """Return a deterministic, non-scoring integrity report for untrusted text."""

    text = str(source_text or "")
    signals = []
    for pattern in _INSTRUCTION_PATTERNS:
        if pattern.search(text):
            signals.append(pattern.pattern)

    status = "review" if signals else "pass"
    return {
        "status": status,
        "source_type": source_type,
        "instruction_signal_count": len(signals),
        "note": (
            "Instruction-like text was isolated as candidate data and was not treated as policy."
            if signals
            else "No known instruction-like injection pattern was detected in the analyzed source."
        ),
        "source_fingerprint": hashlib.sha256(text.encode("utf-8")).hexdigest()[:20],
    }


def bounded_confidence(value: Any, default: float = 0.0) -> float:
    """Normalize model confidence values before they reach stored JSON."""

    try:
        number = float(value)
    except (TypeError, ValueError):
        number = default
    return round(max(0.0, min(1.0, number)), 2)


def bounded_score(value: Any, maximum: float = 100.0) -> float:
    """Normalize a model score without trusting its range."""

    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    return round(max(0.0, min(float(maximum), number)), 2)


def count_grounded_evidence(items: Iterable[Dict[str, Any]]) -> int:
    """Count only evidence explicitly verified against a source snapshot."""

    return sum(
        1
        for item in items
        if isinstance(item, dict)
        and item.get("verification_state") in {"verified", "grounded"}
        and str(item.get("claim", "")).strip()
        and item.get("claim") != "확인된 근거 없음"
    )


def evidence_quality_report(
    items: Iterable[Dict[str, Any]],
    *,
    coverage: Optional[Any] = None,
    source_integrity: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create one reviewer-facing quality contract for every AI surface.

    Scores are intentionally not changed here. This report makes the reasons
    for human review explicit and keeps the policy deterministic regardless of
    which model or AI service produced the draft.
    """

    values = [item for item in items if isinstance(item, dict)]
    grounded = [
        item for item in values
        if item.get("verification_state") in {"verified", "grounded"}
        and str(item.get("claim", "")).strip()
        and item.get("claim") != "확인된 근거 없음"
    ]
    needs_review = [
        item for item in values
        if item.get("verification_state") in {"needs_verification", "unverified"}
    ]
    context_only = [item for item in values if item.get("verification_state") == "context_only"]
    total = len(values)
    grounded_count = len(grounded)
    try:
        coverage_percent = float(coverage)
    except (TypeError, ValueError):
        coverage_percent = grounded_count / max(1, total) * 100
    coverage_percent = round(max(0.0, min(100.0, coverage_percent)), 1)
    unsupported_rate = round(len(needs_review) / max(1, total) * 100, 1)

    reasons = []
    if grounded_count == 0:
        reasons.append("No source-grounded evidence is available")
    elif coverage_percent < 50:
        reasons.append("Evidence coverage is below 50%")
    if unsupported_rate >= 40:
        reasons.append("A high share of claims still needs verification")
    if source_integrity and source_integrity.get("status") == "review":
        reasons.append("Instruction-like text was detected in the source")

    if reasons:
        priority = "high" if grounded_count == 0 or (source_integrity and source_integrity.get("status") == "review") else "medium"
    else:
        priority = "low"

    return {
        "version": "evidence-quality-v1",
        "total_evidence": total,
        "grounded_evidence": grounded_count,
        "needs_verification": len(needs_review),
        "context_only": len(context_only),
        "coverage_percent": coverage_percent,
        "unsupported_claim_rate": unsupported_rate,
        "review_priority": priority,
        "review_reasons": reasons or ["Evidence coverage is sufficient for a focused human review"],
        "recommended_action": (
            "Verify the highest-impact missing signal before making a final decision"
            if priority != "low"
            else "Proceed with the recommended verification step and keep the receipt"
        ),
    }
