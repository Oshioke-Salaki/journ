import Link from "next/link";
import { Landscape } from "@/components/brand/landscape";
import { Wordmark } from "@/components/brand/mark";
import { routes } from "@/lib/routes";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 pt-safe pb-safe sm:px-10">
        <header className="flex h-[72px] items-center">
          <Link href={routes.home} aria-label="JournApp home">
            <Wordmark />
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</main>
      </div>
      <aside aria-hidden className="relative hidden bg-sand lg:block">
        <div className="sticky top-0 flex h-dvh flex-col justify-end gap-10 p-12 xl:p-16">
          <Landscape mood={4} energy={4} palette="dawn" seed={7} className="w-full rounded-[28px]" />
          <p className="max-w-[30ch] font-serif text-[30px] leading-[1.2] tracking-[-0.01em] text-ink">
            Some days you can change a lot. Some days, only how you meet them.
          </p>
        </div>
      </aside>
    </div>
  );
}
