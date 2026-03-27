from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# load env variables
load_dotenv()

# get db url env
DATABASE_URL = os.getenv("DATABASE_URL")

# set up the database engine using the connection URL
engine = create_engine(DATABASE_URL)

# factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# create parent class for all models
Base = declarative_base()

def get_db():
    # create db session for each request   
    db = SessionLocal()
    try: 
        yield db # lends db session where needed
    finally:
        db.close() # close db session after finishing the request