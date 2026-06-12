#!/bin/sh
set -e

echo "Applying database migrations..."
if npx prisma migrate deploy; then
  echo "Migrations applied successfully."
else
  echo "Migrate deploy failed — syncing schema (existing database)..."
  npx prisma db push --skip-generate
  npx prisma migrate resolve --applied 20250610000000_init 2>/dev/null || true
fi

if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding catalog and admin (if configured)..."
  npx prisma db seed || echo "Seed step finished with warnings"
fi

echo "Starting API on port ${PORT:-4000}..."
exec node dist/src/main
