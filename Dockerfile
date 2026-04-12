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
    echo 'python manage.py shell -c "from apps.users.models import User; u, c = User.objects.get_or_create(email='"'"'admin@example.com'"'"', defaults={'"'"'first_name'"'"': '"'"'Admin'"'"', '"'"'last_name'"'"': '"'"'Admin'"'"'}); u.set_password('"'"'admin123'"'"'); u.is_staff=True; u.is_superuser=True; u.save()"' >> /app/start.sh && \
    echo 'exec gunicorn socialapp.wsgi --bind 0.0.0.0:$PORT' >> /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]