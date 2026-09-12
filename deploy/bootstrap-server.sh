#!/usr/bin/env bash
# One-time setup for a fresh Cybera RAC instance (Ubuntu 22.04).
# Run this once on the VM itself (over SSH), not in CI.
#
#   ssh ubuntu@<floating-ip>
#   curl -fsSL https://raw.githubusercontent.com/<org>/<repo>/main/deploy/bootstrap-server.sh | bash
#
# or copy the repo over first and run it locally on the box.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/bnpower/hackathon-CMPUT-401.git}"
APP_DIR="${APP_DIR:-/opt/hackathon-cmput-401}"

echo "==> Installing Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

echo "==> Cloning repo to $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.prod.example .env
  echo
  echo "==> Created $APP_DIR/.env from .env.prod.example."
  echo "    Edit it now with real secrets before the first deploy:"
  echo "      nano $APP_DIR/.env"
fi

echo
echo "==> Done. Next steps:"
echo "  1. Edit $APP_DIR/.env with real secrets (DJANGO_SECRET_KEY, DB_PASSWORD, ALLOWED_HOSTS, VITE_API_URL)."
echo "  2. Make sure the RAC security group allows inbound TCP 22, 80, and 8000."
echo "  3. First deploy manually to confirm it works:"
echo "       cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d --build"
echo "  4. Add the GitHub Actions secrets (RAC_HOST, RAC_USERNAME, RAC_SSH_KEY) so CI can redeploy automatically."
