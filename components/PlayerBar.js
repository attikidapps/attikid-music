'use client'

import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import { usePlayer } from '../lib/playerContext'

const formatTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const PlayerBar = () => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    toggle,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayer()

  const progressPct = useMemo(() => {
    if (!duration || !isFinite(duration)) return 0
    return Math.min(100, (currentTime / duration) * 100)
  }, [currentTime, duration])

  const onSeek = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const pct = x / rect.width
    seek(pct * duration)
  }

  const onVolume = (e) => {
    const v = Number(e.target.value) / 100
    setVolume(v)
  }

  const canPlay = Boolean(currentSong)

  return (
    <footer className="am-player">
      {/* LEFT: song meta */}
      <div className="am-player__left">
        <div className="am-player__meta">
          <div className="am-player__cover">
            {currentSong && (
              <div className="am-player__cover-letter">
                {(currentSong.title || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="am-player__textcol">
            <div className="am-player__title am-fade" key={currentSong?.id || 'none'}>
              {error
                ? <span style={{ color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertCircle size={13} /> {error}</span>
                : (currentSong ? currentSong.title : 'Nothing playing')}
            </div>
            <div className="am-player__artist">
              {currentSong
                ? (isLoading ? 'Buffering…' : (isPlaying ? 'Now playing' : 'Paused'))
                : 'Pick a track to start'}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: controls + progress */}
      <div className="am-player__center">
        <div className="am-player__controls">
          <button
            className="am-player__btn"
            aria-label="Previous"
            onClick={prev}
            disabled={!canPlay}
          >
            <SkipBack size={18} />
          </button>

          <button
            className="am-player__btn am-player__btn--primary"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={toggle}
            disabled={!canPlay}
          >
            {isLoading
              ? <Loader2 size={16} className="am-spin" />
              : (isPlaying ? <Pause size={16} fill="#000" /> : <Play size={16} fill="#000" />)}
          </button>

          <button
            className="am-player__btn"
            aria-label="Next"
            onClick={next}
            disabled={!canPlay}
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div className="am-player__progress">
          <span className="am-player__time">{formatTime(currentTime)}</span>
          <div
            className="am-player__bar"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
            onClick={onSeek}
          >
            <div className="am-player__bar-fill" style={{ width: `${progressPct}%` }} />
            <div className="am-player__bar-thumb" style={{ left: `${progressPct}%` }} />
          </div>
          <span className="am-player__time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: volume */}
      <div className="am-player__right">
        <button
          className="am-player__btn"
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
        >
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(volume * 100)}
          onChange={onVolume}
          aria-label="Volume"
          className="am-player__volume"
          style={{
            '--val': `${Math.round(volume * 100)}%`,
          }}
        />
      </div>
    </footer>
  )
}

export default PlayerBar
