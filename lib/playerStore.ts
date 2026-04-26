import { create } from 'zustand';

export type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover_url?: string;
  duration?: number;
};

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  current: Track | null;
  queue: Track[];
  history: Track[];
  position: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  setPosition: (p: number) => void;
  setDuration: (d: number) => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  history: [],
  position: 0,
  duration: 0,
  isPlaying: false,
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: 'off',

  play: (track, queue = []) =>
    set({ current: track, queue, position: 0, isPlaying: true }),

  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, current, history, repeat, shuffle } = get();
    if (repeat === 'one' && current) {
      set({ position: 0 });
      return;
    }
    if (queue.length === 0) {
      if (repeat === 'all' && history.length && current) {
        const replay = [...history, current];
        set({ current: replay[0], queue: replay.slice(1), history: [], position: 0 });
      } else {
        set({ isPlaying: false, position: 0 });
      }
      return;
    }
    const nextTrack = shuffle
      ? queue[Math.floor(Math.random() * queue.length)]
      : queue[0];
    set({
      current: nextTrack,
      queue: queue.filter((t) => t.id !== nextTrack.id),
      history: current ? [...history, current] : history,
      position: 0,
    });
  },

  previous: () => {
    const { history, current, queue, position } = get();
    if (position > 3 || history.length === 0) {
      set({ position: 0 });
      return;
    }
    const prev = history[history.length - 1];
    set({
      current: prev,
      history: history.slice(0, -1),
      queue: current ? [current, ...queue] : queue,
      position: 0,
    });
  },

  setVolume: (volume) => set({ volume, muted: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
}));    })),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
}));
