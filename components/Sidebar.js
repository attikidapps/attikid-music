// Placeholder sidebar — no logic yet.
'use client'

import { Home, Search, Library, Heart, PlusSquare, Music2 } from 'lucide-react'

const Sidebar = () => {
  const primary = [
    { icon: <Home size={18} />, label: 'Home', active: true },
    { icon: <Search size={18} />, label: 'Search' },
    { icon: <Library size={18} />, label: 'Your Library' },
  ]

  const secondary = [
    { icon: <PlusSquare size={18} />, label: 'Create Playlist' },
    { icon: <Heart size={18} />, label: 'Liked Songs' },
  ]

  const playlists = [
    'Chill Vibes',
    'Focus Deep',
    'Late Night Drive',
    'Indie Discoveries',
    'Greek Classics',
  ]

  return (
    <aside className="am-sidebar">
      <div className="am-brand">
        <span className="am-brand__dot" />
        <span>Attikid Music</span>
      </div>

      <nav className="am-nav">
        {primary.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`am-nav__item ${item.active ? 'am-nav__item--active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}

        <div className="am-nav__section-title">Your stuff</div>
        {secondary.map((item) => (
          <a key={item.label} href="#" className="am-nav__item">
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}

        <div className="am-nav__section-title">Playlists</div>
        {playlists.map((p) => (
          <a key={p} href="#" className="am-nav__item">
            <Music2 size={16} />
            <span>{p}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
