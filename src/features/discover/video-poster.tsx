import { Lock, Play } from "lucide-react";
import { Landscape, seedFrom, type PaletteName } from "@/components/brand/landscape";
import { cn } from "@/lib/cn";

const TOPIC_PALETTE: Record<string, PaletteName> = {
  breathing: "mist",
  nutrition: "meadow",
  "womens-health": "rose",
  movement: "sand",
  sexuality: "dusk",
  coaching: "dawn",
};

export function topicPalette(slug: string | null): PaletteName {
  return (slug && TOPIC_PALETTE[slug]) || "dawn";
}

/** Drawn cover art for a video, until real thumbnails exist. Same id, same picture. */
export function VideoPoster({
  id,
  topic,
  duration,
  premium,
  size = "md",
  className,
}: {
  id: string;
  topic: string | null;
  duration: string;
  premium: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const seed = seedFrom(id);
  return (
    <div className={cn("relative overflow-hidden rounded-[18px]", className)}>
      <Landscape mood={3 + (seed % 3)} energy={2 + (seed % 4)} palette={topicPalette(topic)} seed={seed} radius={0} className="aspect-video" />
      <span
        className={cn(
          "absolute grid place-items-center rounded-full bg-white/90 text-[#15302e] transition-transform duration-200 group-hover:scale-105",
          size === "lg" ? "top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2" : "bottom-3 left-3 size-10",
        )}
        aria-hidden
      >
        <Play className={cn("translate-x-px fill-current", size === "lg" ? "size-6" : "size-4")} />
      </span>
      <span className="num absolute right-3 bottom-3 rounded-full bg-[#15302e]/75 px-2.5 py-1 text-[12px] font-medium text-white">{duration}</span>
      {premium ? (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-medium text-[#15302e]">
          <Lock className="size-3" aria-hidden />
          Premium
        </span>
      ) : null}
    </div>
  );
}
