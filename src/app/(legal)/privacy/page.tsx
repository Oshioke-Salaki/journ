import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="rounded-[14px] bg-warning-soft px-4 py-3 text-[15px] text-warning-ink">
        Draft for review. This policy must be checked by a legal professional before JournApp opens to the public.
      </p>
      <p>Last updated 29 October 2026.</p>
      <p>
        JournApp is a journal for self-awareness. What you record in it (your mood, your body, your journal entries and your goals)
        is personal, and some of it is health information. This policy explains what we store, why, and the control you have over it.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Your account: email address, first name and a securely hashed password.</li>
        <li>Details you choose to add: date, time and place of birth, country, language and pronouns. All optional.</li>
        <li>What you record: check-ins, body notes, feelings, journal entries, goals and steps.</li>
        <li>Your preferences, such as whether you want goal prompts and reminders.</li>
        <li>Basic usage information, such as which screens are opened, to improve the app. It never includes what you write.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        Only to run JournApp for you: to show your history and reports, to greet you and to send the reminders you asked for. We do
        not sell your data, we do not show advertising, and we do not use your entries to train AI models.
      </p>
      <h2>Your consent</h2>
      <p>
        Mood, body and sexuality-related information can be special category data under the UK and EU GDPR and under Kenya&rsquo;s
        Data Protection Act 2019. We process it only with your explicit consent, given when you create your account. You can
        withdraw it at any time by deleting your account.
      </p>
      <h2>Who can see it</h2>
      <p>
        Only you. Every record is tied to your account and protected by access rules in our database. Our service providers
        (Supabase for the database, Vercel for hosting) process data on our behalf under data processing agreements.
        When you search for your place of birth, only the text you type is sent to Open-Meteo&rsquo;s place search.
      </p>
      <h2>Your rights</h2>
      <ul>
        <li>Download a copy of everything you stored, from Settings.</li>
        <li>Correct your details, from Settings.</li>
        <li>Delete your account and all of its data permanently, from Settings.</li>
        <li>Contact us with any question about your data.</li>
      </ul>
      <h2>Not medical advice</h2>
      <p>
        JournApp supports reflection and wellbeing. It is not a medical device and does not give diagnosis or treatment. If you are in
        crisis or thinking about harming yourself, contact local emergency services or a crisis line straight away.
      </p>
      <h2>Contact</h2>
      <p>Contact details for privacy requests will be added before launch.</p>
    </>
  );
}
