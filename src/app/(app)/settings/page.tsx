import { LayoutDashboard, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Appearance } from "@/features/settings/appearance";
import { DeleteAccountButton, DownloadDataButton, SignOutButton } from "@/features/settings/data-controls";
import { PreferencesForm } from "@/features/settings/preferences-form";
import { ProfileForm } from "@/features/settings/profile-form";
import { buttonVariants } from "@/components/ui/button";
import { requireMember } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" />
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    </PageContainer>
  );
}

async function Settings() {
  const { user, profile } = await requireMember();
  return (
    <div className="flex flex-col">
      {profile.role === "admin" ? (
        <Section id="admin" title="Admin" description="You manage JournApp's videos, quotes, prompts and topics.">
          <Link href={routes.admin} className={buttonVariants({ variant: "outline" })}>
            <LayoutDashboard aria-hidden />
            Open admin
          </Link>
        </Section>
      ) : null}
      <Section id="profile" title="Profile" description="How JournApp greets you, and the optional details you chose to share. Only you can see them.">
        <ProfileForm
          defaults={{
            name: profile.display_name ?? "",
            about: {
              dateOfBirth: profile.date_of_birth ?? "",
              birthTime: profile.birth_time?.slice(0, 5) ?? "",
              birthPlace: profile.birth_place ?? "",
              birthLocation:
                profile.birth_latitude !== null && profile.birth_longitude !== null
                  ? {
                      latitude: Number(profile.birth_latitude),
                      longitude: Number(profile.birth_longitude),
                      timezone: profile.birth_timezone,
                      countryCode: profile.birth_country,
                    }
                  : null,
              country: profile.country ?? "",
              pronouns: profile.pronouns ?? "",
              language: "en",
            },
          }}
        />
      </Section>
      <Section id="preferences" title="Prompts and reminders" description="JournApp only nudges you when you ask it to.">
        <PreferencesForm
          defaults={{
            goalPromptsEnabled: profile.goal_prompts_enabled,
            remindersEnabled: profile.reminders_enabled,
            reminderTime: profile.reminder_time.slice(0, 5),
          }}
        />
      </Section>
      <Section id="appearance" title="Appearance" description="Saved on this device.">
        <Appearance />
      </Section>
      <Section id="privacy" title="Your data" description="Everything you store in JournApp belongs to you. Take a copy at any time.">
        <div className="flex flex-col items-start gap-3">
          <p className="text-[15px] text-ink">A JSON file with your profile, check-ins, journal, goals and steps.</p>
          <DownloadDataButton />
        </div>
      </Section>
      <Section id="support" title="Support" description="JournApp is not a crisis service. If things feel too heavy, help is close.">
        <Link href={routes.help} className={buttonVariants({ variant: "outline" })}>
          <LifeBuoy aria-hidden />
          Get support now
        </Link>
      </Section>
      <Section id="account" title="Account" description={user.email ?? undefined}>
        <SignOutButton />
      </Section>
      <Section id="delete" title="Delete account" description="Erases your account and everything in it, permanently." last>
        <DeleteAccountButton />
      </Section>
    </div>
  );
}

function Section({ id, title, description, children, last }: { id: string; title: string; description?: string; children: ReactNode; last?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={last ? "grid gap-4 py-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12" : "grid gap-4 border-b border-rule py-8 first:pt-0 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12"}>
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-[17px] font-semibold text-ink">
          {title}
        </h2>
        {description ? <p className="text-[15px] text-muted">{description}</p> : null}
      </div>
      <div className="max-w-[680px] rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="grid gap-4 lg:grid-cols-[340px_1fr] lg:gap-12">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-[220px] max-w-[680px] rounded-[var(--radius-panel)]" />
        </div>
      ))}
    </div>
  );
}
