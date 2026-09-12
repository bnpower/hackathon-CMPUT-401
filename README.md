# hackathon-CMPUT-401

CMPT 401 Hackathon repo for the AltaLab team.

## Scaffold overview

This repository now includes:

- a Django backend in `/backend`
- a React + Vite frontend in `/frontend`
- a GitHub Actions workflow in `/.github/workflows/ci-cd.yml`
- a Cybera RAC deployment script in `/scripts/deploy_cybera_rac.sh`

## Local development

### Backend

```bash
cd /home/runner/work/hackathon-CMPUT-401/hackathon-CMPUT-401/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend health endpoint is available at `http://127.0.0.1:8000/api/health/`.

### Frontend

```bash
cd /home/runner/work/hackathon-CMPUT-401/hackathon-CMPUT-401/frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to the Django backend on port `8000`.

If you need a different API origin, copy `frontend/.env.example` to `.env` and set
`VITE_API_BASE_URL`.

## CI/CD for Cybera RAC

The GitHub Actions workflow:

- runs Django tests and `manage.py check`
- builds and lints the React frontend
- on pushes to `main`, syncs the repository to Cybera RAC over SSH and runs the
  deployment script

Configure these GitHub secrets before enabling deployment:

- `CYBERA_HOST`
- `CYBERA_PORT` (optional, defaults to `22`)
- `CYBERA_USER`
- `CYBERA_SSH_KEY`
- `CYBERA_TARGET_DIR`

On the RAC host, you can optionally create
`/path/to/your/app/.env.deploy` with deployment-specific values such as:

```bash
DJANGO_SECRET_KEY=replace-this-in-production
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-rac-hostname
CYBERA_FRONTEND_PUBLIC_DIR=/var/www/hackathon-CMPUT-401
CYBERA_APP_RESTART_CMD=systemctl --user restart hackathon-cmput-401
```

The deployment script will:

1. create/update a Python virtual environment
2. install backend dependencies
3. run database migrations
4. collect static files
5. optionally publish the frontend bundle and restart your RAC-managed app
