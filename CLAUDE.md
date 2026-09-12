# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Job application manager for the AltaLab team's CMPT 401 Hackathon project (see README.md and requirements.md).
Backend and frontend scaffolds are in place; features beyond the initial CRUD/auth scaffold are still being built.

## Architecture

- `backend/` — Django + Django REST Framework API.
  - `config/` — project settings/urls (settings read from `.env` via `python-decouple`).
  - `accounts/` — registration + JWT auth (`djangorestframework-simplejwt`) endpoints.
  - `applications/` — `Application`, `ApplicationStatusHistory`, `Reminder` models/API. Updating an
    application's `stage` via the API auto-appends a status history entry (see `applications/serializers.py`).
  - `resumes/` — `Resume` model/API. One resume per user may have `is_master=True`
    (enforced by a DB constraint); tailored resumes reference `based_on` (source resume)
    and optionally `application`.
  - `communications/` — `Communication` model/API for logging responses/contact with employers,
    scoped to the owning user's applications.
  - All API querysets are scoped to `request.user`; there is no cross-user data access.
- `frontend/` — React app scaffolded with Vite (JS, not TS). `src/api/client.js` is an axios
  instance that attaches the JWT from `localStorage` and reads `VITE_API_URL`.
- `docker-compose.yml` — `db` (Postgres), `backend`, `frontend` services for local dev.
- `docker-compose.prod.yml` / `frontend/Dockerfile.prod` — production build: Gunicorn +
  Whitenoise for the backend, an nginx-served static build for the frontend. Deployed to
  Cybera RAC by `.github/workflows/deploy.yml` on push to `main` (see README's
  "Deploying to Cybera RAC" section for required secrets and server setup).

## Commands

### Backend (`backend/`)

```bash
python manage.py runserver              # dev server
python manage.py migrate                # apply migrations
python manage.py makemigrations         # after model changes
python manage.py test                   # run all tests
python manage.py test applications      # run a single app's tests
python manage.py check                  # system check
python manage.py seed_demo_data         # load demo user + sample data (--reset to wipe/reseed)
```

Activate the venv first (`.venv/Scripts/activate` on Windows, `source .venv/bin/activate`
elsewhere) or prefix commands with `.venv/Scripts/python.exe` / `.venv/bin/python`.

### Frontend (`frontend/`)

```bash
npm run dev       # dev server (Vite)
npm run build     # production build
npm run lint      # oxlint
```

### Docker

```bash
docker compose up --build   # runs db + backend + frontend together
```

## Notes for future changes

- New Django apps must be added to `INSTALLED_APPS` in `backend/config/settings.py` and
  wired into `backend/config/urls.py`.
- Model changes require a new migration (`makemigrations`) committed alongside the code change.
- `requirements.md` is the original feature brief — check it before changing model shape
  (application stages, resume master/tailored relationship, communication tracking) since it
  reflects the hackathon's grading criteria.
