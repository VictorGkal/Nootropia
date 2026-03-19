from celery import Celery
from celery.schedules import crontab
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from pyalex import Works
import pyalex
import os
from dotenv import load_dotenv

load_dotenv()

pyalex.config.api_key = os.getenv("OPENALEX_API_KEY")

celery_app = Celery(
    "nootropia",
    broker=os.getenv("REDIS_URL"),
    backend=os.getenv("REDIS_URL")
)

celery_app.conf.beat_schedule = {
    "fetch-publications-every-24h": {
        "task": "app.celery_worker.fetch_and_store_publications",
        "schedule": crontab(hour=0, minute=0),
    }
}

TOPICS = [
    "artificial intelligence",
    "machine learning",
    "cybersecurity",
    "computer networks",
    "data science",
    "software engineering",
    "database systems",
    "cloud computing",
    "internet of things",
    "blockchain"
]

@celery_app.task
def fetch_and_store_publications():
    db = SessionLocal()
    try:
        for topic in TOPICS:
            print(f"Fetching publications for topic: {topic}")
            works = (
                Works()
                .filter(title_and_abstract={"search": topic})
                .filter(is_oa=True)
                .sort(cited_by_count="desc")
                .get(per_page=20)
            )
            for work in works:
                try:
                    existing = db.query(models.Publication).filter(
                        models.Publication.openalex_id == work["id"]
                    ).first()

                    if existing:
                        existing.citations = work.get("cited_by_count", 0)
                        db.commit()
                        continue

                    authors = ", ".join([
                        a["author"]["display_name"]
                        for a in work.get("authorships", [])[:5]
                        if a.get("author") and a["author"].get("display_name")
                    ])

                    abstract = work.get("abstract", "") or ""

                    new_publication = models.Publication(
                        openalex_id=work["id"],
                        title=work.get("title", "No title"),
                        authors=authors,
                        year=work.get("publication_year"),
                        citations=work.get("cited_by_count", 0),
                        topic=topic,
                        abstract=abstract[:500] if abstract else None,
                        url=work.get("primary_location", {}).get("landing_page_url") if work.get("primary_location") else None
                    )
                    db.add(new_publication)
                    db.commit()
                    db.refresh(new_publication)
                    print(f"Saved: {work.get('title', 'No title')[:50]}")

                except Exception as e:
                    print(f"Error saving publication: {e}")
                    db.rollback()
                    continue

        print("Fetch completed successfully!")

    except Exception as e:
        print(f"Error fetching publications: {e}")
    finally:
        db.close()


@celery_app.task
def fetch_publications_for_topic(topic: str):
    db = SessionLocal()
    try:
        works = (
            Works()
            .filter(title_and_abstract={"search": topic})
            .filter(is_oa=True)
            .sort(cited_by_count="desc")
            .get(per_page=20)
        )
        for work in works:
            try:
                existing = db.query(models.Publication).filter(
                    models.Publication.openalex_id == work["id"]
                ).first()

                if existing:
                    continue

                authors = ", ".join([
                    a["author"]["display_name"]
                    for a in work.get("authorships", [])[:5]
                    if a.get("author") and a["author"].get("display_name")
                ])

                abstract = work.get("abstract", "") or ""

                new_publication = models.Publication(
                    openalex_id=work["id"],
                    title=work.get("title", "No title"),
                    authors=authors,
                    year=work.get("publication_year"),
                    citations=work.get("cited_by_count", 0),
                    topic=topic,
                    abstract=abstract[:500] if abstract else None,
                    url=work.get("primary_location", {}).get("landing_page_url") if work.get("primary_location") else None
                )
                db.add(new_publication)
                db.commit()
                print(f"Saved: {work.get('title', 'No title')[:50]}")

            except Exception as e:
                print(f"Error saving publication: {e}")
                db.rollback()
                continue

    except Exception as e:
        print(f"Error fetching topic {topic}: {e}")
    finally:
        db.close()