#!/bin/sh
set -e

echo "Starting uvicorn server..."
exec uvicorn app.main:app \
    --host "${APP_HOST:-0.0.0.0}" \
    --port "${APP_PORT:-8000}" \
    --workers 1
