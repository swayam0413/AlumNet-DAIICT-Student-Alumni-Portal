"""Referral generation routes."""
from fastapi import APIRouter, HTTPException
from models.ai import ReferralRequest
from services.referral_service import generate_referral
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api/ai", tags=["referral"])


@router.post("/generate-referral")
async def handle_generate_referral(req: ReferralRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        message = await generate_referral(req.student, req.alumni, req.job, req.tone, req.customNote)
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
