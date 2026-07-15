# SocialApp — Backend

REST API built with Django REST Framework and PostgreSQL.

**Repo:** https://github.com/harunurrashid97/socialapp

---

## Stack

- **Django 4.2 + DRF** — backend framework
- **PostgreSQL** — main database
- **SimpleJWT** — JWT auth with refresh token support
- **Pillow** — image uploads
- **Cursor-based pagination** — for stable, efficient feed loading

---

## Project Structure

```
backend/
├── socialapp/           # Django project config (settings, urls, wsgi)
├── users/              # register, login, logout, me endpoints
├── posts/              # post CRUD + feed + pagination
├── comments/           # comments + replies + pagination
├── interactions/       # likes for posts, comments, replies + signals
├── notifications/      # notification model + list/mark-read
├── manage.py
├── requirements.txt
└── .env
```

---

## Architecture

<img src="../diagrams/backend_architecture.png" alt="Backend Architecture" width="290"/>

### Auth Flow

<img src="../diagrams/auth_flow.png" alt="Auth Flow" width="500"/>

### Like Counter Flow

<img src="../diagrams/like_counter_flow.png" alt="Like Counter Flow" width="700"/>

---

## Design Decisions

**UUID primary keys** — used UUIDs instead of integers so post IDs can't be guessed or enumerated.

**Denormalized like/comment counters** — storing `like_count` and `comment_count` directly on the model avoids expensive aggregate queries on every feed load. They're updated atomically via Django signals using `F()` expressions so no race conditions.

**Cursor pagination** — offset-based pagination gets slow and stale as data grows. Cursor pagination stays stable and fast regardless of how many records exist.

**Private/public posts** — visibility is checked at the queryset level, not just in the view. Even if someone knows the UUID of a private post, they get a 404.

**JWT with refresh tokens** — access tokens expire in 60 minutes, refresh tokens in 7 days. Frontend auto-refreshes silently.

**One-level replies only** — kept replies at one level deep (comments → replies) to avoid recursive DB queries and keep the UI simple.

**No N+1 queries** — all list views use `select_related` / `prefetch_related`. Comment list also prefetches replies and their authors in one query. Like state is annotated with `Exists` / `Subquery` so the serializer never falls back to per-object queries.

**Generic error messages** — login returns "Invalid email or password" regardless of whether the email exists. Registration catches `IntegrityError` and returns a generic message instead of leaking database constraint details.

**Scoped rate limiting** — mutating endpoints use tighter throttle scopes than read endpoints:
- Login: 5/min
- Registration: 3/hour
- Post create: 20/min, post update/delete: 30/min
- Comment create: 30/min, comment update/delete: 30/min
- Reply create: 30/min, reply update/delete: 30/min
- Like toggles: 60/min

**Input validation** — serializers enforce content length, image type/size, and name sanitization. Frontend validation mirrors these rules for immediate feedback.

---

## Setup

### 1. Clone and create venv

```bash
git clone https://github.com/harunurrashid97/socialapp.git
cd socialapp/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Create PostgreSQL database

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE socialapp_db;
ALTER USER postgres WITH PASSWORD 'yourpassword';
\q
```

### 3. Configure .env

Copy `.env.example` to `.env` and fill in values. At minimum, set a strong `SECRET_KEY` and correct database credentials.

Generate a secret key:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4. Migrate and run

```bash
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

API runs at `http://127.0.0.1:8000`  
Admin panel at `http://127.0.0.1:8000/admin/`

---

## Production Deployment

### Environment Variables

Set these in your hosting platform (Railway, Render, etc.):

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key (keep this safe) |
| `DEBUG` | Yes | Must be `False` in production |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed domains |
| `DATABASE_URL` | Yes* | Full PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | No | Default `60` |
| `REFRESH_TOKEN_LIFETIME_DAYS` | No | Default `7` |

*If `DATABASE_URL` is set, it takes precedence over individual `DATABASE_*` vars.

### Railway

1. Create a new Railway project and add a PostgreSQL plugin.
2. Connect your GitHub repo.
3. In the backend service settings, set the environment variables listed above.
4. Railway auto-detects `railway.json` and deploys using the Dockerfile.

### Docker (self-hosted)

```bash
# Build and run with docker-compose
docker compose up --build

# Or build manually
docker build -t socialapp-backend .
docker run -p 8000:8000 --env-file .env socialapp-backend
```

### Important Production Notes

- **Never** commit `.env` to version control.
- Set `DEBUG=False` in production.
- Use a strong, randomly generated `SECRET_KEY`.
- Ensure `ALLOWED_HOSTS` includes your actual domain.
- `CORS_ALLOWED_ORIGINS` must point to your frontend domain(s) only.
- The Docker entrypoint runs `migrate` and `collectstatic` automatically on startup.

---

## API Endpoints

All requests need `Authorization: Bearer <access_token>` unless marked public.

### Auth — `/api/auth/`

| Method | Endpoint | Public | Notes |
|--------|----------|--------|-------|
| POST | `/register/` | ✓ | Returns tokens + user |
| POST | `/login/` | ✓ | Returns tokens + user |
| POST | `/logout/` | — | Invalidates refresh token |
| GET | `/me/` | — | Current user info |
| PUT | `/me/` | — | Update name |
| POST | `/token/refresh/` | ✓ | Get new access token |

Register body:
```json
{
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "password": "pass123",
  "password_confirm": "pass123"
}
```

Response (login/register):
```json
{ "access": "<jwt>", "refresh": "<jwt>", "user": { "id": "...", "email": "...", "full_name": "Alice Smith" } }
```

---

### Posts — `/api/posts/`

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/` | Feed — public posts + own private posts, newest first, cursor paginated (20/page) |
| POST | `/` | Create post (form-data for image upload). Throttle: 20/min |
| GET | `/mine/` | My posts only, cursor paginated (20/page) |
| GET | `/<id>/` | Single post |
| PUT | `/<id>/` | Edit (author only). Throttle: 30/min |
| DELETE | `/<id>/` | Delete (author only). Throttle: 30/min |

Fields: `content` (required, max 5000 chars), `image` (optional file, max 5MB, images only), `visibility` (`public` or `private`)

---

### Comments — `/api/comments/`

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/posts/<post_id>/` | List comments, cursor paginated (30/page) |
| POST | `/posts/<post_id>/` | Add comment. Throttle: 30/min |
| PUT/DELETE | `/<id>/` | Edit/delete (author only). Throttle: 30/min |
| GET | `/<comment_id>/replies/` | List replies, cursor paginated (30/page) |
| POST | `/<comment_id>/replies/` | Add reply. Throttle: 30/min |
| PUT/DELETE | `/replies/<id>/` | Edit/delete (author only). Throttle: 30/min |

Fields: `content` (required, max 2000 chars)

---

### Likes — `/api/interactions/`

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/posts/<id>/like/` | Toggle like with reaction type. Throttle: 60/min |
| GET | `/posts/<id>/likers/` | Who liked it |
| POST | `/comments/<id>/like/` | Toggle like. Throttle: 60/min |
| GET | `/comments/<id>/likers/` | Who liked it |
| POST | `/replies/<id>/like/` | Toggle like. Throttle: 60/min |
| GET | `/replies/<id>/likers/` | Who liked it |

Like toggle response: `{ "liked": true, "like_count": 5, "reaction_type": "like" }`

---

### Notifications — `/api/notifications/`

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/` | List notifications for current user (max 50, newest first) |
| POST | `/mark-read/` | Mark all notifications as read |
| POST | `/<id>/mark-read/` | Mark single notification as read |

---

## Error Responses

| Status | Meaning | Example |
|--------|---------|---------|
| `400` | Validation failed | `{ "content": ["Post content cannot be blank."] }` |
| `401` | Missing or expired token | `{ "detail": "Given token not valid for any token type" }` |
| `404` | Not found or private resource | `{ "detail": "Not found." }` |
| `429` | Rate limit exceeded | `{ "detail": "Request was throttled." }` |

**Security note:** Auth and visibility errors use generic messages. The API never reveals whether an email exists or whether a private post exists.

---

## Testing with Postman

1. Create environment with `base_url = http://127.0.0.1:8000`
2. After login/register, save tokens in Tests tab:
```javascript
const res = pm.response.json();
pm.environment.set("access_token", res.access);
pm.environment.set("refresh_token", res.refresh);
```
3. Set collection Authorization to `Bearer {{access_token}}`

**Test private visibility:** Register two users, create a private post as user A, try to fetch it as user B — should get `404`.

---

## Common Errors

| Error | Likely cause |
|-------|-------------|
| `401` | Token missing or expired |
| `403` | Editing someone else's post |
| `404` | Private post or wrong UUID |
| `400` | Validation failed — check response body |
| `415` | Sent JSON for image upload — use form-data |
| `429` | Rate limit exceeded — slow down requests |
