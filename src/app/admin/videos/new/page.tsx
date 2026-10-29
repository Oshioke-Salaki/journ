import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoForm } from "@/features/admin/components/video-form";
import { adminTopics } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../../admin-header";

export const metadata: Metadata = { title: "Add a video" };

export default function NewVideoPage() {
  return (
    <>
      <AdminHeader title="Add a video" description="Upload the file to Mux first, then paste its playback ID here. You can also add the details now and the file later." />
      <Suspense fallback={<Skeleton className="h-[600px] max-w-[720px] rounded-[18px]" />}>
        <NewVideo />
      </Suspense>
    </>
  );
}

async function NewVideo() {
  await requireAdmin();
  const topics = await adminTopics();
  return (
    <VideoForm
      topics={topics}
      defaults={{ title: "", description: "", topicSlug: "", kind: "lesson", tier: "free", durationMinutes: 10, hostName: "", muxPlaybackId: "", isPublished: false }}
    />
  );
}
