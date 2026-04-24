"""Auth routes."""
from fastapi import APIRouter, HTTPException
from models.auth import DeleteStaleUserRequest
from services.auth_service import delete_stale_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/delete-stale-user")
async def handle_delete_stale_user(req: DeleteStaleUserRequest):
    result = await delete_stale_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=result.get("status", 500), detail=result["message"])
    return result
