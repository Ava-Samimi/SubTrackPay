#!/bin/sh
set -e

echo "Waiting for Postgres..."
until nc -z db 5432; do
  sleep 1
done

echo "Generating Prisma client..."
npm run prisma:generate

echo "Applying migrations..."
npm run prisma:migrate:deploy

echo "Starting API..."
npm run start
