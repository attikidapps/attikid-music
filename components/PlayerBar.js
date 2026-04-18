// Placeholder player bar — no audio logic yet.
'use client'

import {
  Shuffle,
  SkipBack,
  Play,
  SkipForward,
  Repeat,
  Volume2,
  ListMusic,
} from 'lucide-react'

const PlayerBar = () => {
  return (
    <footer className="am-player">
      <div className="am-player__left">
        <div className="am-player__meta">
          <div className="am-player__cover" />
          <div>
            <div className="am-player__title">Nothing playing</div>
            <div className="am-player__artist">Pick a track to start</div>
          </div>
        </div>
      </div>

      <div className="am-player__center">
        <div className="am-player__controls">
          <button className="am-player__btn" aria-label="Shuffle"><Shuffle size={16} /></button>
          <button className="am-player__btn" aria-label="Previous"><SkipBack size={18} /></button>
          <button className="am-player__btn am-player__btn--primary" aria-label="Play">
            <Play size={16} fill="#000" />
          </button>
          <button className="am-player__btn" aria-label="Next"><SkipForward size={18} /></button>
          <button className="am-player__btn" aria-label="Repeat"><Repeat size={16} /></button>
        </div>
        <div className="am-player__progress">
          <span className="am-player__time">0:00</span>
          <div className="am-player__bar"><div className="am-player__bar-fill" /></div>
          <span className="am-player__time">0:00</span>
        </div>
      </div>

      <div className="am-player__right">
        <button className="am-player__btn" aria-label="Queue"><ListMusic size={16} /></button>
        <button className="am-player__btn" aria-label="Volume"><Volume2 size={16} /></button>
      </div>
    </footer>
  )
}

export default PlayerBar
