#!/usr/bin/env bash

# Starts the local Spring API against the Docker Oracle instance.
# Database passwords are never written to the repository or shell history.
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

read -r -s -p "Oracle password for local user 'zoop': " DATABASE_PASSWORD
echo

export SPRING_PROFILES_ACTIVE=prod
export DATABASE_URL="${DATABASE_URL:-jdbc:oracle:thin:@localhost:1521/XEPDB1}"
export DATABASE_USERNAME="${DATABASE_USERNAME:-zoop}"
export DATABASE_PASSWORD
export JWT_SECRET="${JWT_SECRET:-local-development-jwt-secret-change-this-before-production-2026}"
export ZOOP_INTERNAL_API_KEY="${ZOOP_INTERNAL_API_KEY:-local-internal-api-key}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# The optional integrations are disabled locally unless credentials are supplied.
export PYTHON_GITHUB_API_URL="${PYTHON_GITHUB_API_URL:-http://localhost:8000}"
export PYTHON_CHATBOT_API_URL="${PYTHON_CHATBOT_API_URL:-http://localhost:8001}"
export PYTHON_INTERVIEW_API_URL="${PYTHON_INTERVIEW_API_URL:-http://localhost:8002}"
export PYTHON_QUESTIONS_API_URL="${PYTHON_QUESTIONS_API_URL:-http://localhost:8004}"
export PYTHON_MATCHING_API_URL="${PYTHON_MATCHING_API_URL:-http://localhost:8003}"
export MAIL_USERNAME="${MAIL_USERNAME:-}"
export MAIL_PASSWORD="${MAIL_PASSWORD:-}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
export GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-http://localhost:3000/google-auth}"
export GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-}"
export GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-}"
export GITHUB_REDIRECT_URI="${GITHUB_REDIRECT_URI:-http://localhost:3000/github-auth}"
export AWS_ACCESS_KEY="${AWS_ACCESS_KEY:-}"
export AWS_SECRET_KEY="${AWS_SECRET_KEY:-}"
export AWS_S3_BUCKET="${AWS_S3_BUCKET:-}"

exec ./mvnw spring-boot:run
