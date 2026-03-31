from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, publications

# reads all models and creates their tables in db if they dont exist yet
Base.metadata.create_all(bind=engine)

# create the fastapi application
app = FastAPI(
    title="Nootropia",
    description="Academic publications platform",
    version="1.0.0"
)

# add cors configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # allow communication with frontend 
    allow_credentials=True,  # allow cookies and auth headers
    allow_methods=["*"], # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# adds user router to our fastapi application
app.include_router(
    users.router, 
    prefix="/users", # add prefix for all user endpoints
    tags=["users"] # groups endpoints in docs
)

# adds publication router to our fastapi application
app.include_router(
    publications.router,
    prefix="/publications", # add prefix for all publication endpoints
    tags=["publications"] # groups endpoints in docs
)

# verify that the server is running
@app.get("/")
def root():
    return {"message": "Backend is running"}