import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { getPrompts, getTopics, getVideos } from "@/features/content/queries";
import { topicPalette } from "@/features/discover/video-poster";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <PageContainer>
      <PageHeader title="Community" description="Six areas of wellbeing, each with lessons, practices and prompts from people who know them well." />
      <Suspense fallback={<TopicsSkeleton />}>
        <Topics />
      </Suspense>
    </PageContainer>
  );
}

async function Topics() {
  const [topics, videos, prompts] = await Promise.all([getTopics(), getVideos(), getPrompts()]);
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic) => {
        const v = videos.filter((x) => x.topic_slug === topic.slug).length;
        const p = prompts.filter((x) => x.topic_slug === topic.slug).length;
        return (
          <li key={topic.slug}>
            <Link
              href={routes.topic(topic.slug)}
              className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] bg-raised transition-colors hover:bg-active active:scale-[0.995]"
            >
              <Landscape palette={topicPalette(topic.slug)} seed={seedFrom(topic.slug)} mood={4} energy={3} radius={0} className="aspect-[16/7]" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{topic.title}</h2>
                <p className="line-clamp-3 text-[15px] text-muted">{topic.summary}</p>
                <p className="num mt-auto pt-3 text-[14px] text-ink">
                  {v === 1 ? "1 video" : `${v} videos`} · {p === 1 ? "1 prompt" : `${p} prompts`}
                  {topic.is_mature ? <span className="text-muted"> · 18+</span> : null}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TopicsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-[var(--radius-panel)]" />
      ))}
    </div>
  );
}
