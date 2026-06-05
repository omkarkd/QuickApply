# QuickResume — Resume & JD Formatter

A full-stack application for parsing, formatting, scoring, and rewriting resumes against job descriptions. The UI is a single-file Streamlit app talking to a FastAPI backend with MongoDB.

## ✨ Features

- **AI resume parsing** via the Anthropic-compatible gateway at `opencode.ai/zen` (model `minimax-m3-free`)
- **Simple regex parsing** for fast turnaround
- **AI rewriting** of a resume against a specific JD, with before/after match scores
- **Match scoring** with keyword + alignment breakdown
- **PDF / DOCX download** with professional typography
- **Telegram bot** integration (per-user bot tokens, opt-in)
- **Email + password auth** with MongoDB-backed sessions

## 🛠️ Tech Stack

### Backend
- **FastAPI** + **motor** (async MongoDB)
- **anthropic** Python SDK (pointed at the opencode.ai/zen gateway)
- **reportlab** (PDF), **python-docx** (DOCX)
- **bcrypt** + **PyJWT** for sessions
- **python-telegram-bot** for the bot

### Frontend
- **Streamlit 1.40** (single-file app)
- **httpx** for the backend client
- No JS build pipeline, no `node_modules`

## 📁 Project Structure

```
.
├── backend/
│   ├── server.py            # FastAPI app, 22 routes
│   ├── requirements.txt     # 22 packages total (was 204)
│   └── .env.example
├── frontend/
│   ├── app.py               # Streamlit entry point + landing + auth forms
│   ├── api_client.py        # httpx wrapper for all 22 routes
│   ├── auth.py              # session_state + require_auth guard
│   ├── pages_dashboard.py
│   ├── pages_editor_resume.py
│   ├── pages_editor_jd.py
│   ├── pages_jd_list.py
│   ├── pages_rewriter.py
│   ├── pages_match.py
│   ├── pages_telegram.py
│   └── src_react_legacy/    # old React/CRA source kept for reference
├── tests/                   # pytest
└── README.md
```

## 🚀 Run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY (or use opencode.ai/zen credentials)
# also: MONGO_URL, DB_NAME, JWT_SECRET

# Start MongoDB locally or point MONGO_URL at your cluster
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 2. Frontend (Streamlit)

```bash
cd frontend
# Optional: point at a non-default backend
# export BACKEND_URL=http://localhost:8001
streamlit run app.py --server.port 8501
```

Open <http://localhost:8501>.

## 🔌 API Endpoints

All routes are mounted under `/api`.

### Auth
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — returns `{user, session_token}` (httpOnly cookie is also set)
- `GET /api/auth/me` — current user (accepts `Authorization: Bearer <session_token>` header)
- `POST /api/auth/logout`

### Resume
- `POST /api/parse/simple` — regex parse
- `POST /api/parse/ai` — AI parse
- `GET/POST /api/resumes` — list / create
- `GET/PUT/DELETE /api/resumes/{id}`

### Job description
- `POST /api/parse/jd/simple`
- `POST /api/parse/jd/ai`
- `GET/POST /api/jds`
- `GET/PUT/DELETE /api/jds/{id}`

### AI
- `POST /api/rewrite-resume` — `{resume_text, jd_text}` → `{rewritten_resume, improvements, score_before, score_after}`
- `POST /api/match-score` — `{resume_text, jd_text}` → `{overall_score, keywords_score, alignment_score, rpm_score, present_keywords, missing_keywords, suggestions, ...}`

### Downloads
- `POST /api/download/pdf` — body is a resume dict, returns `application/pdf`
- `POST /api/download/docx` — body is a resume dict, returns `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Telegram
- `GET /api/telegram/settings` — returns `{bot_token, is_active, chat_id}`
- `PUT /api/telegram/settings` — body `{bot_token, chat_id}`

## 🔧 Environment Variables

`backend/.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=quickapply
JWT_SECRET=<long-random-string>
CORS_ORIGINS=http://localhost:8501

# LLM (Anthropic-compatible gateway at opencode.ai/zen)
ANTHROPIC_BASE_URL=https://opencode.ai/zen
ANTHROPIC_MODEL=minimax-m3-free
ANTHROPIC_API_KEY=sk-...

# Optional global fallback
TELEGRAM_BOT_TOKEN=
```

Frontend env (optional):
```
BACKEND_URL=http://localhost:8001
```

## 🧪 Tests

```bash
cd backend
pytest -v
```

10 tests covering auth, parsing, CRUD, downloads, telegram settings.

## 📄 License

MIT
