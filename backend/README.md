# HirePower Backend

Django REST API for the HirePower job application tracker. Python dependencies are managed with [`uv`](https://docs.astral.sh/uv/), not `pip`.

## Local setup

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver 127.0.0.1:8000
```

Always run Django commands with `uv run ...`; otherwise Python may not see packages installed in uv’s virtual environment.

Copy `.env.example` values into your shell environment or platform secrets before using production mode or SSO.

## Docker deployment

From the repository root:

```bash
cp .env.example .env
# edit .env and set strong secrets/hostnames
docker compose up --build -d
```

The Compose stack runs Postgres, the Django/Gunicorn API, and the production frontend. The frontend container proxies `/api`, `/admin`, and `/static` to Django, so deployed browser requests can use same-origin API calls without permissive CORS.

### uv in the container

The backend image uses uv’s project virtual environment at `/app/.venv`:

```dockerfile
ENV UV_PROJECT_ENVIRONMENT=/app/.venv
ENV PATH="/app/.venv/bin:/root/.local/bin:${PATH}"
```

The image build installs locked production dependencies with:

```bash
uv sync --frozen --no-dev --no-install-project
uv sync --frozen --no-dev
```

The compose startup command also runs uv before starting Django:

```bash
uv sync --frozen --no-dev
uv run python manage.py migrate --noinput
uv run python manage.py collectstatic --noinput
uv run gunicorn hire_power_backend.wsgi:application --bind 0.0.0.0:8000
```

This is intentional. It prevents `ModuleNotFoundError` errors caused by launching plain `python`/`gunicorn` outside uv’s environment and ensures the container matches `uv.lock`.

After changing `pyproject.toml` or `uv.lock`, rebuild the backend image:

```bash
docker compose build backend
docker compose up -d backend
```

To rebuild the full stack:

```bash
docker compose up --build -d
```

The root `docker-compose.yml` is intentionally configured for a simple local demo over plain HTTP. It sets `DJANGO_DEBUG=1`, `DJANGO_SECURE_SSL_REDIRECT=0`, and `DJANGO_SECURE_PROXY_SSL_HEADER=0`, and the backend healthcheck uses plain `http://127.0.0.1:8000/api/health/` through `uv run python`.

Check backend logs with:

```bash
docker compose logs backend
```

## Production security settings

Security-sensitive settings are intentionally strict when `DJANGO_DEBUG=0`:

- `DJANGO_SECRET_KEY` is required.
- `DJANGO_ALLOWED_HOSTS` is required and cannot contain `*`.
- `CORS_ALLOWED_ORIGINS` cannot contain `*`.
- CSRF trusted origins must be explicit if cross-origin admin/session forms are used.
- Secure cookies, `X-Frame-Options: DENY`, content sniffing protection, and HSTS are enabled by default for production.

## API

| Method         | Path                                   | Purpose                                            |
| -------------- | -------------------------------------- | -------------------------------------------------- |
| `GET`          | `/api/health/`                         | Health check                                       |
| `POST`         | `/api/auth/register/`                  | Create an email/password account and return JWTs   |
| `POST`         | `/api/auth/login/`                     | Login with email/password and return JWTs          |
| `POST`         | `/api/auth/logout/`                    | Blacklist a refresh token                          |
| `GET`          | `/api/auth/me/`                        | Return the authenticated user                      |
| `POST`         | `/api/auth/google/`                    | Exchange a Google ID token for app JWTs            |
| `POST`         | `/api/auth/linkedin/`                  | Exchange a LinkedIn OAuth code for app JWTs        |
| `GET/POST`     | `/api/applications/`                   | List/create tracked applications                   |
| `PATCH/DELETE` | `/api/applications/{id}/`              | Update status, follow-up, or remove an application |
| `GET/POST`     | `/api/saved-jobs/`                     | List/save job cards for the current user           |
| `DELETE`       | `/api/saved-jobs/by-job/{job_id}/`     | Unsave a frontend job listing                      |
| `GET/POST`     | `/api/resumes/`                        | List/create editable text resumes                  |
| `PATCH/DELETE` | `/api/resumes/{id}/`                   | Update or remove a text resume                     |
| `GET/POST`     | `/api/resume-documents/`               | List/upload PDF, DOCX, PNG, or JPEG resume files   |
| `GET`          | `/api/resume-documents/{id}/download/` | Download an uploaded resume document               |
| `GET/POST`     | `/api/communications/`                 | List/create inbox communication notes              |

Resume document uploads are stored under `backend/media/` in development and in the `backend_media` Docker volume in deployment.

## Frontend OAuth variables

The React app expects these Vite variables when using provider buttons:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_SSO_URL=/api/auth/google/
VITE_LINKEDIN_SSO_URL=/api/auth/linkedin/
```

For LinkedIn, configure the redirect URL in the LinkedIn app to the frontend origin/path you serve locally, for example `http://127.0.0.1:5173/`.
