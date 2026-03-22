from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from jose import JWTError, jwt
import random
import os

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token", auto_error=False)

def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    if not token:
        return None
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        email = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except JWTError:
        return None


@router.get("/recent", response_model=list[schemas.PublicationResponse])
def get_recent_publications(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    topics: Optional[str] = Query(default=None)
):
    query = db.query(models.Publication).order_by(
        models.Publication.year.desc()
    )
    if current_user:
        user_topics = [p.topic for p in current_user.preferences]
        if user_topics:
            query = query.filter(models.Publication.topic.in_(user_topics))
    elif topics:
        topic_list = topics.split(",")
        query = query.filter(models.Publication.topic.in_(topic_list))

    return query.offset(skip).limit(limit).all()


@router.get("/popular", response_model=list[schemas.PublicationResponse])
def get_popular_publications(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    topics: Optional[str] = Query(default=None)
):
    query = db.query(models.Publication).order_by(
        models.Publication.citations.desc()
    )
    if current_user:
        user_topics = [p.topic for p in current_user.preferences]
        if user_topics:
            query = query.filter(models.Publication.topic.in_(user_topics))
    elif topics:
        topic_list = topics.split(",")
        query = query.filter(models.Publication.topic.in_(topic_list))

    return query.offset(skip).limit(limit).all()


@router.get("/random", response_model=list[schemas.PublicationResponse])
def get_random_publications(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    count: int = Query(default=5),
    topics: Optional[str] = Query(default=None)
):
    query = db.query(models.Publication)
    if current_user:
        user_topics = [p.topic for p in current_user.preferences]
        if user_topics:
            query = query.filter(models.Publication.topic.in_(user_topics))
    elif topics:
        topic_list = topics.split(",")
        query = query.filter(models.Publication.topic.in_(topic_list))

    publications = query.all()
    if len(publications) <= count:
        return publications
    return random.sample(publications, count)


@router.get("/search", response_model=list[schemas.PublicationResponse])
def search_publications(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    limit: int = Query(default=10)
):
    publications = db.query(models.Publication).filter(
        models.Publication.title.ilike(f"%{q}%") |
        models.Publication.authors.ilike(f"%{q}%") |
        models.Publication.abstract.ilike(f"%{q}%")
    ).limit(limit).all()
    return publications


@router.post("/bookmarks", response_model=schemas.BookmarkResponse)
def add_bookmark(
    bookmark: schemas.BookmarkCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    publication = db.query(models.Publication).filter(
        models.Publication.id == bookmark.publication_id
    ).first()
    if not publication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publication not found"
        )
    existing = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id,
        models.Bookmark.publication_id == bookmark.publication_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already bookmarked"
        )
    new_bookmark = models.Bookmark(
        user_id=current_user.id,
        publication_id=bookmark.publication_id
    )
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)
    return new_bookmark


@router.get("/bookmarks/me", response_model=list[schemas.PublicationResponse])
def get_my_bookmarks(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # join bookmarks with publications directly
    publications = db.query(models.Publication).join(
        models.Bookmark,
        models.Bookmark.publication_id == models.Publication.id
    ).filter(
        models.Bookmark.user_id == current_user.id
    ).all()
    return publications


@router.delete("/bookmarks/{publication_id}")
def delete_bookmark(
    publication_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id,
        models.Bookmark.publication_id == publication_id
    ).first()
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark deleted successfully"}


@router.get("/{publication_id}", response_model=schemas.PublicationResponse)
def get_publication(
    publication_id: int,
    db: Session = Depends(get_db),
):
    publication = db.query(models.Publication).filter(
        models.Publication.id == publication_id
    ).first()
    if not publication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publication not found"
        )
    return publication