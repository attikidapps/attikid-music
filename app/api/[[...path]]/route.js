import { NextResponse } from 'next/server'

// Helper: CORS headers
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const resolvedParams = await params
  const pathArr = resolvedParams?.path || []
  const route = `/${pathArr.join('/')}`
  const method = request.method

  try {
    // Root healthcheck
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(
        NextResponse.json({
          app: 'Attikid Music API',
          status: 'ok',
          version: '0.1.0',
          message: 'Foundation ready. DB + features coming next session.',
        })
      )
    }

    // Env presence check (does NOT leak secret values)
    if (route === '/health' && method === 'GET') {
      return handleCORS(
        NextResponse.json({
          status: 'ok',
          env: {
            supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
            supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
            adminPasswordHash: Boolean(process.env.ADMIN_PASSWORD_HASH),
          },
          timestamp: new Date().toISOString(),
        })
      )
    }

    return handleCORS(
      NextResponse.json({ error: `Route ${route} not found` }, { status: 404 })
    )
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
