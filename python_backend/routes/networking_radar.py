"""Networking radar routes."""
from fastapi import APIRouter, HTTPException
from models.ai import NetworkingRadarRequest
from services.networking_service import get_networking_insights
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api/ai", tags=["networking"])


@router.post("/networking-radar")
async def handle_networking_radar(req: NetworkingRadarRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        insights = await get_networking_insights(req.events, req.studentProfile)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
