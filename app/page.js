'use client'

import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Hero from '../components/Hero'
import SongList from '../components/SongList'
import CommentsSection from '../components/CommentsSection'
import PlayerBar from '../components/PlayerBar'

const App = () => {
  const [query, setQuery] = useState('')

  return (
    <div className="am-app">
      <Sidebar />

      <main className="am-main">
        <div className="am-main-inner">
          <Topbar query={query} onQueryChange={setQuery} />
          <Hero />

          <section className="am-section">
            <div className="am-section__header">
              <h2 className="am-h2">
                {query.trim() ? `Results for “${query}”` : 'All songs'}
              </h2>
              <span className="am-section__see-all am-dim">From Supabase · live</span>
            </div>
            <SongList query={query} />
          </section>

          <CommentsSection />
        </div>
      </main>

      <PlayerBar />
    </div>
  )
}

export default App
