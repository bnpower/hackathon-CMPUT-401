# hackathon-CMPUT-401

CMPT 401 Hackathon repo for the AltaLab team.

A job application manager that helps job seekers track, apply, and manage their
job applications: application tracking by stage, reminders, master/tailored
resume management, and communication/response logging. See `requirements.md`
for the full feature brief.

## Stack

- **Backend:** Django + Django REST Framework (Python), JWT auth via
  `djangorestframework-simplejwt`, Postgres in Docker / SQLite for local dev.
- **Frontend:** React (Vite).
- **Containerization:** Docker Compose (`db`, `backend`, `frontend` services).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose, **or**
- Python 3.12+ and Node.js 20+ if running the services natively.

## Running with Docker (recommended)

From the repo root:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173/
- Backend API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/

The `backend` service runs migrations and seeds demo data automatically on startup
(safe to restart — seeding is skipped if demo data already exists). Sign in at
http://localhost:5173/login with:

- **Username:** `demo`
- **Password:** `demopass123`

This gives you 7 pre-loaded job applications across every stage (wishlist, applied,
interview, offer, rejected, withdrawn), stage history, reminders, a master resume,
two tailored resumes, and logged communications.

To create a separate admin user in the running container:

```bash
docker compose exec backend python manage.py createsuperuser
```

To wipe and reseed the demo data:

```bash
docker compose exec backend python manage.py seed_demo_data --reset
```

Stop everything with `docker compose down` (add `-v` to also drop the Postgres volume).

## Running locally without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # Windows; use `source .venv/bin/activate` on macOS/Linux/WSL
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo_data     # optional, loads the demo user + sample data
python manage.py createsuperuser    # optional, for /admin/
python manage.py runserver
```

The backend runs at http://localhost:8000/ using SQLite by default (see `backend/.env.example`).
`seed_demo_data` creates a `demo` / `demopass123` user with sample applications, resumes,
reminders, and communications; it's safe to re-run (pass `--reset` to wipe and reseed).

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at http://localhost:5173/ and talks to the backend via `VITE_API_URL`
(defaults to `http://localhost:8000/api`, set in `frontend/.env`).

## Project structure

```
backend/            Django project (DRF API)
  config/           settings, root urls
  accounts/         registration + JWT auth
  applications/     job applications, stage history, reminders
  resumes/          master + tailored resumes
  communications/   logged responses/contact per application
frontend/           React app (Vite)
  src/api/          axios client (attaches JWT, reads VITE_API_URL)
  src/pages/        route-level pages
docker-compose.yml  db + backend + frontend for local dev
```

## API overview

All endpoints below are under `/api/` and (aside from register/token) require
`Authorization: Bearer <access_token>`.

| Endpoint | Description |
| --- | --- |
| `POST /api/auth/register/` | Create a user account |
| `POST /api/auth/token/` | Obtain JWT access/refresh tokens |
| `POST /api/auth/token/refresh/` | Refresh an access token |
| `GET /api/auth/me/` | Current user profile |
| `/api/applications/` | CRUD job applications (stage, dates, notes, status history, reminders) |
| `/api/reminders/` | CRUD follow-up reminders tied to an application |
| `/api/resumes/` | CRUD master + tailored resumes |
| `/api/communications/` | CRUD logged communications (emails, calls, interviews, offers, rejections) per application |

## Deploying to Cybera RAC

Pushing to `main` deploys automatically via `.github/workflows/deploy.yml`: GitHub Actions
SSHes into the server, pulls the latest code, and runs `docker compose -f docker-compose.prod.yml
up -d --build` (Gunicorn + Whitenoise for the backend, an nginx-served static build for the
frontend). You can also trigger it manually from the Actions tab (`workflow_dispatch`).

### 1. Provision the Cybera RAC instance

In the [Cybera RAC dashboard](https://rac.cybera.ca/) (OpenStack Horizon):

- **Image:** Ubuntu 22.04 LTS
- **Flavor:** at least 2 vCPUs / 4 GB RAM (Postgres + Django + a Node build all run on one box)
- **Network:** assign a **floating IP** so the box is reachable from the internet
- **Security group:** allow inbound TCP `22` (SSH — restrict the source range if you can),
  `80` (frontend), and `8000` (backend API)
- **Key pair:** create/import one in RAC so you can SSH in

### 2. Bootstrap the box (one-time, run on the server)

```bash
ssh ubuntu@<floating-ip>
curl -fsSL https://raw.githubusercontent.com/bnpower/hackathon-CMPUT-401/main/deploy/bootstrap-server.sh | bash
```

This installs Docker, clones the repo into `/opt/hackathon-cmput-401`, and creates a starter
`.env` from `.env.prod.example`. Edit that `.env` with real values (`DJANGO_SECRET_KEY`,
`DB_PASSWORD`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `VITE_API_URL` — see
`.env.prod.example` for the shape), then do one manual deploy to confirm it works:

```bash
cd /opt/hackathon-cmput-401
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. GitHub Actions secrets

Add these under the repo's **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `RAC_HOST` | The instance's floating IP (or DNS name) |
| `RAC_USERNAME` | SSH user (`ubuntu` on the standard Ubuntu image) |
| `RAC_SSH_KEY` | Private key matching the key pair you assigned to the instance (paste the whole PEM) |
| `RAC_SSH_PORT` | Optional, only if SSH isn't on port 22 |

Application secrets (`DJANGO_SECRET_KEY`, `DB_PASSWORD`, etc.) live only in the server's
`.env` file, not in GitHub — the workflow never touches them directly, it just runs
`docker compose`, which reads `.env` on the box.

After that, every push to `main` redeploys automatically. This assumes the GitHub repo is
public so `git fetch` on the server needs no credentials; if you make it private, either add
a deploy key on the server or switch the bootstrap clone/fetch to use a PAT.

## Troubleshooting

- **Port already in use:** something else is bound to 5173/8000/5432 — stop it or change the
  published port in `docker-compose.yml`.
- **Frontend gets 401s:** you need a token first — register via `/api/auth/register/`, then
  sign in through the frontend's `/login` page (or `POST /api/auth/token/` directly).
- **Backend can't reach Postgres locally (non-Docker):** local dev defaults to SQLite; only the
  Docker Compose setup uses Postgres.

See `CONTRIBUTING.md` for how to submit changes.
