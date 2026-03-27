from celery import Celery
from celery.schedules import crontab
from app.database import SessionLocal
from app import models
from pyalex import Works
import pyalex
import os
from dotenv import load_dotenv

# load env file
load_dotenv()

# get open alex api key from env file
pyalex.config.api_key = os.getenv("OPENALEX_API_KEY")

# creates a celery application
celery_app = Celery(
    "nootropia",
    broker=os.getenv("REDIS_URL"), # send tasks here
    backend=os.getenv("REDIS_URL") # stored tasks results here
)

# celery config that fetches new publications every 24 hours
celery_app.conf.beat_schedule = {
    "fetch-publications-every-24h": {
        "task": "app.celery_worker.fetch_and_store_publications",
        "schedule": crontab(hour=0, minute=0),
    }
}

# topics list
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

# publication description changes from {"word1": [1], "word2": [2]} to "word1 word2"
def reconstruct_abstract(inverted_index):
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

# celery task that fetches publications from openAlex
@celery_app.task
def fetch_and_store_publications():
    db = SessionLocal() # db session to save fetched publications
    try:
        # fetch papers for every topic in our list
        for topic in TOPICS:
            print(f"Fetching publications for topic: {topic}")
            works = (
                Works() # create openAlex query object
                .filter(title_and_abstract={"search": topic}) # search for topic in title or description
                .filter(is_oa=True) # open access papers only
                .sort(cited_by_count="desc") # get more popular papers first 
                .get(per_page=20) # limit request to 20 papers(per day about that topic)
            )
            
            # check if it already exists and update citations, topics for every paper we fetched
            for work in works:
                try:
                    existing = db.query(models.Publication).filter(
                        models.Publication.openalex_id == work["id"]
                    ).first()

                    if existing:
                        existing.citations = work.get("cited_by_count", 0)
                        existing_topics = [t.topic for t in existing.topics]
                        # create new topic tag for this publication
                        if topic not in existing_topics:
                            new_topic = models.PublicationTopic(
                                publication_id=existing.id,
                                topic=topic
                            )
                            db.add(new_topic)
                        db.commit()
                        continue
                    
                    # concatinate authors into one string
                    authors = ", ".join([
                        a["author"]["display_name"]
                        for a in work.get("authorships", [])[:5] # only take first five authors
                        if a.get("author") and a["author"].get("display_name") # check if there is missing data
                    ])

                    # get description of paper as a string 
                    abstract = reconstruct_abstract(
                        work.get("abstract_inverted_index")
                    )
                    
                    # create new publication object and add it to db
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
                    db.flush() # flush to get publictation id

                    # create new publication topic object and add it to db
                    new_pub_topic = models.PublicationTopic(
                        publication_id=new_publication.id,
                        topic=topic
                    )
                    db.add(new_pub_topic)
                    db.commit()
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

