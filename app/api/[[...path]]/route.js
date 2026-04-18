import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  signAdminToken,
  verifyAdminToken,
  isAdminRequest,
} from '../../../lib/adminAuth'

// ---------------------------------------------------------------------------
// Supabase clients
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

const getPublicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false, autoRefreshToken: false } })

const getAdminClient = () => {
  if (!SUPABASE_SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
const json = (body, status = 200) => handleCORS(NextResponse.json(body, { status }))
const err  = (msg, status = 500, extra = {}) => json({ error: msg, ...extra }, status)

async function readJson(request) {
  try { return await request.json() } catch { return null }
}

function requireAdmin(request) {
  if (!isAdminRequest(request)) return err('Unauthorized', 401)
  return null
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
async function handleRoute(request, { params }) {
  const resolvedParams = await params
  const pathArr = resolvedParams?.path || []
  const route = `/${pathArr.join('/')}`
  const method = request.method

  try {
    // ============ HEALTH ================================================
    if ((route === '/' || route === '/root') && method === 'GET') {
      return json({ app: 'Attikid Music API', status: 'ok', version: '0.4.0' })
    }

    if (route === '/health' && method === 'GET') {
      return json({
        status: 'ok',
        env: {
          supabaseUrl: Boolean(SUPABASE_URL),
          supabaseAnonKey: Boolean(SUPABASE_ANON),
          supabaseServiceRoleKey: Boolean(SUPABASE_SERVICE),
          adminPasswordHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
        },
      })
    }

    // ============ SONGS (public) =======================================
    if (route === '/songs' && method === 'GET') {
      const { data, error } = await getPublicClient()
        .from('songs')
        .select('id, title, file_url, plays, created_at')
        .order('created_at', { ascending: false, nullsFirst: false })
      if (error) return err(error.message, 500, { code: error.code })
      return json({ songs: data || [] })
    }

    // ============ LIKES ================================================
    if (route === '/likes/counts' && method === 'GET') {
      // Single aggregated fetch
      const { data, error } = await getAdminClient()
        .from('likes')
        .select('song_id')
      if (error) return err(error.message, 500)
      const counts = {}
      for (const row of data || []) {
        counts[row.song_id] = (counts[row.song_id] || 0) + 1
      }
      return json({ counts })
    }

    if (route === '/likes/session' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const session_id = searchParams.get('session_id')
      if (!session_id) return json({ song_ids: [] })
      const { data, error } = await getAdminClient()
        .from('likes')
        .select('song_id')
        .eq('session_id', session_id)
      if (error) return err(error.message, 500)
      return json({ song_ids: (data || []).map((r) => r.song_id) })
    }

    if (route === '/likes/toggle' && method === 'POST') {
      const body = await readJson(request)
      if (!body?.song_id || !body?.session_id) {
        return err('song_id and session_id are required', 400)
      }
      const admin = getAdminClient()
      // Check existing
      const { data: existing, error: selErr } = await admin
        .from('likes')
        .select('id')
        .eq('song_id', body.song_id)
        .eq('session_id', body.session_id)
        .maybeSingle()
      if (selErr) return err(selErr.message, 500)

      let liked
      if (existing) {
        const { error: delErr } = await admin.from('likes').delete().eq('id', existing.id)
        if (delErr) return err(delErr.message, 500)
        liked = false
      } else {
        const { error: insErr } = await admin.from('likes').insert({
          song_id: body.song_id,
          session_id: body.session_id,
        })
        if (insErr) {
          // If the unique constraint raced, treat as already-liked
          if (insErr.code === '23505') { liked = true }
          else return err(insErr.message, 500, { code: insErr.code })
        } else {
          liked = true
        }
      }

      // Return updated count for this song
      const { count } = await admin.from('likes').select('*', { count: 'exact', head: true }).eq('song_id', body.song_id)
      return json({ liked, count: count || 0 })
    }

    // ============ ADMIN AUTH ==========================================
    if (route === '/admin/login' && method === 'POST') {
      const body = await readJson(request)
      const password = body?.password
      const username = body?.username || 'admin'
      if (!password) return err('Password required', 400)
      if (username !== 'admin') return err('Invalid credentials', 401)
      const hash = process.env.ADMIN_PASSWORD_HASH
      if (!hash) return err('Admin not configured', 500)

      // Constant-time-ish compare via bcrypt
      const ok = await bcrypt.compare(password, hash)
      if (!ok) return err('Invalid credentials', 401)

      const token = signAdminToken({ sub: 'admin', role: 'admin' })
      const response = json({ ok: true, user: { username: 'admin', role: 'admin' } })
      response.cookies.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: ADMIN_COOKIE_MAX_AGE,
      })
      return response
    }

    if (route === '/admin/logout' && method === 'POST') {
      const response = json({ ok: true })
      response.cookies.set(ADMIN_COOKIE, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
      return response
    }

    if (route === '/admin/me' && method === 'GET') {
      const token = request.cookies.get(ADMIN_COOKIE)?.value
      const payload = verifyAdminToken(token)
      if (!payload) return json({ authenticated: false }, 200)
      return json({ authenticated: true, user: { username: 'admin', role: payload.role || 'admin' } })
    }

    // ============ ADMIN-ONLY ROUTES ===================================
    if (route.startsWith('/admin/')) {
      const guard = requireAdmin(request)
      if (guard) return guard
    }

    // ---- /admin/songs ------------------------------------------------
    if (route === '/admin/songs' && method === 'GET') {
      const { data, error } = await getAdminClient()
        .from('songs')
        .select('id, title, file_url, plays, created_at')
        .order('created_at', { ascending: false, nullsFirst: false })
      if (error) return err(error.message, 500)
      return json({ songs: data || [] })
    }

    if (route === '/admin/songs' && method === 'POST') {
      // multipart upload: fields { file, title }
      const ct = request.headers.get('content-type') || ''
      if (!ct.includes('multipart/form-data')) {
        return err('Expected multipart/form-data', 400)
      }
      const form = await request.formData()
      const file = form.get('file')
      const title = (form.get('title') || '').toString().trim()
      if (!file || typeof file === 'string') return err('file is required', 400)
      if (!title) return err('title is required', 400)

      const admin = getAdminClient()
      // Ensure bucket (idempotent)
      await admin.storage.createBucket('songs', { public: true }).catch(() => {})

      // Build a safe filename
      const orig = (file.name || 'upload.mp3').replace(/[^a-zA-Z0-9._-]/g, '_')
      const stamp = Date.now().toString(36)
      const path  = `${stamp}-${orig}`
      const arrayBuf = await file.arrayBuffer()

      const { error: upErr } = await admin.storage.from('songs').upload(path, arrayBuf, {
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      })
      if (upErr) return err(`Upload failed: ${upErr.message}`, 500)

      const { data: pub } = admin.storage.from('songs').getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const { data: inserted, error: insErr } = await admin
        .from('songs')
        .insert({ title, file_url: publicUrl })
        .select('id, title, file_url, plays, created_at')
        .single()
      if (insErr) return err(insErr.message, 500)

      return json({ song: inserted }, 201)
    }

    // /admin/songs/:id  (PUT edit title, DELETE remove)
    const songIdMatch = route.match(/^\/admin\/songs\/([0-9a-fA-F-]{36})$/)
    if (songIdMatch) {
      const id = songIdMatch[1]
      const admin = getAdminClient()

      if (method === 'PUT' || method === 'PATCH') {
        const body = await readJson(request)
        const patch = {}
        if (typeof body?.title === 'string' && body.title.trim()) patch.title = body.title.trim()
        if (typeof body?.file_url === 'string' && body.file_url.trim()) patch.file_url = body.file_url.trim()
        if (Object.keys(patch).length === 0) return err('Nothing to update', 400)

        const { data, error } = await admin
          .from('songs').update(patch).eq('id', id)
          .select('id, title, file_url, plays, created_at').single()
        if (error) return err(error.message, 500)
        return json({ song: data })
      }

      if (method === 'DELETE') {
        // Try to also delete the underlying storage object if it lives in our bucket
        const { data: current } = await admin.from('songs').select('file_url').eq('id', id).single()
        const { error: delErr } = await admin.from('songs').delete().eq('id', id)
        if (delErr) return err(delErr.message, 500)

        if (current?.file_url) {
          const marker = '/storage/v1/object/public/songs/'
          const idx = current.file_url.indexOf(marker)
          if (idx >= 0) {
            const objectPath = current.file_url.slice(idx + marker.length)
            await admin.storage.from('songs').remove([objectPath]).catch(() => {})
          }
        }
        return json({ ok: true })
      }
    }

    // ---- /admin/comments -------------------------------------------
    if (route === '/admin/comments' && method === 'GET') {
      const { data, error } = await getAdminClient()
        .from('comments')
        .select('id, song_id, session_id, author, body, created_at, songs:song_id ( title )')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) return err(error.message, 500)
      const comments = (data || []).map((c) => ({
        id: c.id,
        song_id: c.song_id,
        session_id: c.session_id,
        author: c.author,
        body: c.body,
        created_at: c.created_at,
        song_title: c.songs?.title || null,
      }))
      return json({ comments })
    }

    const commentIdMatch = route.match(/^\/admin\/comments\/([0-9a-fA-F-]{36})$/)
    if (commentIdMatch && method === 'DELETE') {
      const { error } = await getAdminClient().from('comments').delete().eq('id', commentIdMatch[1])
      if (error) return err(error.message, 500)
      return json({ ok: true })
    }

    // ---- /admin/analytics ------------------------------------------
    if (route === '/admin/analytics' && method === 'GET') {
      const admin = getAdminClient()
      const [songsRes, likesRes, commentsRes] = await Promise.all([
        admin.from('songs').select('id, title, plays').order('created_at', { ascending: false }),
        admin.from('likes').select('song_id'),
        admin.from('comments').select('song_id'),
      ])
      if (songsRes.error)   return err(songsRes.error.message, 500)
      if (likesRes.error)   return err(likesRes.error.message, 500)
      if (commentsRes.error) return err(commentsRes.error.message, 500)

      const likeMap = {}
      for (const r of likesRes.data || []) likeMap[r.song_id] = (likeMap[r.song_id] || 0) + 1
      const commentMap = {}
      for (const r of commentsRes.data || []) commentMap[r.song_id] = (commentMap[r.song_id] || 0) + 1

      const rows = (songsRes.data || []).map((s) => ({
        id: s.id,
        title: s.title,
        plays:    s.plays || 0,
        likes:    likeMap[s.id] || 0,
        comments: commentMap[s.id] || 0,
      }))
      const totals = rows.reduce((acc, r) => ({
        plays:    acc.plays    + r.plays,
        likes:    acc.likes    + r.likes,
        comments: acc.comments + r.comments,
      }), { plays: 0, likes: 0, comments: 0 })

      return json({ rows, totals })
    }

    // ============ 404 =================================================
    return err(`Route ${route} not found`, 404)
  } catch (error) {
    console.error('API Error:', error)
    return err(error?.message || 'Internal server error', 500)
  }
}

export const GET    = handleRoute
export const POST   = handleRoute
export const PUT    = handleRoute
export const DELETE = handleRoute
export const PATCH  = handleRoute
