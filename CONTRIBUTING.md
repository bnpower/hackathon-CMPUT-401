# Contributing

Thanks for helping out on the AltaLab job application manager. This is a
hackathon project, so keep things simple and moving — but a few conventions
keep us from stepping on each other.

## Branching

- `main` is the stable/demo branch.
- `develop` is the integration branch — branch off it, and target it with your PR.
- Use a short descriptive branch name with a type prefix, e.g.:
  - `feature/resume-tailoring`
  - `fix/reminder-timezone`
  - `chore/update-deps`

```bash
git checkout develop
git pull
git checkout -b feature/your-branch-name
```

## Making changes

1. Keep PRs focused — one feature or fix per PR.
2. If you change a Django model, generate and commit the migration:
   ```bash
   cd backend
   python manage.py makemigrations
   ```
3. If you add a new Django app, register it in `backend/config/settings.py`
   (`INSTALLED_APPS`) and wire its urls into `backend/config/urls.py`.
4. Run the checks below before opening a PR.

## Before you push

**Backend:**

```bash
cd backend
python manage.py check
python manage.py test
```

**Frontend:**

```bash
cd frontend
npm run lint
npm run build
```

## Commit messages

Write a short, imperative summary line (e.g. `Add reminder due-date validation`,
not `Added` or `Adding`). Add a body if the "why" isn't obvious from the diff.

## Pull requests

- Target `develop`, not `main`.
- Describe what changed and why, and call out anything that needs a `.env` change,
  a new dependency, or a migration.
- Link the relevant task/issue if there is one.
- Make sure `docker compose up --build` still works if you touched `docker-compose.yml`,
  a `Dockerfile`, or dependency files.

## Code style

- **Backend:** follow existing patterns — DRF `ModelViewSet` + `ModelSerializer` per
  resource, querysets scoped to `request.user`, choices via `models.TextChoices`.
- **Frontend:** functional components + hooks, API calls go through `src/api/client.js`
  (don't call `fetch`/`axios` directly from components).
- Don't add dependencies for something a few lines of code can do.

## Secrets

Never commit `.env` files or real credentials — copy `.env.example` to `.env` locally
and keep secrets out of git entirely.
