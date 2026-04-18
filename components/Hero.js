// Hero welcome block for the home page.
'use client'

const Hero = () => {
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const greet =
    hour < 5 ? 'Still up?' :
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <section className="am-hero">
      <div>
        <span className="am-hero__badge">Attikid Music</span>
        <h1 className="am-h1">{greet} — ready for a new sound?</h1>
        <p className="am-muted" style={{ marginTop: 8, maxWidth: 640 }}>
          Your personal streaming space. Playlists, tracks and artists — all in one dark, focused place.
        </p>
      </div>
    </section>
  )
}

export default Hero
