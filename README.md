# Attikid Music

A production-ready web-based music streaming platform built with **Next.js 14** + **Supabase** + plain CSS.

- Dark, minimal UI
- Full audio player (play / pause / seek / volume / next / prev with loop)
- Anti-spam likes system (unique per anonymous session)
- Public comments (HTML-stripped, rate-limited, 250-char)
- Admin dashboard (bcrypt auth + httpOnly signed cookie): upload MP3s, edit / delete songs, moderate comments, analytics
- Search by song title
- Play-count tracking with per-session debounce

---

## Tech

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, JavaScript) |
| Database & Storage | Supabase (Postgres + Storage bucket `songs`) |
| Auth | bcrypt + HMAC-SHA256 signed httpOnly cookies |
| Styling | Plain CSS (no UI framework) |
| Deployment | Vercel |

---

## Folder structure

```
/app
  /api/[[...path]]/route.js   Catch-all API (songs, likes, comments, plays, search, admin)
  /admin/page.js              Admin dashboard
  layout.js                   Root layout (wraps Providers)
  page.js                     Home page
/components
  Sidebar.js  Topbar.js  Hero.js
  SongList.js  LikeButton.js  CommentsSection.js
  PlayerBar.js  Providers.js
/lib
  supabaseClient.js           Browser + admin Supabase client factories
  playerContext.js            Global audio player state
  sessionId.js                Anon session id (localStorage)
  adminAuth.js                Cookie sign/verify
  rateLimit.js                In-memory sliding window + debounce
  sanitize.js                 HTML strip + length enforce for comments
/styles
  globals.css                 Dark theme
/supabase
  schema.sql                  Songs table
  schema_session4.sql         Likes + comments tables
```

---

## Getting started (local)

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Fill in Supabase URL / keys and your bcrypt admin hash.
# IMPORTANT: escape every `$` in ADMIN_PASSWORD_HASH with `\$` in a local .env.

# 3. Create DB tables (one-time, per Supabase project)
#    Paste the contents of /supabase/schema.sql and /supabase/schema_session4.sql
#    into the Supabase SQL editor and run.

# 4. Run
npm run dev
# App:   http://localhost:3000
# Admin: http://localhost:3000/admin   (default creds: admin / attikid)
```

### Generate your own admin hash

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "your-password"
```

Paste the output into `ADMIN_PASSWORD_HASH` (escape `$` with `\$` in local files, **no escaping in Vercel dashboard**).

---

## Deploying on Vercel

1. Push the repo to GitHub.
2. **New Project** → import the repo on Vercel.
3. In **Environment Variables**, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD_HASH` (paste raw hash — no `\$` escaping needed in Vercel)
4. Deploy. No further configuration required.

The project has no `vercel.json`, no custom build step, no hard-coded URLs — a standard Next.js 14 app.

---

## API endpoints

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET  | `/api/songs` | public | All songs |
| GET  | `/api/search?q=` | public | Title ILIKE search |
| POST | `/api/plays` | public | Debounced per (session, song) 30s + capped 60/min |
| GET  | `/api/likes/counts` | public | Aggregate like counts |
| GET  | `/api/likes/session?session_id=` | public | Liked song IDs for this session |
| POST | `/api/likes/toggle` | public | Rate-limited **20 / min / session** |
| GET  | `/api/comments?song_id=` | public | Comments for a song |
| POST | `/api/comments` | public | HTML-stripped, 250-char, **5 / min / session** |
| POST | `/api/admin/login` | public | Rate-limited **10 / min / IP** |
| POST | `/api/admin/logout` | any | Clears cookie |
| GET  | `/api/admin/me` | any | Reports auth state |
| GET/POST | `/api/admin/songs` | **admin** | List / upload MP3 |
| PUT/DELETE | `/api/admin/songs/:id` | **admin** | Edit title / delete + remove object |
| GET  | `/api/admin/comments` | **admin** | Moderation list |
| DELETE | `/api/admin/comments/:id` | **admin** | Remove comment |
| GET  | `/api/admin/analytics` | **admin** | Totals + per-song breakdown |

---

## Security & anti-spam

- All admin routes enforce cookie verification (HMAC-signed, 7-day expiry, `httpOnly`, `Secure`, `SameSite=lax`).
- Every write payload is validated server-side (UUIDs, session id length, body size).
- Comments are HTML-stripped and truncated to 250 chars on the server.
- Rate limits (sliding-window, in-memory):
  - Likes: 20 / min / session
  - Comments: 5 / min / session
  - Plays: per (session, song) debounced 30s, hard cap 60 / min / session
  - Admin login: 10 / min / IP
- Likes are DB-unique on `(song_id, session_id)` — constraint-level anti-spam.

---

## License

MIT.
