# models.py
from pydantic import BaseModel
from typing import List, Optional

class FilterRequest(BaseModel):
    languages: List[str]
    regions: List[str]
    nationwide: bool
    headcount: Optional[int] = None 
    idealCandidate: Optional[str] = None
    post_id: Optional[int] = None
    language: str = "en"
