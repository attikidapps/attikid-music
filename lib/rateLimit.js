// Lightweight in-memory sliding-window rate limiter.
//
// NOTE: On Vercel serverless, each cold instance holds its own Map,
// so limits are approximate across instances — good enough for anti-spam.
// For strict global limits you'd back this with Supabase or Redis.

const buckets = new Map() // key -> number[] (timestamps, ms)

export function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const cutoff = now - windowMs
  const arr = buckets.get(key) || []
  // Drop expired
  let i = 0
  while (i < arr.length && arr[i] <= cutoff) i++
  const recent = i > 0 ? arr.slice(i) : arr

  if (recent.length >= max) {
    const retryAfterMs = recent[0] + windowMs - now
    buckets.set(key, recent)
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  recent.push(now)
  buckets.set(key, recent)

  // Periodic cleanup: cap map size
  if (buckets.size > 5000) {
    const freshCutoff = now - windowMs * 2
    for (const [k, v] of buckets) {
      const kept = v.filter((t) => t > freshCutoff)
      if (kept.length === 0) buckets.delete(k)
      else buckets.set(k, kept)
    }
  }

  return { ok: true, remaining: Math.max(0, max - recent.length) }
}

// Debounce helper: returns true if this (key) has NOT been seen in last windowMs.
const lastSeen = new Map()
export function debounceKey(key, windowMs) {
  const now = Date.now()
  const prev = lastSeen.get(key) || 0
  if (now - prev < windowMs) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - prev)) / 1000)) }
  }
  lastSeen.set(key, now)
  // Cleanup if map grows
  if (lastSeen.size > 10000) {
    const cutoff = now - windowMs * 4
    for (const [k, t] of lastSeen) if (t < cutoff) lastSeen.delete(k)
  }
  return { ok: true }
}
