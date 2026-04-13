FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
  netcat-openbsd \
  openssl \
  ca-certificates \
  python3 \
  py3-pip \
  py3-psycopg2 \
  build-base \
  musl-dev \
  linux-headers \
  freetype-dev \
  libpng-dev \
  jpeg-dev

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/seeder

COPY package*.json ./
RUN npm install

COPY seeder/requirements.txt /app/seeder/requirements.txt

RUN python3 -m pip install --break-system-packages --no-cache-dir --upgrade pip setuptools wheel
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /app/seeder/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir matplotlib pillow pandas numpy psycopg2-binary

COPY prisma ./prisma
COPY src ./src
COPY seeder ./seeder

RUN mkdir -p /app/client/public/snapshots

COPY .env .env

RUN npm run prisma:generate

EXPOSE 3001

CMD sh -c 'until nc -z db 5432; do echo "Waiting for Postgres..."; sleep 1; done; npm run start'
