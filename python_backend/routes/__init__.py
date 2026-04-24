"""Route registry — all API routers."""
from .auth import router as auth_router
from .ai_assistant import router as ai_assistant_router
from .resume_match import router as resume_match_router
from .resume_analyzer import router as resume_analyzer_router
from .referral import router as referral_router
from .networking_radar import router as networking_radar_router
from .recommendation import router as recommendation_router
from .career_path import router as career_path_router
from .notifications import router as notifications_router

all_routers = [
    auth_router,
    ai_assistant_router,
    resume_match_router,
    resume_analyzer_router,
    referral_router,
    networking_radar_router,
    recommendation_router,
    career_path_router,
    notifications_router,
]
