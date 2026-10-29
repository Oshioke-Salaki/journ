/**
 * Geometry for the JournApp landscape. Pure, so the static picture (server) and the live one
 * (client, animated) draw exactly the same shapes. The sun sits higher the better the mood; the
 * hills stand taller the more energy there is.
 */

export type LandscapePalette = {
  sky: string;
  sun: string;
  far: string;
  mid: string;
  near: string;
  front: string;
};

export const palettes = {
  dawn: { sky: "#F3CDAE", sun: "#2F7370", far: "#A9B3E0", mid: "#8592CF", near: "#B5DFCB", front: "#7FA68C" },
  mist: { sky: "#DCE7EE", sun: "#2F7370", far: "#B9C3E6", mid: "#97A3D6", near: "#C4E5D5", front: "#8DB39A" },
  meadow: { sky: "#EEE3CB", sun: "#C9764C", far: "#C7D6B4", mid: "#9DBA93", near: "#B5DFCB", front: "#6F9A7E" },
  rose: { sky: "#F6D5CC", sun: "#9C4F5E", far: "#E4B8B4", mid: "#C997A4", near: "#F3CDAE", front: "#B0848F" },
  dusk: { sky: "#C8CBE8", sun: "#F3CDAE", far: "#9AA3D8", mid: "#7480C2", near: "#A0BFD0", front: "#5E7FA0" },
  sand: { sky: "#EFE7DA", sun: "#2F7370", far: "#E0CDB0", mid: "#C8AE8C", near: "#B5DFCB", front: "#7FA68C" },
  /** Low light, for a low mood. Still warm, never grey. */
  hush: { sky: "#E3DED6", sun: "#5C6E6C", far: "#C4C6D6", mid: "#A7AAC3", near: "#C9D9CF", front: "#93AA99" },
} satisfies Record<string, LandscapePalette>;

export type PaletteName = keyof typeof palettes;

export function paletteFor(mood: number, palette?: PaletteName | LandscapePalette): LandscapePalette {
  if (typeof palette === "object") return palette;
  return palettes[palette ?? (Math.round(mood) <= 2 ? "hush" : "dawn")];
}

export function landscapeGeometry(mood: number, energy: number, seed: number) {
  const m = clamp(mood, 1, 5);
  const e = clamp(energy, 1, 5);
  const r = rand(seed);

  const sunX = 60 + r() * 40;
  const sunY = 60 - (m - 1) * 9.5;
  const lift = (e - 3) * 5;
  const j1 = r() * 10;
  const j2 = r() * 10;
  const j3 = r() * 10;
  const j4 = r() * 8;

  return {
    sunX,
    sunY,
    far: path([0, 66 - lift, 30 + j1, 48 - lift, 70, 60 - lift, 110 + j2, 42 - lift, 160, 58 - lift, 160, 100, 0, 100]),
    mid: path([20, 100, 70 + j3, 62 - lift * 0.8, 120, 100]),
    near: path([0, 72 - lift * 0.6, 55, 68 - lift * 0.6, 95, 100, 0, 100]),
    front: path([60, 100, 112 + j4, 64 - lift * 0.7, 160, 80 - lift * 0.5, 160, 100]),
  };
}

function path(points: number[]) {
  let d = `M${round(points[0])} ${round(points[1])}`;
  for (let i = 2; i < points.length; i += 2) d += ` L${round(points[i])} ${round(points[i + 1])}`;
  return `${d} Z`;
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** mulberry32: a seed always draws the same picture. */
function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable number from a string, for seeding pictures from ids. */
export function seedFrom(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
