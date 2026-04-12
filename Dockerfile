FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=socialapp.settings

WORKDIR /app

RUN python manage.py migrate --noinput || true

EXPOSE 8000

CMD ["gunicorn", "socialapp.wsgi", "--bind", "0.0.0.0:8000"]