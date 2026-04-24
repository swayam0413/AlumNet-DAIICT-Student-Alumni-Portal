"""AI Assistant routes — career advice."""
from fastapi import APIRouter, HTTPException
from models.ai import CareerAdviceRequest
from services.career_service import get_career_advice
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/career-advice")
async def handle_career_advice(req: CareerAdviceRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        result = await get_career_advice(req.query, req.context)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
