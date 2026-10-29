import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoForm } from "@/features/admin/components/video-form";
import { adminTopics, adminVideo } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../../admin-header";

export const metadata: Metadata = { title: "Edit video" };

export default function EditVideoPage({ params }: PageProps<"/admin/videos/[id]">) {
  return (
    <>
      <AdminHeader title="Edit video" />
      <Suspense fallback={<Skeleton className="h-[600px] max-w-[720px] rounded-[18px]" />}>
        <EditVideo params={params} />
      </Suspense>
    </>
  );
}

async function EditVideo({ params }: Pick<PageProps<"/admin/videos/[id]">, "params">) {
  const [{ id }] = await Promise.all([params, requireAdmin()]);
  const [video, topics] = await Promise.all([/^[0-9a-f-]{36}$/i.test(id) ? adminVideo(id) : null, adminTopics()]);
  if (!video) notFound();
  return (
    <VideoForm
      id={video.id}
      topics={topics}
      defaults={{
        title: video.title,
        description: video.description,
        topicSlug: video.topic_slug ?? "",
        kind: video.kind,
        tier: video.tier,
        durationMinutes: Math.round(video.duration_seconds / 60),
        hostName: video.host_name ?? "",
        muxPlaybackId: video.mux_playback_id ?? "",
        isPublished: video.is_published,
      }}
    />
  );
}
