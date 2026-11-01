import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyForm } from "@/features/auth/components/verify-form";
import { getSessionUser } from "@/lib/auth/session";
import { routes, safeNextPath } from "@/lib/routes";
import { AuthHeading } from "../auth-heading";

export const metadata: Metadata = { title: "Enter your code", robots: { index: false } };

export default function VerifyPage({ searchParams }: PageProps<"/verify">) {
  return (
    <>
      <AuthHeading title="One more step">Open your authenticator app and enter the code for JournApp.</AuthHeading>
      <Suspense fallback={<Skeleton className="h-[200px] rounded-[16px]" />}>
        <Verify searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 text-[14px] text-muted">
        Lost your phone? Ask the JournApp team to reset two-step sign-in for your account. They will check it&rsquo;s you first.
      </p>
    </>
  );
}

async function Verify({ searchParams }: Pick<PageProps<"/verify">, "searchParams">) {
  const [user, params] = await Promise.all([getSessionUser(), searchParams]);
  const next = typeof params.next === "string" ? safeNextPath(params.next) : undefined;
  if (!user) redirect(routes.signIn);
  if (!user.needsSecondStep) redirect(next ?? routes.today);
  return <VerifyForm next={next} />;
}
