'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  LogOut,
  Upload,
  Loader2,
  Trash2,
  Pencil,
  Check,
  X,
  BarChart3,
  MessageSquare,
  Music2,
  AlertCircle,
} from 'lucide-react'

const tabs = [
  { id: 'songs',     label: 'Songs',     icon: <Music2 size={15} /> },
  { id: 'comments',  label: 'Comments',  icon: <MessageSquare size={15} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
]

/* ==========================================================================
   Root page component
   ======================================================================== */
export default function AdminPage() {
  const [authState, setAuthState] = useState('checking') // 'checking' | 'anon' | 'admin'

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/me', { cache: 'no-store' })
      const j = await r.json()
      setAuthState(j?.authenticated ? 'admin' : 'anon')
    } catch {
      setAuthState('anon')
    }
  }, [])

  useEffect(() => { refreshMe() }, [refreshMe])

  if (authState === 'checking') {
    return (
      <div className="am-admin am-admin--center">
        <Loader2 size={20} className="am-spin" />
      </div>
    )
  }

  if (authState === 'anon') {
    return <LoginScreen onSuccess={() => setAuthState('admin')} />
  }

  return <AdminShell onLogout={() => setAuthState('anon')} />
}

/* ==========================================================================
   Login
   ======================================================================== */
function LoginScreen({ onSuccess }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Login failed')
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="am-admin am-admin--center">
      <form className="am-login" onSubmit={submit}>
        <div className="am-brand" style={{ justifyContent: 'center', marginBottom: 20 }}>
          <span className="am-brand__dot" />
          <span>Attikid Admin</span>
        </div>
        <label className="am-field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="am-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        {error && (
          <div className="am-login__error"><AlertCircle size={14} /> {error}</div>
        )}
        <button className="am-btn am-btn--primary" type="submit" disabled={busy}>
          {busy ? <Loader2 size={14} className="am-spin" /> : 'Sign in'}
        </button>
        <a href="/" className="am-muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          ← Back to site
        </a>
      </form>
    </div>
  )
}

/* ==========================================================================
   Shell (tabs)
   ======================================================================== */
function AdminShell({ onLogout }) {
  const [tab, setTab] = useState('songs')

  const doLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div className="am-admin">
      <header className="am-admin__topbar">
        <div className="am-brand" style={{ marginBottom: 0 }}>
          <span className="am-brand__dot" />
          <span>Attikid Admin</span>
        </div>
        <div className="am-admin__tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`am-tab ${tab === t.id ? 'am-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" className="am-btn am-btn--ghost">View site</a>
          <button className="am-btn am-btn--ghost" onClick={doLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="am-admin__main">
        {tab === 'songs'     && <SongsPanel />}
        {tab === 'comments'  && <CommentsPanel />}
        {tab === 'analytics' && <AnalyticsPanel />}
      </main>
    </div>
  )
}

/* ==========================================================================
   Songs panel
   ======================================================================== */
function SongsPanel() {
  const [songs, setSongs] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [file, setFile]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading'); setError(null)
    try {
      const r = await fetch('/api/admin/songs', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed')
      setSongs(j.songs || [])
      setStatus('ready')
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }, [])
  useEffect(() => { load() }, [load])

  const upload = async (e) => {
    e.preventDefault()
    setUploadErr(null)
    if (!file || !title.trim()) { setUploadErr('Title and file are required'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('file', file)
      const r = await fetch('/api/admin/songs', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Upload failed')
      setTitle(''); setFile(null)
      // reset file input
      const input = document.getElementById('am-file-input')
      if (input) input.value = ''
      await load()
    } catch (e) {
      setUploadErr(e.message)
    } finally {
      setUploading(false)
    }
  }

  const removeSong = async (id) => {
    if (!confirm('Delete this song and its audio file?')) return
    const r = await fetch(`/api/admin/songs/${id}`, { method: 'DELETE' })
    if (r.ok) load()
    else { const j = await r.json().catch(()=>({})); alert(j?.error || 'Delete failed') }
  }

  const saveTitle = async (id, newTitle) => {
    const r = await fetch(`/api/admin/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const j = await r.json()
    if (!r.ok) { alert(j?.error || 'Update failed'); return }
    setSongs((prev) => prev.map((s) => s.id === id ? j.song : s))
  }

  return (
    <div className="am-panel">
      <h2 className="am-h2">Upload a new song</h2>
      <form className="am-upload" onSubmit={upload}>
        <input
          className="am-input"
          type="text"
          placeholder="Song title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          id="am-file-input"
          className="am-input am-input--file"
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <button className="am-btn am-btn--primary" disabled={uploading}>
          {uploading
            ? <><Loader2 size={14} className="am-spin" /> Uploading…</>
            : <><Upload size={14} /> Upload</>}
        </button>
      </form>
      {uploadErr && <div className="am-state am-state--error" style={{ marginTop: 12 }}><AlertCircle size={14} />{uploadErr}</div>}

      <h2 className="am-h2" style={{ marginTop: 32 }}>All songs</h2>
      {status === 'loading' && <div className="am-state"><Loader2 size={16} className="am-spin" />Loading…</div>}
      {status === 'error'   && <div className="am-state am-state--error"><AlertCircle size={16} />{error}</div>}
      {status === 'ready' && (
        <table className="am-table">
          <thead>
            <tr><th>Title</th><th>File</th><th>Plays</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {songs.map((s) => (
              <SongRow key={s.id} song={s} onSaveTitle={saveTitle} onDelete={removeSong} />
            ))}
            {songs.length === 0 && (
              <tr><td colSpan={5} className="am-dim" style={{ textAlign: 'center', padding: 20 }}>No songs yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

function SongRow({ song, onSaveTitle, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(song.title)
  useEffect(() => { setVal(song.title) }, [song.title])

  return (
    <tr>
      <td>
        {editing ? (
          <input
            className="am-input am-input--sm"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onSaveTitle(song.id, val); setEditing(false) }
              if (e.key === 'Escape') { setVal(song.title); setEditing(false) }
            }}
          />
        ) : song.title}
      </td>
      <td className="am-dim" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <a href={song.file_url} target="_blank" rel="noreferrer">{(song.file_url || '').split('/').pop()}</a>
      </td>
      <td className="am-dim">{song.plays || 0}</td>
      <td className="am-dim">{song.created_at ? new Date(song.created_at).toLocaleDateString() : '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <button className="am-iconbtn" onClick={() => { onSaveTitle(song.id, val); setEditing(false) }} title="Save"><Check size={14} /></button>
              <button className="am-iconbtn" onClick={() => { setVal(song.title); setEditing(false) }} title="Cancel"><X size={14} /></button>
            </>
          ) : (
            <>
              <button className="am-iconbtn" onClick={() => setEditing(true)} title="Edit title"><Pencil size={14} /></button>
              <button className="am-iconbtn am-iconbtn--danger" onClick={() => onDelete(song.id)} title="Delete"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ==========================================================================
   Comments panel
   ======================================================================== */
function CommentsPanel() {
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const r = await fetch('/api/admin/comments', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed')
      setComments(j.comments || [])
      setStatus('ready')
    } catch (e) { setError(e.message); setStatus('error') }
  }, [])
  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    if (!confirm('Delete this comment?')) return
    const r = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    if (r.ok) setComments((prev) => prev.filter((c) => c.id !== id))
    else alert('Delete failed')
  }

  return (
    <div className="am-panel">
      <h2 className="am-h2">Comments</h2>
      {status === 'loading' && <div className="am-state"><Loader2 size={16} className="am-spin" />Loading…</div>}
      {status === 'error'   && <div className="am-state am-state--error"><AlertCircle size={16} />{error}</div>}
      {status === 'ready' && (
        <table className="am-table">
          <thead>
            <tr><th>Song</th><th>Author</th><th>Body</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id}>
                <td>{c.song_title || <span className="am-dim">(deleted)</span>}</td>
                <td className="am-dim">{c.author || <span className="am-dim">anon</span>}</td>
                <td style={{ maxWidth: 440 }}>{c.body}</td>
                <td className="am-dim">{new Date(c.created_at).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="am-iconbtn am-iconbtn--danger" onClick={() => remove(c.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
              <tr><td colSpan={5} className="am-dim" style={{ textAlign: 'center', padding: 20 }}>No comments.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

/* ==========================================================================
   Analytics panel
   ======================================================================== */
function AnalyticsPanel() {
  const [data, setData]   = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/analytics', { cache: 'no-store' })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || 'Failed')
        setData(j); setStatus('ready')
      } catch (e) { setError(e.message); setStatus('error') }
    })()
  }, [])

  if (status === 'loading') return <div className="am-state"><Loader2 size={16} className="am-spin" />Loading…</div>
  if (status === 'error')   return <div className="am-state am-state--error"><AlertCircle size={16} />{error}</div>

  const rows = data?.rows || []
  const totals = data?.totals || { plays: 0, likes: 0, comments: 0 }

  return (
    <div className="am-panel">
      <h2 className="am-h2">Analytics</h2>

      <div className="am-stats">
        <StatCard label="Total plays"    value={totals.plays} />
        <StatCard label="Total likes"    value={totals.likes} />
        <StatCard label="Total comments" value={totals.comments} />
      </div>

      <table className="am-table" style={{ marginTop: 16 }}>
        <thead><tr><th>Song</th><th>Plays</th><th>Likes</th><th>Comments</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td className="am-dim">{r.plays}</td>
              <td className="am-dim">{r.likes}</td>
              <td className="am-dim">{r.comments}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={4} className="am-dim" style={{ textAlign: 'center', padding: 20 }}>No data yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="am-stat">
      <div className="am-stat__value">{value}</div>
      <div className="am-stat__label">{label}</div>
    </div>
  )
}
