// Server-only helpers for signing / verifying the admin session cookie.
import crypto from 'crypto'

export const ADMIN_COOKIE = 'attikid_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const getSecret = () => {
  const s = process.env.ADMIN_PASSWORD_HASH
  if (!s) throw new Error('ADMIN_PASSWORD_HASH not configured')
  return s
}

const b64urlEncode = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlDecode = (str) =>
  Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

export function signAdminToken(payload = {}) {
  const body = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + ADMIN_COOKIE_MAX_AGE * 1000,
  }
  const data = b64urlEncode(JSON.stringify(body))
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest()
  return `${data}.${b64urlEncode(sig)}`
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null
  const [data, sig] = token.split('.')
  if (!data || !sig) return null
  try {
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest()
    const given = b64urlDecode(sig)
    if (expected.length !== given.length) return null
    if (!crypto.timingSafeEqual(expected, given)) return null
    const payload = JSON.parse(b64urlDecode(data).toString('utf8'))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getAdminFromRequest(request) {
  const cookie = request.cookies?.get?.(ADMIN_COOKIE)?.value
  if (!cookie) return null
  return verifyAdminToken(cookie)
}

export function isAdminRequest(request) {
  return Boolean(getAdminFromRequest(request))
}
