# Nootropia 🧠

A full-stack academic publications platform that aggregates and personalizes research papers from the [OpenAlex](https://openalex.org) API based on user interests.

🔗 [GitHub Repository](https://github.com/VictorGkal/Nootropia)

---

## Features

- 🔐 JWT Authentication (register, login, logout)
- 🎯 Personalized publications feed based on selected topics
- 📚 Multiple topics per publication
- 🔖 Bookmark system with Instagram-style animation
- 🔄 Infinite scroll pagination
- 🔍 Search publications by title, author or abstract
- 👤 Guest mode with localStorage topic persistence
- ⏰ Automated daily publication fetching via Celery scheduler
- 📱 Responsive UI with glassmorphism design

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python & FastAPI | REST API framework |
| PostgreSQL | Relational database |
| SQLAlchemy | ORM for database modeling |
| JWT (python-jose) | Authentication |
| Celery & Redis | Background task scheduler |
| Docker & Docker Compose | Containerization |
| OpenAlex API | Academic publications data |
| Pydantic | Data validation |

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI framework |
| Tailwind CSS | Styling |
| React Router | Client-side navigation |
| Axios | HTTP client with interceptors |
| Context API | Global auth state management |
| Intersection Observer | Infinite scroll |

---

## Project Structure

```
Nootropia/
├── nootropia-backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication
│   │   ├── celery_worker.py     # Celery scheduler + OpenAlex integration
│   │   └── routers/
│   │       ├── users.py         # User endpoints
│   │       └── publications.py  # Publication endpoints
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
└── nootropia-frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── TopicsPage.jsx
        │   └── FeedPage.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── PublicationCard.jsx
        │   ├── TopicBox.jsx
        │   ├── TopicBadge.jsx
        │   ├── SearchBar.jsx
        │   └── ...
        ├── context/
        │   └── AuthContext.jsx
        └── services/
            └── api.js
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- OpenAlex API key ([get one free here](https://openalex.org))

---

### Backend Setup

**1. Clone the repository:**
```bash
git clone https://github.com/VictorGkal/Nootropia.git
cd Nootropia
```

**2. Create virtual environment:**
```bash
cd nootropia-backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Mac/Linux
source .venv/bin/activate
```

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables:**
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
DATABASE_URL=postgresql://nootropia:nootropia123@localhost:5432/nootropia
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REDIS_URL=redis://localhost:6379
OPENALEX_API_KEY=your-openalex-api-key
```

**5. Start Docker containers (PostgreSQL + Redis):**
```bash
docker-compose up -d
```

**6. Start the backend:**
```bash
uvicorn app.main:app --reload
```

**7. Fetch initial publications:**
```bash
python -c "from app.celery_worker import fetch_and_store_publications; fetch_and_store_publications()"
```

Backend runs at: `http://127.0.0.1:8000`
API docs at: `http://127.0.0.1:8000/docs`

---

### Frontend Setup

```bash
cd nootropia-frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

### Users
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/users/register` | Register new account | ❌ |
| POST | `/users/login` | Login and get JWT token | ❌ |
| GET | `/users/me` | Get current user | ✅ |
| POST | `/users/preferences` | Add topic preference | ✅ |
| GET | `/users/preferences` | Get all preferences | ✅ |
| DELETE | `/users/preferences/{topic}` | Delete preference | ✅ |

### Publications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/publications/recent` | Get recent publications | ❌ |
| GET | `/publications/popular` | Get popular publications | ❌ |
| GET | `/publications/search` | Search publications | ❌ |
| POST | `/publications/bookmarks` | Bookmark a publication | ✅ |
| GET | `/publications/bookmarks/me` | Get saved publications | ✅ |
| DELETE | `/publications/bookmarks/{id}` | Remove bookmark | ✅ |

---

## How It Works

```
Every 24 hours:
Celery Beat → OpenAlex API → Fetch publications per topic
                           → Save to PostgreSQL with multiple topic tags

User visits feed:
Frontend → FastAPI → PostgreSQL → Filter by user preferences → Return publications
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time |
| `REDIS_URL` | Redis connection string |
| `OPENALEX_API_KEY` | OpenAlex API key |

---

## License

MIT License — feel free to use this project for learning or inspiration!
