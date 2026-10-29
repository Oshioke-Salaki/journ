import Link from "next/link";
import { formatDuration, type Video } from "@/features/content/queries";
import { routes } from "@/lib/routes";
import { VideoPoster } from "./video-poster";

export const KIND_LABEL = { lesson: "Lesson", practice: "Practice", coaching_session: "Coaching session" } as const;

export function VideoCard({ video, topicTitle }: { video: Video; topicTitle?: string }) {
  return (
    <Link href={routes.video(video.id)} className="group flex flex-col gap-3 rounded-[20px] outline-offset-4 active:scale-[0.99]">
      <VideoPoster id={video.id} topic={video.topic_slug} duration={formatDuration(video.duration_seconds)} premium={video.tier === "premium"} />
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-[16px] leading-snug font-medium text-ink group-hover:underline group-hover:decoration-control group-hover:underline-offset-4">
          {video.title}
        </p>
        <p className="text-[14px] text-muted">
          {KIND_LABEL[video.kind]}
          {topicTitle ? ` · ${topicTitle}` : ""}
        </p>
      </div>
    </Link>
  );
}
