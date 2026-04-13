#!/bin/sh
set -e
echo "=== Checking node_modules ==="
if [ ! -d /app/node_modules ] || [ ! -f /app/node_modules/.bin/vite ]; then
  echo "node_modules missing or incomplete - running npm ci..."
  cd /app && npm ci
else
  echo "node_modules OK"
fi
echo "=== Starting Vite ==="
exec "$@"
