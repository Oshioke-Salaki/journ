import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { routes } from "@/lib/routes";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · JournApp admin" }, robots: { index: false } };

/**
 * Nothing of the admin area renders until the member is confirmed as an admin. Everyone else gets
 * the plain public 404, with no admin header, so the area does not reveal that it exists.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-surface"><Spinner className="size-6 text-muted" /></div>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-rule bg-surface pt-safe">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Mark className="size-7" title={null} />
              <span className="text-[16px] font-semibold text-ink">
                JournApp <span className="font-normal text-muted">Admin</span>
              </span>
            </Link>
            <Link href={routes.today} className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink sm:hidden">
              <ArrowLeft className="size-4" aria-hidden />
              App
            </Link>
          </div>
          <AdminNav />
          <Link href={routes.today} className="ml-auto hidden items-center gap-1.5 text-[14px] text-muted hover:text-ink sm:inline-flex">
            <ArrowLeft className="size-4" aria-hidden />
            Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">{children}</main>
    </div>
  );
}
