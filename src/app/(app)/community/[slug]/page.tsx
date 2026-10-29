import { ArrowLeft, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatureGate } from "@/features/community/mature-gate";
import { getPrompts, getTopic, getVideos } from "@/features/content/queries";
import { VideoCard } from "@/features/discover/video-card";
import { topicPalette } from "@/features/discover/video-poster";
import { getProfile } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Community" };

export default function TopicPage({ params }: PageProps<"/community/[slug]">) {
  return (
    <PageContainer>
      <Link href={routes.community} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        Community
      </Link>
      <Suspense fallback={<TopicSkeleton />}>
        <Topic params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Topic({ params }: Pick<PageProps<"/community/[slug]">, "params">) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();
  const [videos, prompts, profile] = await Promise.all([getVideos(), getPrompts(), getProfile()]);
  const gated = topic.is_mature && !profile?.mature_content_confirmed_at;
  const topicVideos = videos.filter((v) => v.topic_slug === topic.slug);
  const topicPrompts = prompts.filter((p) => p.topic_slug === topic.slug);

  return (
    <div className="flex flex-col gap-12">
      <header className="grid items-end gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-7">
          <h1 className="text-[32px] leading-[1.08] font-semibold tracking-[-0.025em] text-ink sm:text-[40px]">{topic.title}</h1>
          <p className="max-w-[56ch] text-[17px] leading-relaxed text-muted">{topic.summary}</p>
        </div>
        <Landscape palette={topicPalette(topic.slug)} seed={seedFrom(topic.slug)} mood={4} energy={3} radius={0} className="aspect-[16/7] overflow-hidden rounded-[var(--radius-panel)] lg:col-span-5" />
      </header>

      {gated ? (
        <MatureGate topic={topic.title} />
      ) : (
        <>
          {topic.slug === "coaching" ? (
            <section aria-labelledby="coach-heading" className="flex flex-col gap-2 rounded-[var(--radius-panel)] bg-sand p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div>
                <h2 id="coach-heading" className="text-[18px] font-semibold text-ink">
                  Work with a coach
                </h2>
                <p className="mt-1 max-w-[60ch] text-[15px] text-muted">
                  One-to-one sessions with JournApp coaches are opening soon. Until then, the recorded sessions below are free to watch.
                </p>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="videos-heading" className="flex flex-col gap-5">
            <h2 id="videos-heading" className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              Watch
            </h2>
            {topicVideos.length ? (
              <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {topicVideos.map((v) => (
                  <li key={v.id}>
                    <VideoCard video={v} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">Videos for this topic are on the way.</p>
            )}
          </section>

          <section aria-labelledby="prompts-heading" className="flex flex-col gap-5">
            <h2 id="prompts-heading" className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              Reflect
            </h2>
            {topicPrompts.length ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {topicPrompts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${routes.newJournalEntry}?prompt=${p.id}`}
                      className="group flex h-full items-start justify-between gap-4 rounded-[20px] bg-raised p-5 transition-colors hover:bg-active"
                    >
                      <p className="font-serif text-[19px] leading-snug text-ink">{p.body}</p>
                      <PenLine className="mt-1 size-[18px] shrink-0 text-faint group-hover:text-ink" aria-label="Write about this" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">Prompts for this topic are on the way.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TopicSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <div className="grid items-end gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-7">
          <Skeleton className="h-11 w-1/2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="aspect-[16/7] rounded-[var(--radius-panel)] lg:col-span-5" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-video rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
