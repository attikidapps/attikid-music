'use client'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Hero from '../components/Hero'
import SongList from '../components/SongList'
import PlayerBar from '../components/PlayerBar'

const App = () => {
  return (
    <div className="am-app">
      <Sidebar />

      <main className="am-main">
        <div className="am-main-inner">
          <Topbar />
          <Hero />

          <section className="am-section">
            <div className="am-section__header">
              <h2 className="am-h2">All songs</h2>
              <span className="am-section__see-all am-dim">From Supabase · live</span>
            </div>
            <SongList />
          </section>
        </div>
      </main>

      <PlayerBar />
    </div>
  )
}

export default App
