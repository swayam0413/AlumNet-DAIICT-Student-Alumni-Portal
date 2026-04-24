"""
AlumConnect App Factory — creates and configures the FastAPI app.
Use create_app() in tests for isolated instances.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import ALLOWED_ORIGINS, GEMINI_API_KEY

logger = logging.getLogger("alumconnect")


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("🚀 AlumConnect Python Backend starting...")
        logger.info(f"🔑 Gemini API Key: {'Configured' if GEMINI_API_KEY else 'MISSING'}")
        yield
        logger.info("👋 Shutting down...")

    app = FastAPI(
        title="AlumConnect API",
        description="Python backend for AlumConnect — AI-powered alumni networking",
        version="2.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register all route modules
    from routes import all_routers
    for router in all_routers:
        app.include_router(router)

    # Health check
    @app.get("/api/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "AlumConnect Python Backend",
            "version": "2.0.0",
            "gemini_configured": bool(GEMINI_API_KEY),
        }

    return app
