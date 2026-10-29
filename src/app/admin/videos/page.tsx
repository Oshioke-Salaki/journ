import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteButton, LiveSwitch } from "@/features/admin/components/row-actions";
import { adminTopics, adminVideos } from "@/features/admin/queries";
import { formatDuration } from "@/features/content/queries";
import { KIND_LABEL } from "@/features/discover/video-card";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Videos" };

export default function AdminVideosPage() {
  return (
    <>
      <AdminHeader
        title="Videos"
        description="Lessons, practices and coaching sessions in Discover and Community."
        action={
          <Link href="/admin/videos/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Add a video
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-[420px] rounded-[18px]" />}>
        <Videos />
      </Suspense>
    </>
  );
}

async function Videos() {
  await requireAdmin();
  const [videos, topics] = await Promise.all([adminVideos(), adminTopics()]);
  const titles = new Map(topics.map((t) => [t.slug, t.title]));
  return (
    <div className="overflow-hidden rounded-[18px] border border-border">
      <p className="num border-b border-rule px-5 py-3 text-[14px] text-muted">
        {videos.length} videos · {videos.filter((v) => v.is_published).length} live
      </p>
      {videos.length === 0 ? (
        <p className="px-5 py-8 text-[15px] text-muted">No videos yet. Add the first video. You can fill in the details now and add the Mux file later.</p>
      ) : null}
      <ul className="divide-y divide-rule">
        {videos.map((v) => (
          <li key={v.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/videos/${v.id}`} className="block truncate text-[15px] font-medium text-ink hover:underline">
                {v.title}
              </Link>
              <p className="truncate text-[13px] text-muted">
                {KIND_LABEL[v.kind]} · {v.topic_slug ? titles.get(v.topic_slug) : "No topic"} · {formatDuration(v.duration_seconds)} · {v.tier === "premium" ? "Premium" : "Free"}
                {v.mux_playback_id ? "" : " · No video file yet"}
              </p>
            </div>
            <LiveSwitch table="videos" id={v.id} active={v.is_published} label={v.title} />
            <DeleteButton table="videos" id={v.id} label={v.title} />
          </li>
        ))}
      </ul>
    </div>
  );
}
