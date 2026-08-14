import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from .models import FilterRequest
    from .github_search_logic import enhanced_search_github_candidates as search_github_candidates
except ImportError:  # Supports `uvicorn main:app` from this service directory.
    from models import FilterRequest
    from github_search_logic import enhanced_search_github_candidates as search_github_candidates

app = FastAPI()

# CORS 미들웨어 등록
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3100").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "github-search", "github_token_configured": bool(os.getenv("GITHUB_TOKEN"))}

@app.post("/search")
def search(filters: FilterRequest):
    results = search_github_candidates(filters, getattr(filters, 'post_id', None))
    return {"candidates": results}
