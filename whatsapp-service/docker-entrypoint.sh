#!/bin/sh
set -eu

mkdir -p "${WHATSAPP_AUTH_DIR:-/data/auth}"
chown -R node:node "${WHATSAPP_AUTH_DIR:-/data/auth}"
exec su node -s /bin/sh -c "npm start"
