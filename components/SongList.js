'use client'

import { useEffect, useState } from 'react'
import { Play, Loader2, AlertCircle, Volume2 } from 'lucide-react'
import { usePlayer } from '../lib/playerContext'

const SongList = () => {
  const { currentSong, isPlaying, setQueueAndPlay } = usePlayer()
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

  const handlePlay = (index) => {
    // Use the current rendered order as the queue
    setQueueAndPlay(songs, index)
  }

  if (status === 'loading') {
    return (
      <div className="am-state">
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
        <span>No songs yet. Seed your <code>songs</code> table in Supabase.</span>
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
