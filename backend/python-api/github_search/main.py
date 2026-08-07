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
        return {"error": "file_url is required"}
    result = analyze_portfolio_file(file_url, extra_info)
    return {"result": result}
