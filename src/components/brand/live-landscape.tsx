"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { landscapeGeometry, paletteFor } from "./landscape-geometry";
import type { LandscapeProps } from "./landscape";

/** The landscape, animating as mood and energy change: the sun rises, the hills lift, the light warms. */
export function LiveLandscape({ mood = 3, energy = 3, palette, seed = 0, className, title, radius = 10 }: LandscapeProps) {
  const clip = useId();
  const reduce = useReducedMotion();
  const p = paletteFor(mood, palette);
  const g = landscapeGeometry(mood, energy, seed);
  const t = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.9 };
  const c = reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

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
        <motion.rect width="160" height="100" initial={false} animate={{ fill: p.sky }} transition={c} />
        <motion.circle r="8" initial={false} animate={{ cx: g.sunX, cy: g.sunY, fill: p.sun }} transition={t} />
        <motion.path initial={false} animate={{ d: g.far, fill: p.far }} transition={t} />
        <motion.path initial={false} animate={{ d: g.mid, fill: p.mid }} transition={t} />
        <motion.path initial={false} animate={{ d: g.near, fill: p.near }} transition={t} />
        <motion.path initial={false} animate={{ d: g.front, fill: p.front }} transition={t} />
      </g>
    </svg>
  );
}
