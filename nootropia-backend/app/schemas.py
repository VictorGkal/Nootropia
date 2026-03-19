from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PreferenceCreate(BaseModel):
    topic: str

class PreferenceResponse(BaseModel):
    id: int
    topic: str

    class Config:
        from_attributes = True

class PublicationResponse(BaseModel):
    id: int
    openalex_id: str
    title: str
    authors: Optional[str]
    year: Optional[int]
    citations: Optional[int]
    topic: Optional[str]
    abstract: Optional[str]
    url: Optional[str]
    fetched_at: datetime

    class Config:
        from_attributes = True

class BookmarkCreate(BaseModel):
    publication_id: int

class BookmarkResponse(BaseModel):
    id: int
    publication_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
