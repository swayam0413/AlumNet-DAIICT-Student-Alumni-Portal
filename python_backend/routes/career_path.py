"""Career path suggestion routes."""
from fastapi import APIRouter, HTTPException
from models.referral import RecommendRequest

router = APIRouter(prefix="/api/ml/resume", tags=["ml"])


@router.post("/career-path")
async def handle_career_path(req: RecommendRequest):
    try:
        from services.langchain_parser import suggest_career_path
        result = await suggest_career_path(req.user_profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
