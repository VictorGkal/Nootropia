#!/bin/bash
echo "starting uvicorn app..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

echo "waiting for server..."
sleep 5

echo "fetching publications..."
python -c "from app.celery_worker import fetch_and_store_publications; fetch_and_store_publications()"

echo "keep the server running..."
wait