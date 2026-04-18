'use client'

import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Loader2, AlertCircle, Send, Inbox } from 'lucide-react'
import { getSessionId } from '../lib/sessionId'
import { usePlayer } from '../lib/playerContext'

const COMMENT_MAX = 250
const AUTHOR_MAX = 40

const timeAgo = (iso) => {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (!isFinite(t)) return ''
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const CommentsSection = () => {
  const { currentSong } = usePlayer()
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [postErr, setPostErr] = useState(null)

  const load = useCallback(async (songId) => {
    if (!songId) return
    setStatus('loading')
    try {
      const r = await fetch(`/api/comments?song_id=${songId}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed')
      setComments(j.comments || [])
      setStatus('ready')
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (currentSong?.id) load(currentSong.id)
    else { setComments([]); setStatus('idle') }
  }, [currentSong?.id, load])

  const submit = async (e) => {
    e.preventDefault()
    if (!currentSong?.id) return
    const text = body.trim()
    if (!text) { setPostErr('Say something first.'); return }
    if (text.length > COMMENT_MAX) { setPostErr(`Max ${COMMENT_MAX} chars.`); return }

    setBusy(true); setPostErr(null)
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: currentSong.id,
          session_id: getSessionId(),
          author: author.trim() || null,
          body: text,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        if (r.status === 429) throw new Error(`Slow down — try again in ${j.retry_after_seconds || 60}s`)
        throw new Error(j?.error || 'Failed')
      }
      setComments((prev) => [j.comment, ...prev])
      setBody('')
    } catch (e) {
      setPostErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!currentSong) return null

  return (
    <section className="am-section am-comments">
      <div className="am-section__header">
        <h2 className="am-h2">
          <MessageSquare size={16} style={{ verticalAlign: '-3px', marginRight: 8 }} />
          Comments on “{currentSong.title}”
        </h2>
        <span className="am-section__see-all am-dim">{comments.length} total</span>
      </div>

      <form className="am-comment-form" onSubmit={submit}>
        <input
          className="am-input am-input--sm"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={AUTHOR_MAX}
        />
        <textarea
          className="am-textarea"
          placeholder="Say something nice…"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, COMMENT_MAX))}
          rows={2}
          maxLength={COMMENT_MAX}
        />
        <div className="am-comment-footer">
          <span className={`am-dim ${body.length >= COMMENT_MAX ? 'am-warn' : ''}`}>
            {body.length}/{COMMENT_MAX}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {postErr && <span className="am-warn" style={{ fontSize: 12 }}>{postErr}</span>}
            <button type="submit" className="am-btn am-btn--primary" disabled={busy || !body.trim()}>
              {busy ? <Loader2 size={14} className="am-spin" /> : <><Send size={13} /> Post</>}
            </button>
          </div>
        </div>
      </form>

      {status === 'loading' && (
        <div className="am-state"><Loader2 size={16} className="am-spin" />Loading comments…</div>
      )}
      {status === 'error' && (
        <div className="am-state am-state--error"><AlertCircle size={16} />{error}</div>
      )}
      {status === 'ready' && comments.length === 0 && (
        <div className="am-state am-state--empty">
          <Inbox size={16} />
          <span>Be the first to comment.</span>
        </div>
      )}
      {status === 'ready' && comments.length > 0 && (
        <ul className="am-comment-list">
          {comments.map((c) => (
            <li key={c.id} className="am-comment">
              <div className="am-comment__meta">
                <span className="am-comment__author">{c.author || 'anon'}</span>
                <span className="am-dim">· {timeAgo(c.created_at)}</span>
              </div>
              <div className="am-comment__body">{c.body}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CommentsSection
