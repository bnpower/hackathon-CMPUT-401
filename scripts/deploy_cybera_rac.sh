#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$APP_ROOT/backend"
VENV_DIR="$BACKEND_DIR/.venv"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [[ -f "$APP_ROOT/.env.deploy" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_ROOT/.env.deploy"
  set +a
fi

"$PYTHON_BIN" -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

python "$BACKEND_DIR/manage.py" migrate --noinput
python "$BACKEND_DIR/manage.py" collectstatic --noinput

if [[ -n "${CYBERA_FRONTEND_PUBLIC_DIR:-}" ]]; then
  mkdir -p "$CYBERA_FRONTEND_PUBLIC_DIR"
  rsync -a --delete "$APP_ROOT/frontend/dist/" "$CYBERA_FRONTEND_PUBLIC_DIR/"
fi

if [[ -n "${CYBERA_APP_RESTART_CMD:-}" ]]; then
  eval "$CYBERA_APP_RESTART_CMD"
else
  echo "Deployment synced successfully."
  echo "Set CYBERA_APP_RESTART_CMD in .env.deploy to restart your RAC service automatically."
fi
