import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="rounded-[14px] bg-warning-soft px-4 py-3 text-[15px] text-warning-ink">
        Draft for review. These terms must be checked by a legal professional before JournApp opens to the public.
      </p>
      <p>Last updated 29 October 2026.</p>
      <h2>Using JournApp</h2>
      <p>
        You need to be at least 16 years old to create an account, and 18 or over to open the Sexuality area. Keep your password to
        yourself; you are responsible for activity on your account.
      </p>
      <h2>Your content</h2>
      <p>What you write in JournApp is yours. You give us permission only to store and display it to you so the app works.</p>
      <h2>Wellbeing, not medicine</h2>
      <p>
        Content in JournApp, including videos and coaching sessions, is for general wellbeing and education. It is not medical,
        psychological or professional advice. Talk to a qualified professional about your health.
      </p>
      <h2>Premium content</h2>
      <p>Some videos and coaching will be part of a paid plan. Prices and terms will be shown clearly before you pay anything.</p>
      <h2>Ending your account</h2>
      <p>You can delete your account at any time from Settings. We may suspend accounts that misuse the service.</p>
      <h2>Changes</h2>
      <p>We will tell you about important changes to these terms before they take effect.</p>
    </>
  );
}
