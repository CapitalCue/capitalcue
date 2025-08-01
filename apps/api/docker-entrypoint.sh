#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z ${DATABASE_HOST:-localhost} ${DATABASE_PORT:-5432}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready - executing command"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
exec "$@"