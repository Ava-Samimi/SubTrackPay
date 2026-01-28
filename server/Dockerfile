FROM node:20-alpine

WORKDIR /app

# Install dependencies required for Prisma and netcat
RUN apk add --no-cache netcat-openbsd openssl ca-certificates

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies (including dotenv)
RUN npm install  # Make sure this installs everything

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
