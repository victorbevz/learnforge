from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from typing import Literal

class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128, repr=False)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

class UserRead(BaseModel):
    id:int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class UserLogin(UserCreate):
    pass

class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"