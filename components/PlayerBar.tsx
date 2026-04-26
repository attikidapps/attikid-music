'use client';
import { usePlayer } from '@/lib/player-store';
import { seekAudio } from './AudioController';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX,
} from 'lucide-react';

const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
};

export function PlayerBar() {
  const p = usePlayer();
  if (!p.current) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur border-t border-white/5 px-4 py-3 grid grid-cols-3 items-center">
      {/* Track info */}
      <div className="flex items-center gap-3 min-w-0">
        {p.current.cover_url && (
          <img src={p.current.cover_url} className="w-12 h-12 rounded" alt="" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm">{p.current.title}</div>
          <div className="truncate text-xs text-white/60">{p.current.artist}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button onClick={p.toggleShuffle} className={p.shuffle ? 'text-[var(--track-color)]' : 'text-white/60'}>
            <Shuffle size={16} />
          </button>
          <button onClick={p.previous}><SkipBack size={20} /></button>
          <button
            onClick={p.toggle}
            className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center"
          >
            {p.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={p.next}><SkipForward size={20} /></button>
          <button
            onClick={p.cycleRepeat}
            className={p.repeat !== 'off' ? 'text-[var(--track-color)]' : 'text-white/60'}
          >
            {p.repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-2 w-full max-w-md text-xs text-white/60">
          <span>{fmt(p.position)}</span>
          <input
            type="range"
            min={0}
            max={p.duration || 0}
            step={0.1}
            value={p.position}
            onChange={(e) => seekAudio(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--track-color)]"
          />
          <span>{fmt(p.duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 justify-end">
        <button onClick={p.toggleMute}>
          {p.muted || p.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={p.muted ? 0 : p.volume}
          onChange={(e) => p.setVolume(parseFloat(e.target.value))}
          className="w-24 accent-[var(--track-color)]"
        />
      </div>
    </div>
  );
      }
