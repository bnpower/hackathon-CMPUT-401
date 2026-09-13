# Hire Power Backend

Django REST API for the Hire Power frontend. Dependencies are managed with [`uv`](https://docs.astral.sh/uv/), not `pip`.

## Setup

```powershell
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver 127.0.0.1:8000
```

Copy `.env.example` to your shell environment or platform secrets and set OAuth credentials before using SSO.

## Docker deployment

From the repository root:

```powershell
copy .env.example .env
# edit .env and set strong secrets/hostnames
docker compose up --build -d
```

The Compose stack runs Postgres, the Django/Gunicorn API, and an Nginx-served frontend. Nginx proxies `/api`, `/admin`, and `/static` to Django, so the deployed browser app can use same-origin requests and does not require permissive CORS.

Security-sensitive settings are intentionally strict when `DJANGO_DEBUG=0`:

- `DJANGO_SECRET_KEY` is required.
- `DJANGO_ALLOWED_HOSTS` is required and cannot contain `*`.
- `CORS_ALLOWED_ORIGINS` cannot contain `*`.
- CSRF trusted origins must be explicit if cross-origin admin/session forms are used.
- Secure cookies, `X-Frame-Options: DENY`, content sniffing protection, and HSTS are enabled by default for production.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/` | Health check |
| `POST` | `/api/auth/register/` | Create an email/password account and return JWTs |
| `POST` | `/api/auth/login/` | Login with email/password and return JWTs |
| `POST` | `/api/auth/logout/` | Blacklist a refresh token |
| `GET` | `/api/auth/me/` | Return the authenticated user |
| `POST` | `/api/auth/google/` | Exchange a Google ID token for app JWTs |
| `POST` | `/api/auth/linkedin/` | Exchange a LinkedIn OAuth code for app JWTs |
| `GET/POST` | `/api/applications/` | List/create tracked applications |
| `PATCH/DELETE` | `/api/applications/{id}/` | Update status, follow-up, or remove an application |
| `GET/POST` | `/api/saved-jobs/` | List/save job cards for the current user |
| `DELETE` | `/api/saved-jobs/by-job/{job_id}/` | Unsave a frontend job listing |
| `GET/POST` | `/api/resumes/` | List/create editable text resumes |
| `PATCH/DELETE` | `/api/resumes/{id}/` | Update or remove a text resume |
| `GET/POST` | `/api/resume-documents/` | List/upload PDF or DOCX resume files |
| `GET` | `/api/resume-documents/{id}/download/` | Download an uploaded resume document |
| `GET/POST` | `/api/communications/` | List/create inbox communication notes |

Resume document uploads are stored under `backend/media/` in development and are ignored by git.

## Frontend OAuth variables

The React app expects these Vite variables when using provider buttons:

```powershell
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_LINKEDIN_CLIENT_ID=your-linkedin-client-id
```

For LinkedIn, configure the redirect URL in the LinkedIn app to the frontend origin/path you serve locally, for example `http://127.0.0.1:5173/`.
