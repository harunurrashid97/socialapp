# SocialApp — Next.js Frontend

[![GitHub](https://img.shields.io/badge/GitHub-harunurrashid97%2Fsocialapp-blue?logo=github)](https://github.com/harunurrashid97/socialapp)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

A social media feed frontend built with **Next.js 14 + React 18**. It connects to the [Django REST backend](../backend/README.md) over HTTP using JWT authentication.

> **GitHub Repository:** https://github.com/harunurrashid97/socialapp

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR / CSR support, file-based routing |
| Language | TypeScript | Type safety, better DX |
| Auth | JWT (cookies via `js-cookie`) | Stateless, auto-refresh via Axios interceptor |
| HTTP Client | Axios | Interceptors for token injection and refresh |
| Notifications | `react-hot-toast` | Lightweight, elegant toast messages |
| Time Formatting | `timeago.js` | Human-readable relative timestamps |
| Styling | Vanilla CSS + Bootstrap | Utility-based layout with full CSS control |

---

## Project Structure

```
frontend/
├── public/
│   └── assets/
│       └── images/          # Static assets (logos, profile pictures, etc.)
├── src/
│   ├── app/
│   │   ├── feed/
│   │   │   └── page.tsx     # Protected feed page (main timeline)
│   │   ├── login/
│   │   │   └── page.tsx     # Login page
│   │   ├── register/
│   │   │   └── page.tsx     # Registration page
│   │   ├── globals.css      # Global styles
│   │   └── layout.tsx       # Root layout (AuthProvider + Toaster)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Top navigation with profile dropdown
│   │   │   ├── LeftSidebar.tsx  # Left sidebar navigation
│   │   │   └── RightSidebar.tsx # Right sidebar (suggestions, etc.)
│   │   ├── posts/
│   │   │   ├── PostCard.tsx     # Single post with likes, comments toggle
│   │   │   ├── PostCreate.tsx   # Post creation form (text + image + visibility)
│   │   │   ├── ReactionPicker.tsx # Emoji reaction picker (Like/Love/Haha/etc.)
│   │   │   ├── LikersModal.tsx  # Modal listing users who liked a post/comment/reply
│   │   │   └── Stories.tsx      # Stories bar component
│   │   └── comments/
│   │       └── CommentSection.tsx  # Comments, replies, and their like/unlike system
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state, login, register, logout
│   └── lib/
│       └── api.ts            # Axios instance with JWT interceptors + all API calls
├── .env.local                # Environment variables (not committed)
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Features

- **JWT Authentication** — Login, Register, auto token refresh, logout with cookie storage
- **Protected Routes** — Feed is accessible only to authenticated users
- **Post Feed** — Displays all public posts + author's own private posts, newest first
- **Create Posts** — Text + optional image upload, with Public/Private visibility selector
- **Reactions** — Like/Love/Haha/Wow/Sad/Angry with animated emoji reaction picker
- **Comments** — Post comments with real-time optimistic UI updates
- **Replies** — Reply to individual comments (1 level deep)
- **Like/Unlike** — Like state displayed correctly for posts, comments, and replies
- **Likers Modal** — See who liked a post, comment, or reply
- **Infinite Scroll** — Cursor-based pagination for the feed with "Load More" button
- **Toast Notifications** — Feedback for every user action (post, comment, error, etc.)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/harunurrashid97/socialapp.git
cd socialapp/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> Make sure the backend is running at this address before starting the frontend.

### 4. Run the development server

```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 5. Build for production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the Django backend API | `http://127.0.0.1:8000` |

---

## Authentication Flow

```
User Registration / Login
         │
         ▼
   POST /api/auth/register/ or /api/auth/login/
         │
         ▼
   Store access_token + refresh_token in cookies (js-cookie)
         │
         ▼
   AuthContext holds user state (first_name, last_name, email)
         │
         ▼
   Axios interceptors attach Bearer token to every request
         │
         ▼
   On 401 → auto-refresh token → retry original request
         │
         ▼
   On refresh failure → redirect to /login
```

---

## Key Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Login with email + password |
| `/register` | Public | Sign up with first name, last name, email + password |
| `/feed` | Protected | Main timeline (redirects to `/login` if not authenticated) |

---

## API Integration

All API calls are centralized in `src/lib/api.ts`:

| Module | Endpoints |
|---|---|
| `authApi` | register, login, logout, me, token/refresh |
| `postsApi` | list (feed), create, detail, update, delete |
| `commentsApi` | list, create, delete, replies, createReply |
| `interactionsApi` | likePost, postLikers, likeComment, commentLikers, likeReply, replyLikers |

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 14.x | Core framework |
| `react` / `react-dom` | 18.x | UI library |
| `axios` | 1.x | HTTP client |
| `js-cookie` | 3.x | Cookie management for JWT tokens |
| `react-hot-toast` | 2.x | Toast notifications |
| `timeago.js` | 4.x | Human-readable timestamps |

---

## Related

- [Backend README](../backend/README.md) — Django REST API documentation
- [Full Documentation](../DOCUMENTATION.md) — Architecture diagrams and design decisions
- [GitHub Repository](https://github.com/harunurrashid97/socialapp)
