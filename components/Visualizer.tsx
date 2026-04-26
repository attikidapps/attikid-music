'use client';
import { useEffect, useRef } from 'react';
import { getAudioElement } from './AudioController';

let audioGraph: { ctx: AudioContext; analyser: AnalyserNode; data: Uint8Array } | null = null;

function ensureGraph() {
  if (audioGraph) return audioGraph;
  const audio = getAudioElement();
  if (!audio) return null;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  const data = new Uint8Array(analyser.frequencyBinCount);
  audioGraph = { ctx, analyser, data };
  return audioGraph;
}

export function Visualizer({ height = 80, style = 'bars' }: { height?: number; style?: 'bars' | 'wave' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const audio = getAudioElement();
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const onPlay = () => {
      const g = ensureGraph();
      if (!g) return;
      if (g.ctx.state === 'suspended') g.ctx.resume();
      loop();
    };

    const loop = () => {
      const g = audioGraph;
      const c = canvasRef.current;
      if (!g || !c) return;

      g.analyser.getByteFrequencyData(g.data);

      const dpr = window.devicePixelRatio || 1;
      const w = (c.width = c.clientWidth * dpr);
      const h = (c.height = c.clientHeight * dpr);
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);

      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--track-color').trim() || '#1db954';

      if (style === 'bars') {
        const N = g.data.length;
        const bw = w / N;
        ctx.fillStyle = color;
        for (let i = 0; i < N; i++) {
          const bh = (g.data[i] / 255) * h;
          ctx.fillRect(i * bw, h - bh, bw - 1 * dpr, bh);
        }
      } else {
        // simple mirrored waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        const N = g.data.length;
        for (let i = 0; i < N; i++) {
          const x = (i / N) * w;
          const y = h / 2 - ((g.data[i] / 255) * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    audio.addEventListener('play', onPlay);
    if (!audio.paused) onPlay(); // already playing on mount

    return () => {
      audio.removeEventListener('play', onPlay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [style]);

  return <canvas ref={canvasRef} style={{ width: '100%', height, display: 'block' }} />;
        }
