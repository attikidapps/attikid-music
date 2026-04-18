'use client'

// session_id is a stable anonymous identifier persisted in localStorage.
// Used to prevent duplicate likes per user without requiring auth.

const KEY = 'attikid.session_id'

const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const getSessionId = () => {
  if (typeof window === 'undefined') return null
  try {
    let v = localStorage.getItem(KEY)
    if (!v) {
      v = genId()
      localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return null
  }
}

export default getSessionId
