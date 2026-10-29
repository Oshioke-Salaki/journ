import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { Mark, Wordmark } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { getTopics } from "@/features/content/queries";
import { topicPalette } from "@/features/discover/video-poster";
import { DeletedNotice } from "@/features/marketing/deleted-notice";
import { CheckInFragment, GoalFragment, JournalFragment } from "@/features/marketing/fragments";
import { IntroVideo } from "@/features/marketing/intro-video";
import { TryCheckIn } from "@/features/marketing/try-check-in";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const HABITS = [
  {
    id: "check-in",
    title: "Check in with yourself",
    body: "Your mood, where you feel it in your body, your energy and how you see yourself today. It takes a minute, and over the weeks the pattern becomes clear.",
    fragment: <CheckInFragment />,
  },
  {
    id: "write",
    title: "Write it down",
    body: "Write freely, or start from a prompt chosen for the day. Your words stay on your device as you type, so nothing is lost.",
    fragment: <JournalFragment />,
  },
  {
    id: "goals",
    title: "Take the next small step",
    body: "Set a goal within your control, break it into steps and tick them off. If you ask for it, Today reminds you of the next one.",
    fragment: <GoalFragment />,
  },
];

const PROMISES = [
  { title: "Only you can read it", body: "Your journal and check-ins are private to your account and protected at the database level." },
  { title: "Never sold, no ads", body: "JournApp makes money from optional premium content and coaching, never from your data." },
  { title: "Yours to take or erase", body: "Download everything you have stored, or delete your account and all of it, from Settings." },
  { title: "Nudges only when asked", body: "Prompts and reminders are off until you switch them on." },
];

export default function WelcomePage() {
  return (
    <div className="bg-ground">
      <Suspense>
        <DeletedNotice />
      </Suspense>

      <header className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-4 pt-safe sm:px-8">
        <Link href={routes.home} aria-label="JournApp home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-full px-4 py-2 text-[15px] text-muted hover:text-ink md:block">
            How it works
          </a>
          <a href="#topics" className="hidden rounded-full px-4 py-2 text-[15px] text-muted hover:text-ink md:block">
            Topics
          </a>
          <a href="#privacy" className="hidden rounded-full px-4 py-2 text-[15px] text-muted hover:text-ink md:block">
            Privacy
          </a>
          <Link href={routes.signIn} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href={routes.signUp} className={buttonVariants({ size: "sm" })}>
            Start free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pt-10 pb-24 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-36">
          <div className="flex flex-col gap-8 lg:col-span-6">
            <h1 className="max-w-[12ch] font-serif text-[52px] leading-[0.98] tracking-[-0.025em] text-ink sm:text-[72px] lg:text-[84px]">
              Notice what you can control.
            </h1>
            <p className="max-w-[46ch] text-[19px] leading-relaxed text-ink sm:text-[20px]">
              JournApp is a daily journal for your mood, body and energy. Check in, write, and move towards your goals one small step
              at a time.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={routes.signUp} className={buttonVariants({ size: "lg" })}>
                Start your journal
              </Link>
              <IntroVideo />
            </div>
          </div>
          <div className="lg:col-span-6 lg:pl-6">
            <TryCheckIn />
          </div>
        </section>

        <section id="how" aria-labelledby="how-heading" className="bg-sand py-24 lg:py-36">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
            <h2 id="how-heading" className="max-w-[18ch] font-serif text-balance text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
              A few minutes a day, for you.
            </h2>
            <div className="mt-16 flex flex-col gap-20 lg:mt-24 lg:gap-28">
              {HABITS.map((h, i) => (
                <article key={h.id} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
                  <div className={cn("flex flex-col gap-4 lg:col-span-5", i % 2 === 1 && "lg:order-2 lg:col-start-8")}>
                    <h3 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">{h.title}</h3>
                    <p className="max-w-[44ch] text-[18px] leading-relaxed text-ink">{h.body}</p>
                  </div>
                  <div className={cn("lg:col-span-6", i % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7")}>
                    <div className="mx-auto max-w-[480px]">{h.fragment}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="topics" aria-labelledby="topics-heading" className="mx-auto max-w-[1240px] px-4 py-24 sm:px-8 lg:py-36">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="topics-heading" className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-balance text-ink sm:text-[56px] lg:col-span-6">
              Learn from people who know.
            </h2>
            <p className="max-w-[46ch] self-end text-[18px] leading-relaxed text-ink lg:col-span-5 lg:col-start-8">
              Short lessons, guided practices and recorded coaching sessions across six areas of wellbeing.
            </p>
          </div>
          <Suspense fallback={<div className="mt-14 h-[420px]" />}>
            <TopicList />
          </Suspense>
        </section>

        <section id="privacy" aria-labelledby="privacy-heading" className="bg-primary py-24 text-on-primary lg:py-36">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-4 sm:px-8 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <h2 id="privacy-heading" className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
                Your journal is yours.
              </h2>
              <p className="max-w-[40ch] text-[18px] leading-relaxed opacity-90">
                What you write about your mood, your body and your life deserves more care than most apps give it.
              </p>
            </div>
            <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
              {PROMISES.map((p) => (
                <div key={p.title} className="flex flex-col gap-2">
                  <dt className="text-[19px] font-semibold">{p.title}</dt>
                  <dd className="text-[16px] leading-relaxed opacity-85">{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="start-heading" className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-24 sm:px-8 lg:grid-cols-12 lg:py-36">
          <div className="flex flex-col items-start gap-8 lg:col-span-6">
            <h2 id="start-heading" className="max-w-[14ch] font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
              Start with how you feel today.
            </h2>
            <Link href={routes.signUp} className={buttonVariants({ size: "lg" })}>
              Create your free account
              <ArrowRight aria-hidden />
            </Link>
          </div>
          <Landscape mood={5} energy={4} seed={42} radius={0} className="aspect-[16/9] overflow-hidden rounded-[28px] lg:col-span-6" />
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-4 pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8">
          <div className="flex items-center gap-4">
            <Mark className="size-14 sm:size-20" title={null} />
            <p className="text-[48px] leading-none font-semibold tracking-[-0.03em] text-ink sm:text-[88px]">JournApp</p>
          </div>
          <div className="flex flex-col gap-4 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 JournApp. JournApp supports reflection and wellbeing; it is not medical advice.</p>
            <nav aria-label="Legal" className="flex gap-6">
              <Link href={routes.privacy} className="hover:text-ink">
                Privacy
              </Link>
              <Link href={routes.terms} className="hover:text-ink">
                Terms
              </Link>
              <Link href={routes.signIn} className="hover:text-ink">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

async function TopicList() {
  const topics = await getTopics();
  return (
    <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
      {topics.map((t) => (
        <li key={t.slug} className="flex flex-col gap-4">
          <Landscape palette={topicPalette(t.slug)} seed={seedFrom(t.slug)} mood={4} energy={3} radius={0} className="aspect-[16/9] overflow-hidden rounded-[22px]" />
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-ink">{t.title}</h3>
            <p className="text-[16px] leading-relaxed text-ink/80">{t.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
