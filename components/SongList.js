'use client'

import { useEffect, useState } from 'react'
import { Play, Loader2, AlertCircle } from 'lucide-react'
import { usePlayer } from '../lib/playerContext'

const SongList = () => {
  const { currentSong, playSong } = usePlayer()
  const [songs, setSongs]   = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error' | 'empty'
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setStatus('loading')
        const res = await fetch('/api/songs', { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json?.error || `HTTP ${res.status}`)
          setStatus('error')
          return
        }
        setSongs(json.songs || [])
        setStatus((json.songs || []).length === 0 ? 'empty' : 'ready')
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        setStatus('error')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading') {
    return (
      <div className="am-state am-state--loading">
        <Loader2 size={16} className="am-spin" />
        <span>Loading songs…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="am-state am-state--error">
        <AlertCircle size={16} />
        <span>Could not load songs: {error}</span>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="am-state">
        <span>No songs yet. Once the <code>songs</code> table is seeded in Supabase, they’ll appear here.</span>
      </div>
    )
  }

  return (
    <ul className="am-songlist">
      {songs.map((s, i) => {
        const active = currentSong?.id === s.id
        return (
          <li
            key={s.id}
            className={`am-songlist__item ${active ? 'am-songlist__item--active' : ''}`}
            onClick={() => playSong(s)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playSong(s) }}
          >
            <span className="am-songlist__index">
              {active
                ? <Play size={14} fill="currentColor" />
                : String(i + 1).padStart(2, '0')}
            </span>
            <span className="am-songlist__title">{s.title}</span>
            <span className="am-songlist__plays am-dim">
              {typeof s.plays === 'number' ? `${s.plays} plays` : ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default SongList
