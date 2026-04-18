// Lightweight text sanitizer for user-submitted content.
// Strips HTML tags, decodes common entities, collapses whitespace.

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;':  '&',
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&#39;':  "'",
  '&apos;': "'",
}

export function stripHtml(input) {
  let s = String(input ?? '')
  // Remove script/style blocks entirely
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
  // Drop any remaining tag
  s = s.replace(/<[^>]*>/g, '')
  // Decode common entities
  for (const [k, v] of Object.entries(ENTITIES)) {
    s = s.split(k).join(v)
  }
  // Collapse whitespace & trim
  s = s.replace(/\r/g, '').replace(/\s+/g, ' ').trim()
  return s
}

export const COMMENT_MAX = 250
export const AUTHOR_MAX  = 40

export function sanitizeComment(raw) {
  const cleaned = stripHtml(raw).slice(0, COMMENT_MAX)
  return cleaned
}

export function sanitizeAuthor(raw) {
  if (!raw) return null
  const cleaned = stripHtml(raw).slice(0, AUTHOR_MAX)
  return cleaned || null
}

// Hard validation: returns { ok, error?, value? }
export function validateCommentPayload(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid payload' }
  if (!body.song_id || typeof body.song_id !== 'string')
    return { ok: false, error: 'song_id required' }
  if (!/^[0-9a-f-]{36}$/i.test(body.song_id))
    return { ok: false, error: 'Invalid song_id' }
  if (!body.session_id || typeof body.session_id !== 'string' || body.session_id.length > 80)
    return { ok: false, error: 'Invalid session_id' }
  const cleanedBody = sanitizeComment(body.body)
  if (!cleanedBody || cleanedBody.length < 1)
    return { ok: false, error: 'Comment is empty' }
  const cleanedAuthor = sanitizeAuthor(body.author)
  return {
    ok: true,
    value: { song_id: body.song_id, session_id: body.session_id, body: cleanedBody, author: cleanedAuthor },
  }
}
