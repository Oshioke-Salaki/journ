import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { routes } from "@/lib/routes";
import { AuthHeading } from "../auth-heading";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading title="Start your journal">It takes a minute. You can add more about yourself later.</AuthHeading>
      <SignUpForm />
      <p className="mt-8 text-[15px] text-muted">
        Already have an account?{" "}
        <Link href={routes.signIn} className="font-medium text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
