# SocialApp — Frontend

Built with Next.js 14 and TypeScript. Connects to the Django REST backend via JWT auth.

**Repo:** https://github.com/harunurrashid97/socialapp

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Axios** — with interceptors for auto token refresh
- **js-cookie** — stores JWT tokens in cookies
- **react-hot-toast** — user feedback notifications
- **timeago.js** — relative timestamps like "2 minutes ago"
- **Bootstrap + Vanilla CSS** — layout and custom styles

---

## Folder Structure

```
frontend/
├── public/assets/images/      # logos, profile images etc.
├── src/
│   ├── app/
│   │   ├── feed/page.tsx      # main feed (protected)
│   │   ├── login/page.tsx     # login page
│   │   ├── register/page.tsx  # register page
│   │   └── layout.tsx         # root layout with AuthProvider
│   ├── components/
│   │   ├── layout/            # Navbar, LeftSidebar, RightSidebar
│   │   ├── posts/             # PostCard, PostCreate, ReactionPicker, LikersModal
│   │   └── comments/          # CommentSection (comments + replies)
│   ├── context/
│   │   └── AuthContext.tsx    # login/logout/register state
│   └── lib/
│       └── api.ts             # all API calls + Axios setup
├── .env.local
└── package.json
```

---

## Getting Started

```bash
git clone https://github.com/harunurrashid97/socialapp.git
cd socialapp/frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run dev server:
```bash
npm run dev
```

App runs at `http://localhost:3000`. Make sure the backend is running first.

---

## Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Import the project in Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your backend production URL.
3. Vercel auto-detects Next.js and deploys.

### Deploy with Docker

```bash
docker build -t socialapp-frontend -f frontend/Dockerfile .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-backend.example.com socialapp-frontend
```

---

## What's implemented

- Register with first name, last name, email, password
- Login / logout with JWT (access + refresh tokens in cookies)
- Auto token refresh on 401 — user stays logged in seamlessly
- Feed page is protected — redirects to login if not authenticated
- Create posts with text and optional image, choose public or private
- Posts sorted newest first
- Like / unlike posts with emoji reactions (like, love, haha, wow, sad, angry)
- Comments and replies with their own like/unlike
- Click likes count to see who liked it (modal)
- Optimistic UI updates for likes

---

## Auth Flow (short version)

1. User logs in → gets `access_token` + `refresh_token`
2. Both stored in cookies
3. Every Axios request attaches the access token as `Bearer`
4. If a request gets `401`, Axios interceptor calls `/token/refresh/` automatically
5. If refresh also fails → redirect to `/login`

---

## Pages

| Route | Auth | Notes |
|---|---|---|
| `/login` | public | email + password |
| `/register` | public | first name, last name, email, password |
| `/feed` | protected | redirects to `/login` if not authenticated |

---

## API modules (`src/lib/api.ts`)

- `authApi` — register, login, logout, me, token refresh
- `postsApi` — list, create, update, delete, detail
- `commentsApi` — list, create, reply
- `interactionsApi` — like/unlike for posts, comments, replies + likers list

---

**Backend README:** [Backend Documentation](../backend/README.md)
