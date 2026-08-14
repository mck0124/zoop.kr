#!/usr/bin/env bash

# Starts the optional ZOOP Python services used in local development.
# A second run is safe: services whose ports are already occupied are left alone.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
LOG_DIR="$SCRIPT_DIR/logs"
RESTART=false

if [[ "${1:-}" == "--restart" ]]; then
  RESTART=true
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./start_services.sh [--restart]"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.example and add the required API keys first."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

UVICORN_CMD="uvicorn"
if [[ -x "$SCRIPT_DIR/.venv/bin/uvicorn" ]]; then
  UVICORN_CMD="$SCRIPT_DIR/.venv/bin/uvicorn"
fi

mkdir -p "$LOG_DIR"

port_pids() {
  lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

stop_port() {
  local port="$1"
  local pids
  pids="$(port_pids "$port")"
  if [[ -n "$pids" ]]; then
    echo "Stopping the existing local service on port $port ($pids)"
    kill $pids
  fi
}

if [[ "$RESTART" == true ]]; then
  for port in 8100 8101 8102 8103 8104 5103; do
    stop_port "$port"
  done
  sleep 2
fi

start_service() {
  local label="$1"
  local directory="$2"
  local application="$3"
  local port="$4"
  local log_file="$LOG_DIR/$label.log"

  if [[ -n "$(port_pids "$port")" ]]; then
    echo "• $label is already running on http://localhost:$port"
    return
  fi

  echo "Starting $label on http://localhost:$port"
  (
    cd "$directory"
    exec nohup "$UVICORN_CMD" "$application" --host 127.0.0.1 --port "$port"
  ) >"$log_file" 2>&1 &
  echo "  log: $log_file"
}

echo "Starting ZOOP Python services…"
start_service "github-search" "$SCRIPT_DIR/github_search" "main:app" 8100
start_service "chatbot" "$SCRIPT_DIR/chatbot" "chatbot_api:app" 8101
start_service "interview-analysis" "$SCRIPT_DIR/interview_analysis" "interview_analysis_api:app" 8102
start_service "portfolio-matching" "$SCRIPT_DIR/portfolio_matching" "portfolio_matching_api:app" 8103
start_service "interview-questions" "$SCRIPT_DIR/interview_questions" "interview_questions_api:app" 8104
start_service "ocr" "$SCRIPT_DIR/../ocr" "ocr_api:app" 5103

echo
echo "Done. Re-run with --restart to stop and refresh only these local service ports."
