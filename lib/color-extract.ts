export type RGB = { r: number; g: number; b: number };

export async function extractDominantColor(imageUrl: string): Promise<RGB> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 50; // tiny — we just need average vibrant color
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let r = 0, g = 0, b = 0, count = 0;
      // Pass 1: prefer saturated, mid-luma pixels
      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
        const sat = max === 0 ? 0 : (max - min) / max;
        if (sat > 0.25 && max > 50 && max < 240) {
          r += pr; g += pg; b += pb; count++;
        }
      }
      // Fallback to plain average if nothing is vibrant
      if (count === 0) {
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
      }
      resolve({ r: (r / count) | 0, g: (g / count) | 0, b: (b / count) | 0 });
    };
    img.onerror = () => reject(new Error('image load'));
    img.src = imageUrl;
  });
}

export function applyTrackColor({ r, g, b }: RGB) {
  const root = document.documentElement;
  root.style.setProperty('--track-color', `rgb(${r} ${g} ${b})`);
  root.style.setProperty('--track-color-soft', `rgba(${r}, ${g}, ${b}, 0.3)`);
                                        }
