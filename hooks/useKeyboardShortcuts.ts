'use client';
import { useEffect } from 'react';
import { usePlayer } from '@/lib/player-store';
import { seekAudio } from '@/components/AudioController';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const p = usePlayer.getState();
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          p.toggle();
          break;
        case 'ArrowRight':
          if (e.shiftKey) p.next();
          else seekAudio(p.position + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey) p.previous();
          else seekAudio(Math.max(0, p.position - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          p.setVolume(Math.min(1, p.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          p.setVolume(Math.max(0, p.volume - 0.05));
          break;
        case 'KeyM':
          p.toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
