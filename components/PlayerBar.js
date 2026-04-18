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
import { usePlayer } from '../lib/playerContext'

const PlayerBar = () => {
  const { currentSong } = usePlayer()

  return (
    <footer className="am-player">
      <div className="am-player__left">
        <div className="am-player__meta">
          <div className="am-player__cover">
            {currentSong && (
              <div className="am-player__cover-letter">
                {(currentSong.title || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="am-player__title">
              {currentSong ? currentSong.title : 'Nothing playing'}
            </div>
            <div className="am-player__artist">
              {currentSong ? 'Ready — controls coming next session' : 'Pick a track to start'}
            </div>
          </div>
        </div>
      </div>

      <div className="am-player__center">
        <div className="am-player__controls">
          <button className="am-player__btn" aria-label="Shuffle" disabled><Shuffle size={16} /></button>
          <button className="am-player__btn" aria-label="Previous" disabled><SkipBack size={18} /></button>
          <button className="am-player__btn am-player__btn--primary" aria-label="Play" disabled>
            <Play size={16} fill="#000" />
          </button>
          <button className="am-player__btn" aria-label="Next" disabled><SkipForward size={18} /></button>
          <button className="am-player__btn" aria-label="Repeat" disabled><Repeat size={16} /></button>
        </div>
        <div className="am-player__progress">
          <span className="am-player__time">0:00</span>
          <div className="am-player__bar"><div className="am-player__bar-fill" /></div>
          <span className="am-player__time">0:00</span>
        </div>
      </div>

      <div className="am-player__right">
        <button className="am-player__btn" aria-label="Queue" disabled><ListMusic size={16} /></button>
        <button className="am-player__btn" aria-label="Volume" disabled><Volume2 size={16} /></button>
      </div>
    </footer>
  )
}

export default PlayerBar
