import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopics, getVideos } from "@/features/content/queries";
import { VideoCard } from "@/features/discover/video-card";
import { VideoLibrary } from "@/features/discover/video-library";

export const metadata: Metadata = { title: "Discover" };

export default function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  return (
    <PageContainer>
      <PageHeader title="Discover" description="Short lessons, practices and recorded coaching sessions, for whatever today needs." />
      <Suspense fallback={<LibrarySkeleton />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Library({ searchParams }: Pick<PageProps<"/discover">, "searchParams">) {
  const [videos, topics, params] = await Promise.all([getVideos(), getTopics(), searchParams]);
  const titles = new Map(topics.map((t) => [t.slug, t.title]));
  const initialTopic = typeof params.topic === "string" && titles.has(params.topic) ? params.topic : null;

  return (
    <VideoLibrary
      initialTopic={initialTopic}
      topics={topics.map((t) => ({ slug: t.slug, title: t.title }))}
      items={videos.map((v) => ({
        id: v.id,
        topic: v.topic_slug,
        node: <VideoCard video={v} topicTitle={v.topic_slug ? titles.get(v.topic_slug) : undefined} />,
      }))}
    />
  );
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-video rounded-[18px]" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
