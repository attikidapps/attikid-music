'use client'

import { useEffect, useState, useCallback } from 'react'
import { Play, Loader2, AlertCircle, Volume2, Inbox } from 'lucide-react'
import { usePlayer } from '../lib/playerContext'
import { getSessionId } from '../lib/sessionId'
import LikeButton from './LikeButton'

const SongList = ({ query = '' }) => {
  const { currentSong, isPlaying, setQueueAndPlay } = usePlayer()
  const [songs, setSongs]   = useState([])
  const [counts, setCounts] = useState({})
  const [mine, setMine]     = useState(new Set())
  const [status, setStatus] = useState('loading')
  const [error, setError]   = useState(null)

  const loadAll = useCallback(async () => {
    try {
      setStatus('loading')
      const session_id = getSessionId()
      const [sR, cR, mR] = await Promise.all([
        fetch('/api/songs', { cache: 'no-store' }),
        fetch('/api/likes/counts', { cache: 'no-store' }),
        session_id
          ? fetch(`/api/likes/session?session_id=${encodeURIComponent(session_id)}`, { cache: 'no-store' })
          : Promise.resolve(null),
      ])
      const sJ = await sR.json()
      if (!sR.ok) throw new Error(sJ?.error || 'songs failed')
      const cJ = cR.ok ? await cR.json() : { counts: {} }
      const mJ = mR && mR.ok ? await mR.json() : { song_ids: [] }
      setSongs(sJ.songs || [])
      setCounts(cJ.counts || {})
      setMine(new Set(mJ.song_ids || []))
      setStatus((sJ.songs || []).length === 0 ? 'empty' : 'ready')
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }, [])
  useEffect(() => { loadAll() }, [loadAll])

  const q = (query || '').trim().toLowerCase()
  const filtered = q
    ? songs.filter((s) => (s.title || '').toLowerCase().includes(q))
    : songs

  const handlePlay = (visibleIndex) => {
    // Play from the FILTERED queue, so next/prev stays within the visible list
    setQueueAndPlay(filtered, visibleIndex)
  }

  const handleLikeChange = (songId, json) => {
    setCounts((c) => ({ ...c, [songId]: typeof json.count === 'number' ? json.count : (c[songId] || 0) }))
    setMine((prev) => {
      const n = new Set(prev)
      if (json.liked) n.add(songId); else n.delete(songId)
      return n
    })
  }

  if (status === 'loading') return (
    <div className="am-state"><Loader2 size={16} className="am-spin" /><span>Loading songs…</span></div>
  )
  if (status === 'error') return (
    <div className="am-state am-state--error"><AlertCircle size={16} /><span>Could not load songs: {error}</span></div>
  )
  if (status === 'empty') return (
    <div className="am-state am-state--empty">
      <Inbox size={18} />
      <div>
        <div style={{ fontWeight: 600, color: 'var(--am-text)' }}>No songs yet</div>
        <div>Upload your first track from the <a href="/admin">admin dashboard</a>.</div>
      </div>
    </div>
  )
  if (filtered.length === 0) return (
    <div className="am-state am-state--empty">
      <Inbox size={18} />
      <span>No matches for “{query}”.</span>
    </div>
  )

  return (
    <ul className="am-songlist">
      {filtered.map((s, i) => {
        const active = currentSong?.id === s.id
        return (
          <li
            key={s.id}
            className={`am-songlist__item ${active ? 'am-songlist__item--active' : ''}`}
            onClick={() => handlePlay(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlay(i) }}
          >
            <span className="am-songlist__index">
              {active
                ? (isPlaying
                    ? <Volume2 size={14} className="am-pulse" />
                    : <Play size={14} fill="currentColor" />)
                : String(i + 1).padStart(2, '0')}
            </span>
            <span className="am-songlist__title">{s.title}</span>
            <LikeButton
              songId={s.id}
              initialCount={counts[s.id] || 0}
              initialLiked={mine.has(s.id)}
              onChange={(json) => handleLikeChange(s.id, json)}
            />
          </li>
        )
      })}
    </ul>
  )
}

export default SongList
