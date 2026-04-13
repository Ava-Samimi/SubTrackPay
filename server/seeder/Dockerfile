FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/seeder

COPY requirements.txt /app/requirements.txt
COPY seeder/requirements.txt /app/seeder_extra_requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt -r /app/seeder_extra_requirements.txt

COPY seed_db.py /app/seed_db.py
COPY seeder /app/seeder

RUN mkdir -p /app/client/public/snapshots

CMD ["python", "/app/seed_db.py"]
