from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
import os
from dotenv import load_dotenv

# get env file
load_dotenv()

# load env variables for jwt settings
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = os.getenv("ALGORITHM")

# for password encryption use bcrypt algorithm, hash 12 times and recognize old hashes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# expect token in the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# for optional auth (guest) returns none if no token
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

# encrpyt password
def hash_password(password):
    return pwd_context.hash(password)

# verify that password was encrypted
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# create token function either for access or refresh
def create_token(data: dict, expires_delta: Optional[timedelta] = None):
    
     # copy data so we dont modify the original
    to_encode = data.copy()

    # if token expire duration is provided 
    if expires_delta:
        # set token expire time based on live time and provided duration
        expire = datetime.utcnow() + expires_delta
    # if token duration is not provided
    else:
        # set token expire time based on live time and default duration (15 minutes)
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # set token duration time
    to_encode.update({"exp": expire})

    # encode everything into a jwt token string
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

# get user from token
def get_user_from_token(token: str, db: Session):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # wrap email found in the token into a token object
        token_data = schemas.TokenData(email=payload.get("sub"))

        if token_data.email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # get user based on email
    user = db.query(models.User).filter(
        models.User.email == token_data.email
    ).first()

    if user is None:
        raise credentials_exception
    return user

# get user based on jwt token only fastApi can 
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    return get_user_from_token(token, db)

# get user if there is a token or get a guest if there is none
def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except JWTError:
        return None