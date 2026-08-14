#!/usr/bin/env bash

# One-command local ZOOP launcher: Oracle (Docker) + Python AI + Spring + React.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/local-logs"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

if ! docker ps --format '{{.Names}}' | grep -qx 'zoop-oracle'; then
  echo "Oracle container 'zoop-oracle' is not running. Start Docker Desktop, then run: docker start zoop-oracle"
  exit 1
fi

if ! docker exec zoop-oracle healthcheck.sh >/dev/null 2>&1; then
  echo "Oracle is still initializing. Wait for 'DATABASE IS READY TO USE!' in: docker logs -f zoop-oracle"
  exit 1
fi

read -r -s -p "Oracle password for local user 'zoop': " DATABASE_PASSWORD
echo
export DATABASE_PASSWORD

mkdir -p "$LOG_DIR"

echo "Starting Python AI services…"
"$ROOT_DIR/backend/python-api/start_services.sh" --restart >"$LOG_DIR/python-launcher.log" 2>&1

echo "Starting Spring backend (http://localhost:8080)…"
(
  cd "$ROOT_DIR/backend"
  exec ./start-local.sh
) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Starting React frontend (http://localhost:3000)…"
(
  cd "$ROOT_DIR/frontend"
  exec npm start
) >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo
echo "ZOOP is starting. Logs:"
echo "  Frontend: $LOG_DIR/frontend.log"
echo "  Backend:  $LOG_DIR/backend.log"
echo "  Python:   $LOG_DIR/python-launcher.log"
echo "Press Ctrl+C to stop React and Spring. Python services can be refreshed with backend/python-api/start_services.sh --restart."

wait "$BACKEND_PID" "$FRONTEND_PID"
