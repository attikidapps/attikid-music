'use client'

import { Search } from 'lucide-react'

const Topbar = ({ query, onQueryChange, onOpenAdmin }) => {
  return (
    <div className="am-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <Search size={18} color="#a1a1aa" style={{ marginLeft: 4 }} />
        <input
          type="text"
          placeholder="Search songs by title…"
          className="am-topbar__search"
          value={query || ''}
          onChange={(e) => onQueryChange?.(e.target.value)}
          maxLength={100}
        />
      </div>
      <div className="am-topbar__actions">
        <a href="/admin" className="am-btn am-btn--primary">
          Admin
        </a>
      </div>
    </div>
  )
}

export default Topbar
