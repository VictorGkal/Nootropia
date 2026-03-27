from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# class to create users table in db
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    preferences = relationship("Preference", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")

# class to create topics for users (table) in db
class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, nullable=False)

    user = relationship("User", back_populates="preferences")

# class to create topics for publications (table) in db
class PublicationTopic(Base):
    __tablename__ = "publication_topics"

    id = Column(Integer, primary_key=True, index=True)
    publication_id = Column(Integer, ForeignKey("publications.id"))
    topic = Column(String, nullable=False, index=True)

    publication = relationship("Publication", back_populates="topics")

# class to create publications table in db
class Publication(Base):
    __tablename__ = "publications"

    id = Column(Integer, primary_key=True, index=True)
    openalex_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(String)
    year = Column(Integer)
    citations = Column(Integer, default=0)
    topic = Column(String)
    abstract = Column(Text)
    url = Column(String)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    topics = relationship("PublicationTopic", back_populates="publication")
    bookmarks = relationship("Bookmark", back_populates="publication")

# class to create bookmarks table in db
class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    publication_id = Column(Integer, ForeignKey("publications.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")
    publication = relationship("Publication", back_populates="bookmarks")