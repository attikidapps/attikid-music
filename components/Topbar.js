// Placeholder topbar — no logic yet.
'use client'

import { Search, User } from 'lucide-react'

const Topbar = () => {
  return (
    <div className="am-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <Search size={18} color="#a1a1aa" style={{ marginLeft: 4 }} />
        <input
          type="text"
          placeholder="Search songs, artists, albums…"
          className="am-topbar__search"
        />
      </div>
      <div className="am-topbar__actions">
        <button className="am-btn am-btn--ghost">Sign in</button>
        <button
          className="am-btn am-btn--primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <User size={14} />
          <span>Admin</span>
        </button>
      </div>
    </div>
  )
}

export default Topbar
