from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.services.rag_service import rag_service
from app.services.eligibility_service import eligibility_service

router = APIRouter()

class EligibilityRequest(BaseModel):
    profile: Dict[str, Any]

@router.get("/search")
async def search_schemes(q: str = Query(..., description="The query to search for schemes")):
    try:
        answer = rag_service.generate_answer(q)
        return {"query": q, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-eligibility")
async def check_eligibility(request: EligibilityRequest):
    try:
        result = eligibility_service.check_eligibility(request.profile)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
