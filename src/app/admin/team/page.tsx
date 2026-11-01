import type { Metadata } from "next";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AddAdminForm, RemoveAdminButton, ResetTwoStepForm } from "@/features/admin/components/team";
import { adminTeam } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Team" };

export default function AdminTeamPage() {
  return (
    <>
      <AdminHeader title="Team" description="Admins manage videos, quotes, prompts and topics, and help members with sign-in. They cannot read anyone's journal or check-ins." />
      <Suspense fallback={<Skeleton className="h-[320px] rounded-[18px]" />}>
        <Team />
      </Suspense>
    </>
  );
}

async function Team() {
  const { user } = await requireAdmin();
  const admins = await adminTeam();
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <section aria-labelledby="admins-heading" className="overflow-hidden rounded-[18px] border border-border lg:col-span-7">
        <h2 id="admins-heading" className="num border-b border-rule px-5 py-3 text-[14px] font-normal text-muted">
          {admins.length === 1 ? "1 admin" : `${admins.length} admins`}
        </h2>
        <ul className="divide-y divide-rule">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={a.display_name ?? a.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{a.display_name ?? "No name yet"}</p>
                <p className="truncate text-[13px] text-muted">
                  {a.email} · joined {formatDate(a.created_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <RemoveAdminButton email={a.email} isYou={a.id === user.id} />
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-col gap-4 lg:col-span-5">
        <section aria-label="Add an admin" className="rounded-[18px] border border-border p-5">
          <AddAdminForm />
          <p className="mt-3 text-[13px] text-muted">The person needs a JournApp account first. They see the Admin link the next time they open the app.</p>
        </section>
        <section aria-labelledby="reset-two-step" className="flex flex-col gap-3 rounded-[18px] border border-border p-5">
          <h2 id="reset-two-step" className="text-[15px] font-semibold text-ink">
            Reset two-step sign-in
          </h2>
          <p className="text-[13px] text-muted">For a member who lost the phone with their authenticator app. Confirm it&rsquo;s really them first, for example by replying from their account email.</p>
          <ResetTwoStepForm />
        </section>
      </div>
    </div>
  );
}
