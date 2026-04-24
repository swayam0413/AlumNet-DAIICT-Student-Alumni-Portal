"""Resume match routes."""
from fastapi import APIRouter, HTTPException
from models.resume import ResumeMatchRequest
from services.match_service import match_resume
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api/ai", tags=["resume"])


@router.post("/match-resume")
async def handle_match_resume(req: ResumeMatchRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        result = await match_resume(
            req.fileData, req.jobTitle, req.jobCompany,
            req.jobDescription, req.jobRequirements,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
