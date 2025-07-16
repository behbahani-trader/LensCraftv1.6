#!/usr/bin/env bash
# setup.sh - install dependencies and configure the backend server
set -e

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Please install Node.js and rerun this script." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Please install npm and rerun this script." >&2
  exit 1
fi

echo "Installing node dependencies..."
npm install

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  cp .env.example "$ENV_FILE"
fi

# read current values
CURRENT_PORT=$(grep '^PORT=' "$ENV_FILE" | cut -d '=' -f2)
CURRENT_DB=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | sed 's/^"//;s/"$//')
CURRENT_SECRET=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d '=' -f2- | sed 's/^"//;s/"$//')

read -p "Server port [${CURRENT_PORT}]: " PORT_INPUT
read -p "Database URL [${CURRENT_DB}]: " DB_INPUT
read -p "JWT Secret [${CURRENT_SECRET}]: " SECRET_INPUT

PORT=${PORT_INPUT:-$CURRENT_PORT}
DATABASE_URL=${DB_INPUT:-$CURRENT_DB}
JWT_SECRET=${SECRET_INPUT:-$CURRENT_SECRET}

ESCAPED_DB=$(printf '%s' "$DATABASE_URL" | sed -e 's/[\/&]/\\&/g')
ESCAPED_SECRET=$(printf '%s' "$JWT_SECRET" | sed -e 's/[\/&]/\\&/g')

sed -i "s/^PORT=.*/PORT=${PORT}/" "$ENV_FILE"
sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"${ESCAPED_DB}\"#" "$ENV_FILE"
sed -i "s#^JWT_SECRET=.*#JWT_SECRET=\"${ESCAPED_SECRET}\"#" "$ENV_FILE"

echo "Running Prisma migrations..."
if npx prisma migrate deploy >/dev/null 2>&1; then
  echo "Migrations applied."
else
  echo "No migrations found; running prisma db push."
  npx prisma db push
fi

npx prisma generate

echo "Building the server..."
npm run build

echo "Setup complete. Start the server with:\n  npm start"
