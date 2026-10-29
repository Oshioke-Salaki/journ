import Link from "next/link";
import { Wordmark } from "@/components/brand/mark";
import { routes } from "@/lib/routes";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="mx-auto flex h-[72px] max-w-[760px] items-center px-5 pt-safe">
        <Link href={routes.home} aria-label="JournApp home">
          <Wordmark />
        </Link>
      </header>
      <main className="mx-auto max-w-[760px] px-5 pt-8 pb-24">
        <article className="flex flex-col gap-5 text-[17px] leading-relaxed text-ink [&_h1]:mb-2 [&_h1]:text-[34px] [&_h1]:leading-tight [&_h1]:font-semibold [&_h1]:tracking-[-0.02em] [&_h2]:mt-6 [&_h2]:text-[21px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
          {children}
        </article>
      </main>
    </div>
  );
}
