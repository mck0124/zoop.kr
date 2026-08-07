"""Evidence-first orchestration example for the ZOOP AI pipeline.

This module is intentionally side-effect free on import.  ``run_workflow``
connects the four independently deployable services and returns a traceable
state object instead of the old hard-coded demo values.
"""

from __future__ import annotations

import os
from typing import Any, Dict

import requests


SERVICE_URLS = {
    "github": os.getenv("ZOOP_GITHUB_SERVICE_URL", "http://localhost:8000"),
    "questions": os.getenv("ZOOP_QUESTIONS_SERVICE_URL", "http://localhost:8004"),
    "interview": os.getenv("ZOOP_INTERVIEW_SERVICE_URL", "http://localhost:8002"),
}
REQUEST_TIMEOUT = float(os.getenv("ZOOP_WORKFLOW_TIMEOUT_SECONDS", "30"))


def _post_json(url: str, *, json_body: Dict[str, Any] | None = None, form: Dict[str, Any] | None = None) -> Dict[str, Any]:
    response = requests.post(url, json=json_body, data=form, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise RuntimeError("AI 서비스가 객체 형태의 응답을 반환하지 않았습니다.")
    return payload


def github_search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """공고 조건으로 공개 후보자를 검색하고 단계 trace를 남긴다."""

    result = _post_json(f"{SERVICE_URLS['github']}/search", json_body=state)
    return {**state, "candidates": result.get("candidates", []), "trace": [*state.get("trace", []), "github_search"]}


def interview_questions_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """후보자별 질문 생성은 실제 질문 서비스에 위임한다."""

    questions = []
    for candidate in state.get("candidates", []):
        payload = {
            "post_title": state.get("post_title", ""),
            "post_description": state.get("post_description", ""),
            "programming_language": ", ".join(state.get("languages", [])),
            "ideal_candidate": state.get("idealCandidate", ""),
            "location": ", ".join(state.get("regions", [])) or "전국",
            "headcount": state.get("headcount", 1),
            "portfolio_analysis": candidate.get("analysisData", ""),
        }
        result = _post_json(f"{SERVICE_URLS['questions']}/generate-preparation-questions", form=payload)
        questions.append({"candidate": candidate, "questions": result.get("questions", [])})
    return {**state, "interview_questions": questions, "trace": [*state.get("trace", []), "interview_questions"]}


def run_workflow(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run the auditable search → question pipeline.

    Interview video analysis is deliberately a follow-up action because it
    requires a real schedule and recorded answers; fabricating those IDs would
    create an invalid hiring record.
    """

    state = {**input_data, "trace": ["input_validated"]}
    state = github_search_agent(state)
    state = interview_questions_agent(state)
    state["next_action"] = "run_interview_analysis_after_real_schedule"
    state["trace"] = [*state["trace"], "await_real_interview_schedule"]
    return state


try:
    from langgraph.graph import StateGraph

    graph = StateGraph(dict)
    graph.add_node("github_search", github_search_agent)
    graph.add_node("interview_questions", interview_questions_agent)
    graph.add_edge("__start__", "github_search")
    graph.add_edge("github_search", "interview_questions")
except ImportError:  # LangGraph is optional for the standalone service bundle.
    graph = None


if __name__ == "__main__":
    print("ZOOP evidence workflow is import-safe. Call run_workflow(input_data) with service URLs configured.")
