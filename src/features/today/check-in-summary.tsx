import { Pencil } from "lucide-react";
import Link from "next/link";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { buttonVariants } from "@/components/ui/button";
import { areaLabel, capitalise, moodLabel, sensationLabel } from "@/features/check-in/constants";
import type { CheckIn } from "@/features/check-in/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const LEVELS = [
  { key: "energy", label: "Energy" },
  { key: "efficiency", label: "Efficiency" },
  { key: "self_satisfaction", label: "Self-satisfaction" },
] as const;

/** Today's check-in, once it is done: the day's landscape and what was noticed. */
export function CheckInSummary({ checkIn, userId, timeZone }: { checkIn: CheckIn; userId: string; timeZone: string }) {
  const updated = new Date(checkIn.updated_at);
  return (
    <div className="flex flex-col gap-6">
      <Landscape
        mood={checkIn.mood}
        energy={checkIn.energy ?? 3}
        seed={seedFrom(`${userId}:${checkIn.local_date}`)}
        radius={14}
        className="aspect-[16/7] rounded-[18px]"
        title={`Today's landscape: feeling ${moodLabel(checkIn.mood).toLowerCase()}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] text-muted">Feeling</p>
          <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink">{moodLabel(checkIn.mood)}</h2>
        </div>
        <Link href={routes.checkIn} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}>
          <Pencil aria-hidden />
          Update
        </Link>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-rule rounded-[16px] bg-surface py-3">
        {LEVELS.map((l) => {
          const v = checkIn[l.key];
          return (
            <div key={l.key} className="flex flex-col gap-0.5 px-3 first:pl-4">
              <dt className="truncate text-[13px] text-muted">{l.label}</dt>
              <dd className="num text-[20px] text-ink">
                {v === null ? <span className="text-faint">–</span> : v}
                {v === null ? null : <span className="text-[14px] text-faint"> /5</span>}
              </dd>
            </div>
          );
        })}
      </dl>

      {checkIn.body.length || checkIn.feelings.length ? (
        <div className="flex flex-col gap-3 text-[15px]">
          {checkIn.body.length ? (
            <p className="text-ink">
              <span className="text-muted">In your body: </span>
              {checkIn.body.map((n) => (n.sensation ? `${sensationLabel(n.sensation).toLowerCase()} in ${areaLabel(n.area).toLowerCase()}` : areaLabel(n.area).toLowerCase())).join(", ")}
            </p>
          ) : null}
          {checkIn.feelings.length ? (
            <p className="text-ink">
              <span className="text-muted">Words: </span>
              {checkIn.feelings.map(capitalise).join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      {checkIn.note ? <p className="font-serif text-[18px] leading-relaxed text-ink">&ldquo;{checkIn.note}&rdquo;</p> : null}
      <p className="text-[13px] text-faint">
        Last updated {updated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone })}
      </p>
    </div>
  );
}
