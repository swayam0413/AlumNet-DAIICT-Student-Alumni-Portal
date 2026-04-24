from pydantic import BaseModel

class ResumeParseRequest(BaseModel):
    fileData: str  # base64
    mimeType: str = "application/pdf"

class ResumeMatchRequest(BaseModel):
    fileData: str
    jobTitle: str = ""
    jobCompany: str = ""
    jobDescription: str = ""
    jobRequirements: str = ""
