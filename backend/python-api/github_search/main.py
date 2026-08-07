import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from models import FilterRequest
from github_search_logic import enhanced_search_github_candidates as search_github_candidates
from github_search_logic import analyze_portfolio_file

app = FastAPI()

# CORS 미들웨어 등록
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search")
def search(filters: FilterRequest):
    print("[DEBUG] FastAPI에서 받은 filters:", filters)
    print("[DEBUG] FastAPI에서 받은 headcount:", getattr(filters, 'headcount', None))
    print("[DEBUG] FastAPI에서 받은 post_id:", getattr(filters, 'post_id', None))
    results = search_github_candidates(filters, getattr(filters, 'post_id', None))
    return {"candidates": results}

@app.post("/analyze-portfolio")
def analyze_portfolio(payload: dict = Body(...)):
    """
    입력: {"file_url": "...", "extra_info": {...}}
    출력: {"result": 분석결과}
    """
    file_url = payload.get("file_url")
    extra_info = payload.get("extra_info")
    if not file_url:
        print("[분석 요청] file_url 없음! 요청 무시")
        return {"error": "file_url is required"}
    print(f"[분석 시작] file_url: {file_url} | extra_info: {extra_info}")
    result = analyze_portfolio_file(file_url, extra_info)
    print(f"[분석 완료] file_url: {file_url} | 결과 일부: {str(result)[:120]}...")
    return {"result": result}
