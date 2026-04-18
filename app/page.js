'use client'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Hero from '../components/Hero'
import TrackCard from '../components/TrackCard'
import PlayerBar from '../components/PlayerBar'

const featured = [
  { title: 'Daily Mix 1',      subtitle: 'Chill electronic • Auto' },
  { title: 'Late Night Drive', subtitle: 'Synthwave • 42 tracks' },
  { title: 'Focus Deep',       subtitle: 'Instrumental • 2h 10m' },
  { title: 'Indie Discoveries',subtitle: 'Fresh picks • Weekly' },
  { title: 'Greek Classics',   subtitle: 'Timeless • 87 tracks' },
  { title: 'Morning Acoustic', subtitle: 'Unplugged • Playlist' },
]

const newReleases = [
  { title: 'Midnight Echoes',  subtitle: 'Aura Vale' },
  { title: 'Neon Horizons',    subtitle: 'Kavos' },
  { title: 'Paper Planes',     subtitle: 'Lena Ortho' },
  { title: 'Slow Burn',        subtitle: 'The Attic' },
  { title: 'Golden Hour',      subtitle: 'Rhea' },
  { title: 'Undertow',         subtitle: 'Nik Delta' },
]

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
              <h2 className="am-h2">Featured for you</h2>
              <a href="#" className="am-section__see-all">See all</a>
            </div>
            <div className="am-grid">
              {featured.map((item) => (
                <TrackCard key={item.title} title={item.title} subtitle={item.subtitle} />
              ))}
            </div>
          </section>

          <section className="am-section">
            <div className="am-section__header">
              <h2 className="am-h2">New releases</h2>
              <a href="#" className="am-section__see-all">See all</a>
            </div>
            <div className="am-grid">
              {newReleases.map((item) => (
                <TrackCard key={item.title} title={item.title} subtitle={item.subtitle} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <PlayerBar />
    </div>
  )
}

export default App
