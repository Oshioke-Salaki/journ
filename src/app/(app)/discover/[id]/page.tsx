import { ArrowLeft, Lock, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, getTopic, getVideo, getVideos } from "@/features/content/queries";
import { KIND_LABEL, VideoCard } from "@/features/discover/video-card";
import { VideoPoster } from "@/features/discover/video-poster";
import { getProfile } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage({ params }: PageProps<"/discover/[id]">) {
  return (
    <PageContainer>
      <Link href={routes.discover} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        Discover
      </Link>
      <Suspense fallback={<VideoSkeleton />}>
        <VideoDetail params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function VideoDetail({ params }: Pick<PageProps<"/discover/[id]">, "params">) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();
  const [topic, all, profile] = await Promise.all([
    video.topic_slug ? getTopic(video.topic_slug) : Promise.resolve(null),
    getVideos(),
    getProfile(),
  ]);
  const locked = video.tier === "premium" && profile?.plan !== "premium";
  const related = all.filter((v) => v.id !== video.id && v.topic_slug === video.topic_slug).slice(0, 3);
  const duration = formatDuration(video.duration_seconds);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-6 lg:col-span-8">
        {video.mux_playback_id && !locked ? (
          <div className="aspect-video overflow-hidden rounded-[20px] bg-black">
            <iframe
              src={`https://player.mux.com/${video.mux_playback_id}?metadata-video-title=${encodeURIComponent(video.title)}&accent-color=%232c7a72`}
              title={video.title}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : (
          <div className="relative">
            <VideoPoster id={video.id} topic={video.topic_slug} duration={duration} premium={video.tier === "premium"} size="lg" className="rounded-[20px]" />
            <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-auto sm:left-3 sm:max-w-sm">
              <p className="rounded-[14px] bg-surface px-4 py-3 text-[14px] text-ink shadow-[var(--shadow-float)]" role="status">
                {locked ? (
                  <>
                    <Lock className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden />
                    Part of JournApp Premium, coming soon.
                  </>
                ) : (
                  "This video is being recorded. It will play here as soon as it's ready."
                )}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <p className="num text-[14px] text-muted">
            {KIND_LABEL[video.kind]} · {duration}
            {topic ? (
              <>
                {" · "}
                <Link href={routes.topic(topic.slug)} className="font-medium text-accent-ink hover:underline">
                  {topic.title}
                </Link>
              </>
            ) : null}
          </p>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">{video.title}</h1>
          <p className="max-w-[62ch] text-[17px] leading-relaxed text-ink">{video.description}</p>
          <div className="mt-3">
            <Link href={routes.newJournalEntry} className={buttonVariants({ variant: "secondary" })}>
              <PenLine aria-hidden />
              Write about what you noticed
            </Link>
          </div>
        </div>
      </div>
      <aside className="flex flex-col gap-5 lg:col-span-4" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-[17px] font-semibold text-ink">
          {topic ? `More on ${topic.title.toLowerCase()}` : "More to explore"}
        </h2>
        {related.length ? (
          <ul className="flex flex-col gap-6">
            {related.map((v) => (
              <li key={v.id}>
                <VideoCard video={v} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">More videos on this topic are on the way.</p>
        )}
      </aside>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <Skeleton className="aspect-video rounded-[20px]" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="flex flex-col gap-5 lg:col-span-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="aspect-video rounded-[18px]" />
      </div>
    </div>
  );
}
