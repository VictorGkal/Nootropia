from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
import random

router = APIRouter()

@router.get("/", response_model=list[schemas.PublicationResponse])
def get_publications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = Query(default=0),
    limit: int = Query(default=10)
):
    user_topics = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id
    ).all()
    topics = [p.topic for p in user_topics]

    if not topics:
        publications = db.query(models.Publication).offset(skip).limit(limit).all()
    else:
        publications = db.query(models.Publication).filter(
            models.Publication.topic.in_(topics)
        ).offset(skip).limit(limit).all()

    return publications


@router.get("/random", response_model=list[schemas.PublicationResponse])
def get_random_publications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    count: int = Query(default=5)
):
    user_topics = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id
    ).all()
    topics = [p.topic for p in user_topics]

    if not topics:
        publications = db.query(models.Publication).all()
    else:
        publications = db.query(models.Publication).filter(
            models.Publication.topic.in_(topics)
        ).all()

    if len(publications) <= count:
        return publications

    return random.sample(publications, count)


@router.get("/recent", response_model=list[schemas.PublicationResponse])
def get_recent_publications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(default=10)
):
    user_topics = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id
    ).all()
    topics = [p.topic for p in user_topics]

    query = db.query(models.Publication).order_by(
        models.Publication.year.desc()
    )

    if topics:
        query = query.filter(models.Publication.topic.in_(topics))

    return query.limit(limit).all()


@router.get("/popular", response_model=list[schemas.PublicationResponse])
def get_popular_publications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(default=10)
):
    from datetime import datetime
    current_year = datetime.utcnow().year

    user_topics = db.query(models.Preference).filter(
        models.Preference.user_id == current_user.id
    ).all()
    topics = [p.topic for p in user_topics]

    query = db.query(models.Publication).filter(
        models.Publication.year == current_year
    ).order_by(models.Publication.citations.desc())

    if topics:
        query = query.filter(models.Publication.topic.in_(topics))

    return query.limit(limit).all()


@router.get("/search", response_model=list[schemas.PublicationResponse])
def search_publications(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(default=10)
):
    publications = db.query(models.Publication).filter(
        models.Publication.title.ilike(f"%{q}%") |
        models.Publication.authors.ilike(f"%{q}%") |
        models.Publication.abstract.ilike(f"%{q}%")
    ).limit(limit).all()

    return publications


@router.get("/{publication_id}", response_model=schemas.PublicationResponse)
def get_publication(
    publication_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    bookmarks = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id
    ).all()

    publication_ids = [b.publication_id for b in bookmarks]

    publications = db.query(models.Publication).filter(
        models.Publication.id.in_(publication_ids)
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