import { useId } from "react";
import { cn } from "@/lib/cn";
import { landscapeGeometry, paletteFor, type LandscapePalette, type PaletteName } from "./landscape-geometry";

export { palettes, seedFrom, type PaletteName } from "./landscape-geometry";

export type LandscapeProps = {
  /** 1-5. Sun height. */
  mood?: number;
  /** 1-5. Hill height. */
  energy?: number;
  palette?: PaletteName | LandscapePalette;
  /** Varies the ridge lines so two pictures with the same values still differ. */
  seed?: number;
  className?: string;
  title?: string;
  radius?: number;
};

/** A small landscape in the language of the JournApp mark. Static; see LiveLandscape for motion. */
export function Landscape({ mood = 4, energy = 3, palette, seed = 0, className, title, radius = 10 }: LandscapeProps) {
  const clip = useId();
  const p = paletteFor(mood, palette);
  const g = landscapeGeometry(mood, energy, seed);

  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="160" height="100" rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="160" height="100" fill={p.sky} />
        <circle cx={g.sunX} cy={g.sunY} r="8" fill={p.sun} />
        <path d={g.far} fill={p.far} />
        <path d={g.mid} fill={p.mid} />
        <path d={g.near} fill={p.near} />
        <path d={g.front} fill={p.front} />
      </g>
    </svg>
  );
}
