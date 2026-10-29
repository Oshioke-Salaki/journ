import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/mark";
import { NotFoundView } from "@/components/ui/not-found-view";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface px-5 pt-safe pb-safe sm:px-10">
      <header className="mx-auto flex h-[72px] w-full max-w-[1080px] items-center">
        <Link href={routes.home} aria-label="JournApp home">
          <Wordmark />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 items-center pt-6 pb-20">
        <NotFoundView />
      </main>
    </div>
  );
}
