import { Settings } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export async function AccountRow() {
  const profile = await getProfile();
  const name = profile?.display_name ?? "Your account";
  return (
    <Link
      href={routes.settings}
      className="flex items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-raised"
    >
      <Avatar name={profile?.display_name ?? null} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">{name}</span>
        <span className="block text-[13px] text-muted">Settings</span>
      </span>
      <Settings className="size-[18px] text-faint" aria-hidden />
    </Link>
  );
}

export function AccountRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export async function AccountButton() {
  const profile = await getProfile();
  return (
    <Link href={routes.settings} aria-label="Settings" className="rounded-full active:scale-95">
      <Avatar name={profile?.display_name ?? null} className="size-8 text-[14px]" />
    </Link>
  );
}
