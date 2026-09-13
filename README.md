# hackathon-CMPUT-401
CMPT 401 Hackathon repo for the AltaLab team.

## Frontend — Hire Power

A React UI for organizing the job search, with a pink and red palette, responsive desktop sidebar/mobile navigation, and keyboard-accessible dialogs.

```powershell
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://127.0.0.1:8000` for local backend authentication. Add `VITE_GOOGLE_CLIENT_ID` and `VITE_LINKEDIN_CLIENT_ID` when testing SSO provider buttons.

Open the local URL printed by Vite. `npm run build` produces the production bundle; `npm run preview` serves it locally.

### Navigation and features

| Tab | Purpose |
| --- | --- |
| Jobs (home) | Search sample opportunities, filter location/type, save listings, and paginate six results at a time. The Hire Power logo returns home. |
| Applications | Record company, position, date, and stage; organize applications into Applied, Interview, Offer, and Rejection; set follow-up dates. |
| Resumes | Upload original PDF/DOCX resumes (up to 10 MB), download or remove them; separately edit a master plain-text resume and create tailored text copies. |
| Inbox | Manually log company responses, interview invitations, rejections, offers, and communication notes. |

The bell opens follow-up reminders. Application data and text resumes persist in localStorage. Original PDF/DOCX files are stored as blobs in IndexedDB on the current browser; they are not sent to a server or converted into editable text. Files are checked for allowed extension, size, and PDF/DOCX file structure markers. The demo includes fictional sample listings and starter application records; it never submits real applications. Clearing browser storage resets the demo, including uploaded files.

## Backend — Django API

The Django backend lives in `backend/` and uses `uv` instead of `pip`.

```powershell
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver 127.0.0.1:8000
```

Authentication endpoints support email/password JWT auth, Google ID token exchange, and LinkedIn OAuth code exchange. Configure `GOOGLE_CLIENT_ID`, `LINKEDIN_CLIENT_ID`, and `LINKEDIN_CLIENT_SECRET` in the backend environment before using SSO.

## Docker deployment

Create `.env` from `.env.example`, set strong secrets, and deploy both services with:

```powershell
docker compose up --build -d
```

The included frontend Nginx container proxies `/api`, `/admin`, and `/static` to the backend so the browser can use same-origin API calls without broad CORS rules. In production, keep `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` explicit; wildcards are rejected by the settings module.

### Backend integration still needed

Tracked applications, saved jobs, status updates, editable text resumes, uploaded resume documents, and communication notes are available through authenticated API endpoints. Still needed: live job listings with server-side filtering/pagination, server-side document parsing, and scheduled email or push reminders. Current reminders are in-app only. Uploaded documents retain their original format; the editable resume template exports plain text. Communication logging does not synchronize email or automatically change application stages.

Use `frontend/src/main.jsx` for UI behavior, `frontend/src/styles.css` for the base layout, and `frontend/src/personality.css` for the pink/red retro desktop styling with uneven print borders. The home page uses locally hosted reaction images, a compact application summary, and fictional listings. Applications, Resumes, and Inbox also include context-specific meme images. Navigation labels and controls stay plain; jokes live in the images and sample job descriptions. Asset sources are recorded in `frontend/public/memes/SOURCES.md`. No backend dependencies or existing Python files are changed by the UI.
