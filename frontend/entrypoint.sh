#!/bin/sh
set -e

# ==========================================================
# MY-BOOK Frontend Container Entrypoint
# Dynamically configures BACKEND_URL for Nginx reverse proxy
# ==========================================================

TARGET_URL="${BACKEND_URL:-${VITE_API_URL:-}}"

if [ -n "$TARGET_URL" ] && [ "$TARGET_URL" != "/api" ]; then
  # Strip trailing /api, /api/, and trailing slashes
  CLEANED_URL=$(echo "$TARGET_URL" | sed -e 's|/api/*$||' -e 's|/*$||')
  export BACKEND_URL="$CLEANED_URL"
elif [ -n "$RAILWAY_PROJECT_ID" ] && [ -z "$BACKEND_URL" ]; then
  # Automatically use Railway private networking if deployed on Railway
  export BACKEND_URL="http://backend.railway.internal:5000"
else
  # Default fallback for Docker Compose / local runner
  export BACKEND_URL="${BACKEND_URL:-http://backend:5000}"
fi

echo "==> MY-BOOK Frontend starting: Nginx will proxy /api/ to: $BACKEND_URL (PORT: ${PORT:-80})"

exec /docker-entrypoint.sh "$@"
