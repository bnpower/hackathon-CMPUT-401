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

Pushing to `main` or `brady` deploys automatically via `.github/workflows/deploy.yml`:
GitHub Actions SSHes into the server, pulls the latest code for whichever branch was pushed,
and runs `docker compose -f docker-compose.prod.yml up -d --build` (Gunicorn + Whitenoise for
the backend, an nginx-served static build for the frontend). You can also trigger it manually
from the Actions tab (`workflow_dispatch`).

### 1. Provision the Cybera RAC instance

In the [Cybera RAC dashboard](https://cloud.cybera.ca/) (OpenStack Horizon):

- **Image:** Ubuntu 22.04 LTS
- **Flavor:** `m1.small` works but is tight (2 vCPU/2GB — building the frontend and backend
  images at the same time uses most of that); `m1.medium` (2 vCPU/4GB) has more headroom
- **Boot source:** `Image`, with **Create New Volume** = Yes (~20GB), boot-from-volume /
  volume-snapshot options are not supported on RAC
- **Key pair:** create one in the RAC dashboard (**Compute → Key Pairs → Create Key Pair**) —
  it auto-downloads a `.pem` private key, which is what you SSH in with and what becomes the
  `RAC_SSH_KEY` secret below
- **IP address:** RAC gives every instance a public **IPv6** address automatically — no
  floating IP needed unless your network can't route IPv6 (floating IPv4 quota defaults to
  **0** and has to be requested via the **RAC → Quota Change** menu if you need one)
- **Security group (`default`):** add ingress rules for TCP `22`, `80`, and `8000` — and since
  the instance is reachable over IPv6, add **both** an IPv4 (`0.0.0.0/0`) and an **IPv6
  (`::/0`)** rule for each port. Horizon tracks these as separate rule sets; an IPv4-only rule
  does nothing for an IPv6 connection.

### 2. Bootstrap the box (one-time, run on the server)

```bash
ssh -i <key_pair_name>.pem ubuntu@<ipv6-address>
curl -fsSL https://raw.githubusercontent.com/bnpower/hackathon-CMPUT-401/main/deploy/bootstrap-server.sh | REPO_BRANCH=main bash
```

(swap `REPO_BRANCH=main` for whichever branch you're deploying, e.g. `brady`)

This installs Docker and clones the repo into `~/app`. Then create `.env` from the example and
fill in real values — note that with an IPv6-only host, URLs need bracket notation:

```bash
cd ~/app
cp .env.prod.example .env
# DJANGO_ALLOWED_HOSTS=*  (or the bracketed IPv6 literal)
# CORS_ALLOWED_ORIGINS=http://[<ipv6-address>]
# VITE_API_URL=http://[<ipv6-address>]:8000/api
nano .env
docker compose -f docker-compose.prod.yml up -d --build
```

Visit `http://[<ipv6-address>]/` in a browser (brackets required for a literal IPv6 host in a URL).

### 3. GitHub Actions secrets

Add these under the repo's **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `RAC_HOST` | The instance's IPv6 address (bare, no brackets) — or a floating IPv4 if you have one |
| `RAC_USERNAME` | SSH user (`ubuntu` on the standard Ubuntu image) |
| `RAC_SSH_KEY` | The private key downloaded when you created the RAC key pair (paste the whole `.pem`) |
| `RAC_SSH_PORT` | Optional, only if SSH isn't on port 22 |

Application secrets (`DJANGO_SECRET_KEY`, `DB_PASSWORD`, etc.) live only in the server's
`.env` file, not in GitHub — the workflow never touches them directly, it just runs
`docker compose`, which reads `.env` on the box.

**Known risk with an IPv6-only host:** GitHub Actions' hosted runners are not guaranteed to
have IPv6 egress, and Cybera RAC's IPv6 block may only be reachable from networks that peer
with it (Canadian research/education networks, some ISPs) rather than the general internet.
If the deploy workflow times out trying to SSH in, that's the likely cause — the fix is
requesting a floating IPv4 via **RAC → Quota Change** and using that as `RAC_HOST` instead.

This all assumes the GitHub repo is public so `git fetch` on the server needs no credentials;
if you make it private, either add a deploy key on the server or switch to a PAT.

## Troubleshooting

- **Port already in use:** something else is bound to 5173/8000/5432 — stop it or change the
  published port in `docker-compose.yml`.
- **Frontend gets 401s:** you need a token first — register via `/api/auth/register/`, then
  sign in through the frontend's `/login` page (or `POST /api/auth/token/` directly).
- **Backend can't reach Postgres locally (non-Docker):** local dev defaults to SQLite; only the
  Docker Compose setup uses Postgres.

See `CONTRIBUTING.md` for how to submit changes.
