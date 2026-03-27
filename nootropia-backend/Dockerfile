FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r requirements.txt

COPY . .

RUN chmod +x fetch_publications.sh

EXPOSE 8000

CMD ["./fetch_publications.sh"]