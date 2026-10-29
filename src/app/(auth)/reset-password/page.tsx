import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthHeading } from "../auth-heading";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password">You will stay signed in on this device.</AuthHeading>
      <ResetPasswordForm />
    </>
  );
}
