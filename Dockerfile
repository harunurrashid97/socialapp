FROM python:3.11-slim

RUN apt-get update && apt-get install -y postgresql-client procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=socialapp.settings

WORKDIR /app

RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "=== DB ENV VARS ==="' >> /app/start.sh && \
    echo 'env | grep -E "(DATABASE|POSTGRES|PGHOST)" || echo "No DB vars found"' >> /app/start.sh && \
    echo 'python manage.py migrate --noinput' >> /app/start.sh && \
    echo 'python -c "import django; django.setup(); from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='"'"'admin'"'"').exists() or User.objects.create_superuser('"'"'admin'"'"', '"'"'admin@example.com'"'"', '"'"'admin123'"'"')"' >> /app/start.sh && \
    echo 'exec gunicorn socialapp.wsgi --bind 0.0.0.0:$PORT' >> /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]