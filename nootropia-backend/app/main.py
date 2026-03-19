from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, publications

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nootropia",
    description="Academic publications platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

app.include_router(
    publications.router,
    prefix="/publications",
    tags=["publications"]
)

@app.get("/")
def root():
    return {"message": "Welcome to Nootropia!"}