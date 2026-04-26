'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrackRowSkeleton } from '@/components/skeletons';
import { usePlayer, type Track } from '@/lib/player-store';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ tracks: Track[]; artists: any[]; albums: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const play = usePlayer((s) => s.play);

  useEffect(() => {
    if (!q) { setData(null); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setData(await res.json());
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  return (
    <div className="p-6 max-w-5xl">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Songs, artists, albums…"
        className="w-full bg-white/5 rounded-full px-5 py-3 outline-none focus:bg-white/10"
      />

      {loading && (
        <div className="mt-8 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <TrackRowSkeleton key={i} />)}
        </div>
      )}

      {data && !loading && (
        <div className="mt-8 space-y-10">
          {data.artists.length > 0 && (
            <section>
              <h2 className="text-sm uppercase tracking-wider text-white/60 mb-3">Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.artists.map((a) => (
                  <Link key={a.id} href={`/artist/${a.id}`} className="text-center">
                    <img src={a.image_url} className="rounded-full aspect-square object-cover" />
                    <div className="mt-2 text-sm">{a.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.tracks.length > 0 && (
            <section>
              <h2 className="text-sm uppercase tracking-wider text-white/60 mb-3">Songs</h2>
              <ul>
                {data.tracks.map((t, i) => (
                  <li
                    key={t.id}
                    onClick={() => play(t, data.tracks.slice(i + 1))}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer"
                  >
                    {t.cover_url && <img src={t.cover_url} className="w-10 h-10 rounded" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{t.title}</div>
                      <div className="truncate text-xs text-white/60">{t.artist}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
                    }
