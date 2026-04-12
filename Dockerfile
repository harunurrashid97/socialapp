FROM python:3.11-slim

RUN apt-get update && apt-get install -y postgresql-client procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=socialapp.settings

WORKDIR /app

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn socialapp.wsgi --bind 0.0.0.0:8000"]