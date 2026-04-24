"""Auth service — Firebase REST API operations."""
import httpx
from config import FIREBASE_API_KEY


async def delete_stale_user(email: str, password: str) -> dict:
    """Delete a stale Firebase Auth user via REST API."""
    async with httpx.AsyncClient() as client:
        sign_in_res = await client.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}",
            json={"email": email, "password": password, "returnSecureToken": True},
        )

        if sign_in_res.status_code != 200:
            await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={FIREBASE_API_KEY}",
                json={"requestType": "PASSWORD_RESET", "email": email},
            )
            return {
                "success": False,
                "status": 403,
                "message": "Password reset email sent. Check your inbox, reset password, then Sign In.",
            }

        id_token = sign_in_res.json().get("idToken")
        delete_res = await client.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:delete?key={FIREBASE_API_KEY}",
            json={"idToken": id_token},
        )

        if delete_res.status_code == 200:
            return {"success": True, "message": "Old account deleted. You can now re-register."}
        else:
            return {"success": False, "status": 500, "message": "Failed to delete old account."}


async def get_users_by_role(role: str) -> list:
    """Get users by role from Firestore (used for email notifications).
    Note: Requires firebase-admin SDK initialization for server-side access.
    For now, this is a placeholder — email notifications fetch user emails from the frontend.
    """
    return []
