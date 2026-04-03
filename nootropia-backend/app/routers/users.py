from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from fastapi import Response, Request
from dotenv import load_dotenv
import os
from app.auth import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
    get_user_from_token
)

# get env file
load_dotenv()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))

# mini router that groups related endpoints together
router = APIRouter()

# post endpoint for user register  
@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed = hash_password(user.password)
    new_user = models.User(email=user.email, password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# post endpoint for user login 
@router.post("/login", response_model=schemas.Token)
def login(response: Response, user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # set access token
    access_token = create_token({"sub": user.email, "type": "access"}, 
                    timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)) 
    
    # set refresh token 
    refresh_token = create_token({"sub": user.email, "type": "refresh"},
                    timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))  
    
    # set HTTP-only cookie based on refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,    
        secure=True,      
        samesite="lax"    
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh")
def refresh(request: Request, db: Session = Depends(get_db)):

    # get refresh token from cookies 
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    
    # get user for creating new access token
    user = get_user_from_token(refresh_token, db)

    # create new access token
    new_access_token = create_token({"sub": user.email, "type": "access"}, 
                                    timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    return {"access_token": new_access_token, "token_type": "bearer"}

# get endpoint for current user
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# post endpoint for preferences of the current user
@router.post("/preferences", response_model=schemas.PreferenceResponse)
def add_preference(
    preference: schemas.PreferenceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id,
        models.Preference.topic == preference.topic
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preference already exists"
        )
    new_preference = models.Preference(
        user_id=current_user.id,
        topic=preference.topic
    )
    db.add(new_preference)
    db.commit()
    db.refresh(new_preference)
    return new_preference

# get endpoint for topics of the current user 
@router.get("/preferences", response_model=list[schemas.PreferenceResponse])
def get_preferences(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id
    ).all()

# delete endpoint for topic of the current user
@router.delete("/preferences/{topic}")
def delete_preference(
    topic: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preference = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id,
        models.Preference.topic == topic
    ).first()
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )
    db.delete(preference)
    db.commit()
    return {"message": "Preference deleted successfully"}