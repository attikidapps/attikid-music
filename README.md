# Attikid Music

A web-based music streaming platform built with **Next.js** + **Supabase**, designed with a dark, focused UI using **plain CSS** only.

This session: **foundation only**. DB schemas, auth flows, upload pipeline and the streaming engine are wired in the next session.

## Stack
- Next.js 14 (App Router, JavaScript only)
- Supabase (PostgreSQL + Storage)
- Plain CSS dark theme (no UI frameworks)
- Deployable on Vercel

## Folder structure
```
/app           Next.js App Router pages & API routes
  /api/[[...path]]/route.js   Catch-all API router (health + root)
  layout.js
  page.js
/components    UI placeholder components (Sidebar, Topbar, Hero, TrackCard, PlayerBar)
/lib           supabaseClient.js (initialized, not yet used)
/styles        globals.css (dark theme)
```

## Environment variables (in `/app/.env`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ADMIN_PASSWORD_HASH` (bcrypt hash)

## Health check
- `GET /api/`        → app status
- `GET /api/health`  → reports which env vars are present (booleans only)
