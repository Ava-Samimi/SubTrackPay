FROM node:20-alpine

WORKDIR /app

# Needed for:
# - waiting for Postgres: nc -z db 5432
# - docker-compose healthcheck: nc -z localhost 3001
RUN apk add --no-cache netcat-openbsd

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema + migrations, then app source
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client at build time (fast startup)
RUN npm run prisma:generate

EXPOSE 3001

# On container start:
# 1) wait for Postgres (service name "db")
# 2) apply migrations (deploy)
# 3) start API
# Start API only (migrations handled by "migrate" service)
CMD sh -c 'until nc -z db 5432; do echo "Waiting for Postgres..."; sleep 1; done; npm run start'

