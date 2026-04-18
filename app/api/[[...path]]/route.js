import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase clients
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

function getPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getAdminClient() {
  if (!SUPABASE_SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// ---------------------------------------------------------------------------
// Admin placeholder (real auth comes next session)
// ---------------------------------------------------------------------------
async function isAdmin(request) {
  // Placeholder: for now we only accept requests that carry the bcrypt hash
  // of the admin password directly. Real password verification (with login
  // + session cookie) will land in the next session.
  const sent = request.headers.get('x-admin-password-hash')
  return Boolean(sent && sent === process.env.ADMIN_PASSWORD_HASH)
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
    // --- Health ---------------------------------------------------------
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({
        app: 'Attikid Music API',
        status: 'ok',
        version: '0.2.0',
      }))
    }

    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({
        status: 'ok',
        env: {
          supabaseUrl: Boolean(SUPABASE_URL),
          supabaseAnonKey: Boolean(SUPABASE_ANON),
          supabaseServiceRoleKey: Boolean(SUPABASE_SERVICE),
          adminPasswordHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
        },
      }))
    }

    // --- Songs ----------------------------------------------------------
    if (route === '/songs' && method === 'GET') {
      const supabase = getPublicClient()
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, file_url, plays, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message, code: error.code || null },
          { status: 500 }
        ))
      }
      return handleCORS(NextResponse.json({ songs: data || [] }))
    }

    if (route === '/songs' && method === 'POST') {
      // Admin-only placeholder. Real auth arrives next session.
      if (!(await isAdmin(request))) {
        return handleCORS(NextResponse.json(
          { error: 'Unauthorized. Admin auth coming in next session.' },
          { status: 401 }
        ))
      }

      let body
      try { body = await request.json() }
      catch { return handleCORS(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })) }

      const { title, file_url } = body || {}
      if (!title || !file_url) {
        return handleCORS(NextResponse.json(
          { error: 'title and file_url are required' },
          { status: 400 }
        ))
      }

      const supabase = getAdminClient()
      const { data, error } = await supabase
        .from('songs')
        .insert({ title, file_url })
        .select('id, title, file_url, plays, created_at')
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message, code: error.code || null },
          { status: 500 }
        ))
      }
      return handleCORS(NextResponse.json({ song: data }, { status: 201 }))
    }

    // --- 404 ------------------------------------------------------------
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, { status: 404 }
    ))
  } catch (err) {
    console.error('API Error:', err)
    return handleCORS(NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    ))
  }
}

export const GET    = handleRoute
export const POST   = handleRoute
export const PUT    = handleRoute
export const DELETE = handleRoute
export const PATCH  = handleRoute
