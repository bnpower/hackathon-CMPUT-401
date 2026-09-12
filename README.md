# hackathon-CMPUT-401
CMPT 401 Hackathon repo for the AltaLab team.

## Frontend — Hire Power

A React UI for organizing the job search, with a pink and red palette, responsive desktop sidebar/mobile navigation, and keyboard-accessible dialogs.

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` produces the production bundle; `npm run preview` serves it locally.

### Navigation and features

| Tab | Purpose |
| --- | --- |
| Jobs (home) | Search sample opportunities, filter location/type, save listings, and paginate six results at a time. The Hire Power logo returns home. |
| Applications | Record company, position, date, and stage; organize applications into Applied, Interview, Offer, and Rejection; set follow-up dates. |
| Resumes | Upload original PDF/DOCX resumes (up to 10 MB), download or remove them; separately edit a master plain-text resume and create tailored text copies. |
| Inbox | Manually log company responses, interview invitations, rejections, offers, and communication notes. |

The bell opens follow-up reminders. Application data and text resumes persist in localStorage. Original PDF/DOCX files are stored as blobs in IndexedDB on the current browser; they are not sent to a server or converted into editable text. Files are checked for allowed extension, size, and PDF/DOCX file structure markers. The demo includes fictional sample listings and starter application records; it never submits real applications. Clearing browser storage resets the demo, including uploaded files.

### Backend integration still needed

The repository currently specifies Django/DRF dependencies but has no API implementation. Connect authentication and per-user storage, live job listings with server-side filtering/pagination, application/resume/communication endpoints, server-side document storage and parsing, and scheduled email or push reminders. Current reminders are in-app only. Uploaded documents retain their original format; the editable resume template exports plain text. Communication logging does not synchronize email or automatically change application stages.

Use `frontend/src/main.jsx` for UI behavior, `frontend/src/styles.css` for the base layout, and `frontend/src/personality.css` for the pink/red retro desktop styling with uneven print borders. The home page uses locally hosted reaction images, a compact application summary, and fictional listings. Applications, Resumes, and Inbox also include context-specific meme images. Navigation labels and controls stay plain; jokes live in the images and sample job descriptions. Asset sources are recorded in `frontend/public/memes/SOURCES.md`. No backend dependencies or existing Python files are changed by the UI.
