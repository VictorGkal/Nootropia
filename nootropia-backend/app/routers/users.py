from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

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
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

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