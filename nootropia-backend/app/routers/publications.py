from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_optional_user

# mini router that groups related endpoints together
router = APIRouter()

# get the most recent publications
@router.get("/recent", response_model=list[schemas.PublicationResponse])
def get_recent_publications(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    skip: int = Query(default=0), 
    limit: int = Query(default=10), # limit publications responses by 10
    topics: Optional[str] = Query(default=None)
):  
    # create base query 
    query = db.query(models.Publication).order_by(
        models.Publication.year.desc()
    )
    
    # if user search for recent publications based on his topics
    if current_user:
        user_topics = [p.topic for p in current_user.preferences]
        # join base query and filter it by users topics
        if user_topics:
            query = query.join(models.PublicationTopic).filter(
                models.PublicationTopic.topic.in_(user_topics)
            )
    # if guest then filter publications by temporary topics using the base query       
    elif topics:
        topic_list = topics.split(",")
        query = query.join(models.PublicationTopic).filter(
            models.PublicationTopic.topic.in_(topic_list)
        )

    return query.distinct().offset(skip).limit(limit).all()

# get the most popular by citations publications
@router.get("/popular", response_model=list[schemas.PublicationResponse])
def get_popular_publications(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
    skip: int = Query(default=0), 
    limit: int = Query(default=10),
    topics: Optional[str] = Query(default=None)
):  
    # create base query 
    query = db.query(models.Publication).order_by(
        models.Publication.citations.desc()
    )

    # if user search for popular publications based on his topics
    if current_user:
        user_topics = [p.topic for p in current_user.preferences]
        if user_topics:
            query = query.join(models.PublicationTopic).filter(
                models.PublicationTopic.topic.in_(user_topics)
            )
    # if guest then filter publications by temporary topics using the base query       
    elif topics:
        topic_list = topics.split(",")
        query = query.join(models.PublicationTopic).filter(
            models.PublicationTopic.topic.in_(topic_list)
        )

    return query.distinct().offset(skip).limit(limit).all()

# endpoint for searching publications
@router.get("/search", response_model=list[schemas.PublicationResponse])
def search_publications(
    q: str = Query(..., min_length=2), # required for search endpoint
    db: Session = Depends(get_db),
    limit: int = Query(default=10)
):
    # user search is filter by title, authors and description
    publications = db.query(models.Publication).filter(
        models.Publication.title.ilike(f"%{q}%") |
        models.Publication.authors.ilike(f"%{q}%") |
        models.Publication.abstract.ilike(f"%{q}%")
    ).limit(limit).all()
    return publications

# endpoint to create a bookmark, user is needed
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

# endpoint to get publications based on users bookmarks
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

# endpoint to delete a users bookmark
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
