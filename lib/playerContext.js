'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { getSessionId } from './sessionId'

const PlayerContext = createContext(null)

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null)
  if (typeof window !== 'undefined' && !audioRef.current) {
    audioRef.current = new Audio()
    audioRef.current.preload = 'metadata'
  }

  const [playlist, setPlaylist]         = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [volume, setVolumeState]        = useState(0.8)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState(null)

  const currentSong = currentIndex >= 0 ? playlist[currentIndex] || null : null

  // --- Track “plays” once per song-change after canplay (debounced server-side)
  const playSentRef = useRef(new Set())  // set of (sessionId|songId) already sent this page load

  const reportPlay = useCallback(async (song) => {
    try {
      const sid = getSessionId()
      if (!sid || !song?.id) return
      const key = `${sid}|${song.id}`
      if (playSentRef.current.has(key)) return
      playSentRef.current.add(key)
      await fetch('/api/plays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: song.id, session_id: sid }),
      })
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime     = () => setCurrentTime(a.currentTime || 0)
    const onMeta     = () => setDuration(a.duration || 0)
    const onPlay     = () => setIsPlaying(true)
    const onPause    = () => setIsPlaying(false)
    const onEnded    = () => nextRef.current?.()
    const onLoadStart= () => { setIsLoading(true); setError(null) }
    const onCanPlay  = () => {
      setIsLoading(false)
      const idx = currentIndexRef.current
      const song = playlistRef.current[idx]
      if (song) reportPlay(song)
    }
    const onError    = () => { setIsLoading(false); setError('Could not load audio.'); setIsPlaying(false) }

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)
    a.addEventListener('loadstart', onLoadStart)
    a.addEventListener('canplay', onCanPlay)
    a.addEventListener('error', onError)
    a.volume = volume

    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('loadstart', onLoadStart)
      a.removeEventListener('canplay', onCanPlay)
      a.removeEventListener('error', onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAndPlay = useCallback((index) => {
    const a = audioRef.current
    if (!a) return
    const song = playlist[index]
    if (!song || !song.file_url) return
    setCurrentIndex(index); setError(null); setCurrentTime(0)
    if (a.src !== song.file_url) { a.src = song.file_url; a.load() }
    const p = a.play()
    if (p?.catch) p.catch(() => setIsPlaying(false))
  }, [playlist])

  const play  = useCallback(() => { const a = audioRef.current; if (!a?.src) return; const p = a.play(); if (p?.catch) p.catch(() => {}) }, [])
  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (!a.src && playlist.length > 0 && currentIndex < 0) { loadAndPlay(0); return }
    if (a.paused) play(); else pause()
  }, [play, pause, playlist.length, currentIndex, loadAndPlay])

  const next = useCallback(() => {
    if (playlist.length === 0) return
    loadAndPlay((currentIndex + 1 + playlist.length) % playlist.length)
  }, [currentIndex, playlist.length, loadAndPlay])

  const prev = useCallback(() => {
    if (playlist.length === 0) return
    loadAndPlay((currentIndex - 1 + playlist.length) % playlist.length)
  }, [currentIndex, playlist.length, loadAndPlay])

  const nextRef = useRef(next); useEffect(() => { nextRef.current = next }, [next])
  const currentIndexRef = useRef(currentIndex); useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  const playlistRef = useRef(playlist); useEffect(() => { playlistRef.current = playlist }, [playlist])

  const seek = useCallback((seconds) => {
    const a = audioRef.current
    if (!a || !isFinite(seconds)) return
    const clamped = Math.max(0, Math.min(seconds, a.duration || seconds))
    a.currentTime = clamped; setCurrentTime(clamped)
  }, [])

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v))
    if (audioRef.current) audioRef.current.volume = clamped
    setVolumeState(clamped)
  }, [])

  const setQueueAndPlay = useCallback((list, startIndex = 0) => {
    if (!Array.isArray(list) || list.length === 0) { setPlaylist([]); setCurrentIndex(-1); return }
    setPlaylist(list)
    queueMicrotask(() => {
      const a = audioRef.current
      if (!a) return
      const song = list[startIndex]
      if (!song) return
      setCurrentIndex(startIndex); setError(null); setCurrentTime(0)
      a.src = song.file_url; a.load()
      const p = a.play()
      if (p?.catch) p.catch(() => setIsPlaying(false))
    })
  }, [])

  const value = useMemo(() => ({
    playlist, currentIndex, currentSong, isPlaying, currentTime, duration, volume, isLoading, error,
    setQueueAndPlay, play, pause, toggle, next, prev, seek, setVolume,
  }), [playlist, currentIndex, currentSong, isPlaying, currentTime, duration, volume, isLoading, error,
      setQueueAndPlay, play, pause, toggle, next, prev, seek, setVolume])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within <PlayerProvider>')
  return ctx
}

export default PlayerContext
