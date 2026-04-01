Nootropia is a full-stack academic publications platform built with FastAPI and React.js.
It features JWT authentication, PostgreSQL, automated publication fetching using Celery &
Redis, and a responsive UI with infinite scroll, all containerized with Docker.

- HOW TO RUN IT -

1. Clone the repository

git clone https://github.com/VictorGkal/Nootropia.git

2. Navigate to the project root

cd Nootropia-App

3. Verify the project structure

ls

You should see:

nootropia-backend/
nootropia-frontend/
.gitattributes
.gitignore
docker-compose.yml
README.md

4. Create a .env file

Inside the nootropia-backend folder, create a .env file based on .env.example:

DATABASE_URL=postgresql://nootropia:nootropia123@nootropia-postgres:5432/nootropia
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://nootropia-redis:6379
OPENALEX_API_KEY=your-openalex-api-key-here

Replace your-secret-key-here with your own secret key (used for authentication encryption).

Replace your-openalex-api-key-here by creating an account at https://openalex.org
and copying your API key.

5. Check required ports

Make sure the following ports are not in use:

8000, 5432, 6379, 5173

6. Start the application

docker compose up --build

7. Open the app

Go to:

http://localhost:5173/
