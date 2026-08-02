#!/usr/bin/env sh
set -eu

cd /opt/vperts/app

git fetch origin main
git checkout main
git pull --ff-only origin main

docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml up -d --build --remove-orphans

docker compose -f compose.production.yml ps

backend_id="$(docker compose -f compose.production.yml ps -q backend)"
frontend_id="$(docker compose -f compose.production.yml ps -q frontend)"

test -n "$backend_id"
test -n "$frontend_id"
test "$(docker inspect -f '{{.State.Health.Status}}' "$backend_id")" = "healthy"
test "$(docker inspect -f '{{.State.Status}}' "$frontend_id")" = "running"

echo "Production deploy completed successfully."
