from pydantic import BaseModel

class DeleteStaleUserRequest(BaseModel):
    email: str
    password: str
