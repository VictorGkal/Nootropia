from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

# data required to create new user
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# data required for a user to login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# data returned after login/register a user (password excluded for security measures)
class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime
    # allows pydantic to read sqlAlchemy model attributes  
    class Config:
        from_attributes = True

# data required to save a user topic preference
class PreferenceCreate(BaseModel):
    topic: str

# data returned after creating a topic
class PreferenceResponse(BaseModel):
    id: int
    topic: str
    # allows pydantic to read sqlAlchemy model attributes     
    class Config:
        from_attributes = True

# data returned after fetching a publication
class PublicationResponse(BaseModel):
    id: int
    openalex_id: str
    title: str
    authors: Optional[str]
    year: Optional[int]
    citations: Optional[int]
    topic: Optional[str] # old single topic column
    topics: list[str] = [] # new multiple topics column
    abstract: Optional[str]
    url: Optional[str]
    fetched_at: datetime

    # converts topics(list of objects) into list of strings before pydantics validations
    @field_validator("topics", mode="before")
    def extract_topics(cls, topics):
        # check if the first element in topics is an object and has attributes of a topic(string)
        if topics and isinstance(topics[0], object) and hasattr(topics[0], "topic"):
            return [t.topic for t in topics]
        return topics
 
    # allows pydantic to read sqlAlchemy model attributes 
    class Config:
        from_attributes = True

# data required to create a bookmark
class BookmarkCreate(BaseModel):
    publication_id: int

# data returned when bookmark is created
class BookmarkResponse(BaseModel):
    id: int
    publication_id: int
    created_at: datetime
    # allows pydantic to read sqlAlchemy model attributes 
    class Config:
        from_attributes = True

# token data created when user logs in
class Token(BaseModel):
    access_token: str
    token_type: str

# token data returned when token is used
class TokenData(BaseModel):
    email: Optional[str] = None
