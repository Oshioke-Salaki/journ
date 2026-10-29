import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Landscape } from "@/components/brand/landscape";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

const PLACES = [
  { href: routes.today, label: "Today", hint: "Check in and write" },
  { href: routes.journal, label: "Journal", hint: "Everything you have written" },
  { href: routes.space, label: "My Space", hint: "Goals, plans and reports" },
  { href: routes.help, label: "Get support", hint: "If things feel heavy" },
];

/** The "page isn't here" content, shared by the public 404 and the one inside the app. */
export function NotFoundView({ inApp = false }: { inApp?: boolean }) {
  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <Landscape mood={2} energy={2} seed={404} radius={0} className="aspect-[16/11] overflow-hidden rounded-[24px]" title="A quiet landscape at dusk" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="num text-[15px] text-muted">Error 404</p>
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">This page isn&rsquo;t here</h1>
          <p className="max-w-[44ch] text-[17px] text-muted">
            The link may be old, mistyped, or the page may have been removed. Nothing you have saved is affected.
          </p>
        </div>
        {inApp ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {PLACES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="group flex items-center justify-between gap-3 rounded-[16px] bg-raised px-4 py-3 transition-colors hover:bg-active">
                  <span>
                    <span className="block text-[15px] font-medium text-ink">{p.label}</span>
                    <span className="block text-[13px] text-muted">{p.hint}</span>
                  </span>
                  <ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link href={routes.home} className={buttonVariants({ size: "lg" })}>
              Back to JournApp
            </Link>
            <Link href={routes.help} className={buttonVariants({ variant: "ghost", size: "lg" })}>
              Get support
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
