import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { routes } from "@/lib/routes";
import { AuthHeading } from "../auth-heading";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Reset your password">Enter your email and we will send you a link to choose a new one.</AuthHeading>
      <ForgotPasswordForm />
      <p className="mt-8 text-[15px] text-muted">
        Remembered it?{" "}
        <Link href={routes.signIn} className="font-medium text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
