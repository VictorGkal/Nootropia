#!/bin/bash
echo "Starting uvicorn..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

echo "Waiting for server..."
sleep 5

echo "Fetching publications..."
python -c "from app.celery_worker import fetch_and_store_publications; fetch_and_store_publications()"

echo "Done! Keeping server running..."
wait