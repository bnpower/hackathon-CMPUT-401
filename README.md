# HirePower

HirePower is a full-stack job application tracker for CS-related jobs. The frontend is a React/Tailwind app with a TikTok/Instagram-inspired scrollable job feed, saved/tracked applications, a Harvard-style resume editor, onboarding preferences, and light/dark green/cream/yellow theming. The backend is a Django REST API managed with [`uv`](https://docs.astral.sh/uv/).

## Project layout

```text
.
├── backend/              # Django REST API, uv-managed Python dependencies
├── frontend/             # React + Vite + TailwindCSS app
├── docker-compose.yml    # Postgres + Django/Gunicorn + frontend container
└── requirements.txt      # Legacy/root compatibility file; backend uses uv
```

## Frontend development

```bash
cd frontend
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm test
npm run preview
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000` by default. Set these variables when connecting real backend authentication/SSO:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_SSO_URL=/api/auth/google/
VITE_LINKEDIN_SSO_URL=/api/auth/linkedin/
```

## Backend development

Backend dependencies are installed with `uv`, not `pip`:

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver 127.0.0.1:8000
```

Use `uv run ...` for Django commands so Python sees the packages installed into uv’s virtual environment.

## Docker deployment

The compose stack runs:

- `db`: Postgres 16
- `backend`: Django migrations, static collection, and Gunicorn
- `frontend`: production frontend container

Create a root `.env` file with production secrets and deploy from the repository root:

```bash
cp .env.example .env
# edit .env: set POSTGRES_PASSWORD, DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS, OAuth secrets, etc.
docker compose up --build -d
```

### uv behavior in Docker

The backend image now creates a project virtual environment at `/app/.venv` and puts it on `PATH`. Both the Dockerfile and compose startup command run uv explicitly:

```bash
uv sync --frozen --no-dev
uv run python manage.py migrate --noinput
uv run python manage.py collectstatic --noinput
uv run gunicorn hire_power_backend.wsgi:application --bind 0.0.0.0:8000
```

This prevents `ModuleNotFoundError` issues caused by running plain `python` or `gunicorn` outside uv’s environment.

If backend dependencies or `uv.lock` change, rebuild the backend image:

```bash
docker compose build backend
docker compose up -d backend
```

Or rebuild everything:

```bash
docker compose up --build -d
```

### Demo health checks

This compose stack is configured for a simple local demo over plain HTTP. The backend healthcheck runs through uv:

```bash
uv run python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health/', timeout=5)"
```

`docker-compose.yml` sets `DJANGO_DEBUG=1`, `DJANGO_SECURE_SSL_REDIRECT=0`, and `DJANGO_SECURE_PROXY_SSL_HEADER=0` so the backend does not redirect internal HTTP checks or proxied `/api` requests to HTTPS.

If the backend is marked unhealthy, inspect logs with:

```bash
docker compose logs backend
```

## Backend API summary

| Method     | Path                     | Purpose                                   |
| ---------- | ------------------------ | ----------------------------------------- |
| `GET`      | `/api/health/`           | Health check                              |
| `POST`     | `/api/auth/register/`    | Email/password registration, returns JWTs |
| `POST`     | `/api/auth/login/`       | Email/password login, returns JWTs        |
| `POST`     | `/api/auth/logout/`      | Blacklist refresh token                   |
| `GET`      | `/api/auth/me/`          | Current authenticated user                |
| `POST`     | `/api/auth/google/`      | Exchange Google ID token for app JWTs     |
| `POST`     | `/api/auth/linkedin/`    | Exchange LinkedIn OAuth code for app JWTs |
| `GET/POST` | `/api/applications/`     | Tracked applications                      |
| `GET/POST` | `/api/saved-jobs/`       | Saved jobs                                |
| `GET/POST` | `/api/resumes/`          | Editable resumes                          |
| `GET/POST` | `/api/resume-documents/` | Resume uploads                            |
| `GET/POST` | `/api/communications/`   | Job/application communication notes       |

## Production notes

- Keep `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` explicit. Wildcards are rejected by backend settings.
- `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD` must be strong secrets.
- Uploaded media is stored in the `backend_media` Docker volume.
- Static files are collected into the `backend_static` Docker volume.
- SSO requires valid Google and LinkedIn OAuth credentials in the backend environment.
