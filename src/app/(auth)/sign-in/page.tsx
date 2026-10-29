import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorState } from "@/components/ui/states";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { routes, safeNextPath } from "@/lib/routes";
import { AuthHeading } from "../auth-heading";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <>
      <AuthHeading title="Welcome back">Sign in to continue your journal.</AuthHeading>
      <Suspense fallback={<SignInForm />}>
        <SignInWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 text-[15px] text-muted">
        New to JournApp?{" "}
        <Link href={routes.signUp} className="font-medium text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

async function SignInWithParams({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeNextPath(params.next) : undefined;
  return (
    <>
      {params.error === "link" ? (
        <ErrorState title="That link didn't work" className="mb-6">
          It may have expired or been used already. Sign in, or request a new link.
        </ErrorState>
      ) : null}
      <SignInForm next={next} />
    </>
  );
}
