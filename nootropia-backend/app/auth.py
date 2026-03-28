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
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# for password encryption use bcrypt algorithm, hash 12 times and recognize old hashes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# expect token in the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# encrpyt password
def hash_password(password):
    return pwd_context.hash(password)

# verify that password was encrypted
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# data = {"sub": "victor@gmail.com"}
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    
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

# get user based on jwt token
def get_current_user(
    token: str = Depends(oauth2_scheme), # extract token from authorization header
    db: Session = Depends(get_db) # create a db seasion for later user filtering
):  
    # create exception error handling
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # decode jwt token 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # wrap email found in the token into a token object
        token_data = schemas.TokenData(email=payload.get("sub"))

        if token_data.email is None:
            raise credentials_exception
        
    except JWTError:    
        raise credentials_exception
    
    # find user based on email found in the token 
    user = db.query(models.User).filter(
        models.User.email == token_data.email
    ).first()
    if user is None:
        raise credentials_exception
    return user