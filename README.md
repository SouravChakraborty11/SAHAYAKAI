# 🌟 SAHAYAK AI — Government Scheme & Care Automation Platform

**Sahayak AI** is an AI-powered civic platform designed to streamline access to government schemes, healthcare, NGO support, caregiver assistance, live browser automation, human intervention workflows, cloud storage, vector semantic search, and multi-channel notifications for millions of citizens.

---

## 🏗️ System Architecture & Phase Breakdown

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           REACT 19 / VITE FRONTEND                      │
 │     [Dashboard]  [Schemes]  [Care Hub]  [Automation Panel]  [Notifs]    │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTP / REST API
 ┌────────────────────────────────────▼────────────────────────────────────┐
 │                            FASTAPI BACKEND API                          │
 │  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────┐  │
 │  │ Auth / Users │ Gemini AI    │ Playwright   │ Intervention │ Storage│  │
 │  │ Routes       │ Assistant    │ Automation   │ Manager      │ Router │  │
 │  └──────────────┴──────────────┴──────────────┴──────────────┴────────┘  │
 └──────────┬─────────────────────────┬─────────────────────────┬──────────┘
            │                         │                         │
 ┌──────────▼──────────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐
 │  POSTGRESQL / DB    │   ┌  QDRANT VECTOR DB   │   ┌ GOOGLE CLOUD / GCS  │
 │  Users, Receipts,   │   │  768-dim Embeddings │   │  Document & Receipt │
 │  Activity & Logs    │   │  Schemes & Metadata │   │  Object Storage     │
 └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### 📦 Development Phases Overview

1. **Phase 1 — Core Foundation & Design System**: Dark mode glassmorphism UI, high contrast typography, accessible components, and core layout.
2. **Phase 2 — Auth, Security & AI Voice Integration**: JWT auth, Google OAuth, Gemini AI voice/text chat assistant.
3. **Phase 3 — Schemes Database & Vector Search**: Qdrant vector embedding indexing for government scheme eligibility matching.
4. **Phase 4 — Caregiver & NGO Community Hub**: NGO listings, caregiver request manager, and healthcare provider lookup.
5. **Phase 5 — Status Tracking & Database Persistence**: Real reference numbers, status transition engine, and receipt storage.
6. **Phase 6 — Playwright Live Automation**: Headless browser automation filling government forms (`pmkisan.gov.in`) with step-by-step screenshots & real PDF receipts.
7. **Phase 7 — Human Intervention Manager**: Real-time CAPTCHA & OTP detection, session pause/resume controls, and state persistence.
8. **Phase 8 — Database Repositories, GCS & Vector Metadata**: PostgreSQL support, Repository Pattern, Google Cloud Storage with local fallback, and Qdrant metadata indexing.
9. **Phase 9 — Multi-Channel Notification Service**: Firebase Push (FCM), Email (SMTP), SMS, background retry engine, notification drawer, and 15s auto-polling.
10. **Phase 10 — Full System Integration & Docker Production Release**: Multi-stage Docker containers, Docker Compose, Nginx reverse proxy, and enterprise production deployment.

---

## 🚀 Quickstart with Docker Compose

Run the entire platform (Frontend, Backend, PostgreSQL, and Qdrant) in isolated containers with one command:

```bash
# 1. Clone Repository
git clone https://github.com/SouravChakraborty11/SAHAYAKAI.git
cd SAHAYAKAI

# 2. Copy Environment Template
cp .env.example .env

# 3. Launch Platform via Docker Compose
docker-compose up --build -d
```

### 🔗 Accessible Ports:
- **Frontend App**: [http://localhost](http://localhost) (Port 80)
- **Backend REST API**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI / Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Qdrant Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 💻 Manual Local Development Setup

### Backend (FastAPI + Python 3.11):

```bash
cd backend

# Create Virtual Environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Dependencies & Playwright Browsers
pip install -r requirements.txt
playwright install chromium

# Launch Uvicorn Server
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite + Tailwind/Vanilla CSS):

```bash
cd frontend

# Install Node Dependencies
npm install

# Launch Vite Dev Server
npm run dev -- --host 0.0.0.0
```

- Local Dev Frontend: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing & Audit Commands

```bash
# Run Frontend TypeScript Check
cd frontend
npx tsc --noEmit

# Run Frontend Production Build
npm run build

# Run Phase 9 Notification & Playwright Audit Suite
cd backend
python test_phase9_notifications.py
```

---

## 🔒 Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `USE_POSTGRES` | Toggle PostgreSQL (`true`/`false`) | `false` (SQLite fallback) |
| `POSTGRES_USER` | PostgreSQL Username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL Password | `postgres` |
| `POSTGRES_SERVER` | Database Host | `localhost` / `postgres` |
| `POSTGRES_DB` | Database Name | `sahayak` |
| `GEMINI_API_KEY` | Gemini AI Key for Chat & Embeddings | `YOUR_GEMINI_API_KEY` |
| `GCS_BUCKET_NAME` | Google Cloud Storage Bucket Name | `sahayak-app-storage` |
| `SECRET_KEY` | JWT Signing Key | Production Key |

---

## 📜 License & Author
- **Author**: Sourav Chakraborty & Sahayak AI Team
- **Repository**: [https://github.com/SouravChakraborty11/SAHAYAKAI](https://github.com/SouravChakraborty11/SAHAYAKAI)
