"""ML recommendation routes."""
from fastapi import APIRouter, HTTPException
from models.referral import RecommendRequest

router = APIRouter(prefix="/api/ml", tags=["ml"])


@router.post("/recommend/alumni")
async def handle_recommend_alumni(req: RecommendRequest):
    try:
        from services.recommendation import get_alumni_recommendations
        recommendations = await get_alumni_recommendations(req.user_profile, req.top_k)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
