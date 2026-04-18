// Placeholder media card — used for tracks, albums and playlists.
'use client'

import { Play } from 'lucide-react'

const TrackCard = ({ title = 'Untitled', subtitle = 'Unknown artist', initial }) => {
  const letter = (initial || title || '?').toString().trim().charAt(0).toUpperCase()
  return (
    <div className="am-card">
      <div className="am-card__cover">
        {letter}
        <button className="am-card__play" aria-label={`Play ${title}`}>
          <Play size={16} fill="#000" />
        </button>
      </div>
      <div className="am-card__title">{title}</div>
      <div className="am-card__subtitle">{subtitle}</div>
    </div>
  )
}

export default TrackCard
