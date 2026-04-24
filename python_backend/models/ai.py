from pydantic import BaseModel
from typing import Optional

class CareerAdviceRequest(BaseModel):
    query: str
    context: str = ""

class ReferralRequest(BaseModel):
    student: dict
    alumni: dict
    job: dict
    tone: str = "Professional"
    customNote: Optional[str] = None

class NetworkingRadarRequest(BaseModel):
    events: list
    studentProfile: dict
