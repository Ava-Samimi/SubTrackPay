FROM node:20-alpine

WORKDIR /app

# Install OS deps:
# - netcat: wait for Postgres
# - openssl/ca-certificates: TLS / Prisma engines
# - python3: run the seeder
# - py3-psycopg2: Postgres driver needed by the seeder (psycopg2)
RUN apk add --no-cache \
  netcat-openbsd \
  openssl \
  ca-certificates \
  python3 \
  py3-psycopg2

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and migrations, and app source
COPY prisma ./prisma
COPY src ./src

# Copy the .env file into the container for dotenv to read
COPY .env .env

# Generate Prisma client at build time (faster startup)
RUN npm run prisma:generate

EXPOSE 3001

# Wait for Postgres to be available before starting the server
CMD sh -c 'until nc -z db 5432; do echo "Waiting for Postgres..."; sleep 1; done; npm run start'
