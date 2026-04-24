from pydantic import BaseModel

class RecommendRequest(BaseModel):
    user_profile: dict
    top_k: int = 5
