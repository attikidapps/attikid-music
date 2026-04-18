'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { getSessionId } from '../lib/sessionId'

const LikeButton = ({ songId, initialCount = 0, initialLiked = false, onChange }) => {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy]   = useState(false)

  useEffect(() => { setLiked(initialLiked) }, [initialLiked])
  useEffect(() => { setCount(initialCount) }, [initialCount])

  const toggle = useCallback(async (e) => {
    e?.stopPropagation()
    if (busy) return
    setBusy(true)

    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))
    setLiked(nextLiked)
    setCount(nextCount)

    try {
      const session_id = getSessionId()
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId, session_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      // Trust server result
      setLiked(Boolean(json.liked))
      setCount(typeof json.count === 'number' ? json.count : nextCount)
      onChange?.(json)
    } catch (err) {
      // Revert
      setLiked(prevLiked)
      setCount(prevCount)
      console.warn('Like toggle failed:', err)
    } finally {
      setBusy(false)
    }
  }, [busy, liked, count, songId, onChange])

  return (
    <button
      className={`am-like ${liked ? 'am-like--on' : ''}`}
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      title={liked ? 'Unlike' : 'Like'}
      disabled={busy}
    >
      <Heart
        size={15}
        fill={liked ? 'currentColor' : 'none'}
        strokeWidth={liked ? 0 : 2}
      />
      <span className="am-like__count">{count}</span>
    </button>
  )
}

export default LikeButton
