import { MOODS } from "@/features/check-in/constants";
import { formatDate } from "@/lib/dates";

type Point = { date: string; mood: number | null };

/**
 * Mood over time: one 2px line in the data hue, broken on days without a check-in (a gap is not
 * a zero). Faint gridlines on the five levels, no y-axis line, a handful of date labels.
 */
export function MoodChart({ points }: { points: Point[] }) {
  const W = 640;
  const H = 200;
  const left = 68;
  const right = 12;
  const top = 10;
  const bottom = 28;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const x = (i: number) => left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (mood: number) => top + plotH - ((mood - 1) / 4) * plotH;

  const segments: string[] = [];
  let current = "";
  points.forEach((p, i) => {
    if (p.mood === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? " L" : "M"}${x(i).toFixed(1)} ${y(p.mood).toFixed(1)}`;
  });
  if (current) segments.push(current);

  const labelEvery = Math.max(1, Math.ceil(points.length / 5));
  const xLabels = points.map((p, i) => ({ i, p })).filter(({ i }) => i % labelEvery === 0 || i === points.length - 1);
  const filled = points.filter((p) => p.mood !== null).length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Mood over the last ${points.length} days, ${filled} days with a check-in.`}>
      {MOODS.map((m) => (
        <g key={m.value}>
          <line x1={left} x2={W - right} y1={y(m.value)} y2={y(m.value)} className="stroke-rule" strokeWidth="1" />
          <text x={left - 10} y={y(m.value)} dy="0.35em" textAnchor="end" className="fill-muted text-[12px]">
            {m.label}
          </text>
        </g>
      ))}
      {segments.map((d, i) => (
        <path key={i} d={d} fill="none" className="stroke-accent" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {points.map((p, i) =>
        p.mood === null ? null : <circle key={p.date} cx={x(i)} cy={y(p.mood)} r="3.25" className="fill-accent stroke-surface" strokeWidth="1.5" />,
      )}
      {xLabels.map(({ i, p }) => (
        <text
          key={p.date}
          x={x(i)}
          y={H - 6}
          textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          className="num fill-muted text-[12px]"
        >
          {formatDate(p.date, { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  );
}
