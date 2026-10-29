import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminPrompts, adminQuotes, adminVideos, getAdminStats } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { AdminHeader } from "./admin-header";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const [stats, videos, quotes, prompts] = await Promise.all([getAdminStats(), adminVideos(), adminQuotes(), adminPrompts()]);
  const week = stats.signups_by_day.slice(-7).reduce((n, d) => n + d.n, 0);
  const max = Math.max(1, ...stats.signups_by_day.map((d) => d.n));

  const strip = [
    { label: "Members", value: stats.members, note: `${stats.members_onboarded} finished onboarding` },
    { label: "New this week", value: stats.members_new_7d, note: "Signed up in the last 7 days" },
    { label: "Active this week", value: stats.active_7d, note: "Checked in at least once" },
    { label: "Premium", value: stats.members_premium, note: "On a paid plan" },
  ];

  return (
    <>
      <AdminHeader
        title="Overview"
        description={`${week === 1 ? "1 member" : `${week} members`} joined in the last 7 days. Totals only: no admin can read anyone's check-ins, journal or goals.`}
      />
      <dl className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-border lg:grid-cols-4">
        {strip.map((s, i) => (
          <div key={s.label} className={`flex flex-col gap-1 p-5 ${i % 2 === 1 ? "border-l border-border" : ""} ${i >= 2 ? "border-t border-border lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
            <dt className="text-[14px] text-muted">{s.label}</dt>
            <dd className="num text-[28px] leading-tight text-ink">{s.value.toLocaleString("en")}</dd>
            <dd className="text-[13px] text-muted">{s.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <section aria-labelledby="signups-heading" className="rounded-[18px] border border-border p-5 lg:col-span-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="signups-heading" className="text-[16px] font-semibold text-ink">
              Sign-ups
            </h2>
            <p className="text-[13px] text-muted">Last 14 days</p>
          </div>
          <div className="flex h-[160px] items-end gap-1.5" role="img" aria-label={`Sign-ups per day over the last 14 days, ${stats.signups_by_day.reduce((n, d) => n + d.n, 0)} in total.`}>
            {stats.signups_by_day.map((d, i) => (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                <div className={`rounded-t-[4px] ${i === stats.signups_by_day.length - 1 ? "bg-accent" : "bg-control"}`} style={{ height: `${d.n ? Math.max(4, (d.n / max) * 130) : 0}px` }} title={`${d.n} on ${d.day}`} />
                <div className="h-px bg-border" />
              </div>
            ))}
          </div>
          <div className="num mt-2 flex justify-between text-[12px] text-muted">
            <span>{formatDate(stats.signups_by_day[0].day, { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </section>

        <section aria-labelledby="activity-heading" className="flex flex-col gap-4 rounded-[18px] border border-border p-5 lg:col-span-4">
          <h2 id="activity-heading" className="text-[16px] font-semibold text-ink">
            This week
          </h2>
          <dl className="flex flex-col divide-y divide-rule">
            {[
              ["Check-ins", stats.check_ins_7d],
              ["Journal entries", stats.entries_7d],
              ["Goals in progress", stats.goals_active],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 text-[15px]">
                <dt className="text-ink">{label}</dt>
                <dd className="num text-ink">{Number(value).toLocaleString("en")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="content-heading" className="rounded-[18px] border border-border p-5 lg:col-span-12">
          <h2 id="content-heading" className="mb-3 text-[16px] font-semibold text-ink">
            Content
          </h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {[
              { href: "/admin/videos", label: "Videos", live: videos.filter((v) => v.is_published).length, total: videos.length, waiting: videos.filter((v) => v.is_published && !v.mux_playback_id).length },
              { href: "/admin/quotes", label: "Quotes", live: quotes.filter((q) => q.is_active).length, total: quotes.length, waiting: 0 },
              { href: "/admin/prompts", label: "Prompts", live: prompts.filter((p) => p.is_active).length, total: prompts.length, waiting: 0 },
            ].map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex flex-col gap-0.5 rounded-[14px] bg-raised px-4 py-3 hover:bg-active">
                  <span className="text-[15px] font-medium text-ink">{c.label}</span>
                  <span className="num text-[14px] text-muted">
                    {c.live} live of {c.total}
                    {c.waiting ? ` · ${c.waiting} waiting for a video file` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 mb-8 h-4 w-96 max-w-full" />
      <Skeleton className="h-[130px] rounded-[18px]" />
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-[240px] rounded-[18px] lg:col-span-8" />
        <Skeleton className="h-[240px] rounded-[18px] lg:col-span-4" />
      </div>
    </>
  );
}
