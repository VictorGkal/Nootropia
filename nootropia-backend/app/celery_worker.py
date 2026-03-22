from celery import Celery
from celery.schedules import crontab
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
    "blockchain",
    "deep learning",
    "natural language processing",
    "computer vision",
    "robotics",
    "quantum computing",
    "augmented reality",
    "virtual reality",
    "big data",
    "edge computing",
    "5g networks",
    "bioinformatics",
    "cryptography",
    "distributed systems",
    "operating systems",
    "computer architecture",
    "web development",
    "mobile development",
    "devops",
    "microservices",
    "api design",
]

def reconstruct_abstract(inverted_index):
    """Reconstruct abstract from OpenAlex inverted index format"""
    if not inverted_index:
        return None
    try:
        words = {}
        for word, positions in inverted_index.items():
            for pos in positions:
                words[pos] = word
        if not words:
            return None
        return " ".join(words[i] for i in sorted(words.keys()))
    except Exception:
        return None


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
                        # add topic if not already there
                        existing_topics = [t.topic for t in existing.topics]
                        if topic not in existing_topics:
                            new_topic = models.PublicationTopic(
                                publication_id=existing.id,
                                topic=topic
                            )
                            db.add(new_topic)
                        db.commit()
                        continue

                    authors = ", ".join([
                        a["author"]["display_name"]
                        for a in work.get("authorships", [])[:5]
                        if a.get("author") and a["author"].get("display_name")
                    ])

                    abstract = reconstruct_abstract(
                        work.get("abstract_inverted_index")
                    )

                    new_publication = models.Publication(
                        openalex_id=work["id"],
                        title=work.get("title", "No title"),
                        authors=authors,
                        year=work.get("publication_year"),
                        citations=work.get("cited_by_count", 0),
                        topic=topic,
                        abstract=abstract[:1000] if abstract else None,
                        url=work.get("primary_location", {}).get("landing_page_url") if work.get("primary_location") else None
                    )
                    db.add(new_publication)
                    db.flush()

                    # save topic to publication_topics
                    new_pub_topic = models.PublicationTopic(
                        publication_id=new_publication.id,
                        topic=topic
                    )
                    db.add(new_pub_topic)
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

                # reconstruct abstract from inverted index
                abstract = reconstruct_abstract(
                    work.get("abstract_inverted_index")
                )

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