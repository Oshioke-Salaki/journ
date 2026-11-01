import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "How JournApp works",
  description: "Check-ins, the journal, goals, reports and your privacy, explained in a few lines each.",
};

const SECTIONS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "Every day",
    items: [
      {
        q: "What is a check-in?",
        a: "Under a minute: how you feel overall, where you feel it in your body, your energy and focus, and a few words for it. Each one paints a small landscape: a higher sun for a better mood, livelier hills for more energy. You can update today's check-in as often as you like.",
      },
      {
        q: "I missed a day. Can I still add it?",
        a: "Yes, for the last seven days. Open the day from My Space or the calendar and choose Add a check-in. Today also offers it when yesterday is empty.",
      },
      {
        q: "What are the suggestions after I check in?",
        a: "Simple rules, not AI. Tension or worry suggests a breathing practice, overwhelm suggests sorting your thoughts, low energy suggests gentle movement, and your mood picks a writing prompt.",
      },
      {
        q: "What does “What can I control?” do?",
        a: "Write down what is on your mind, then sort each thought into what you control, what you can influence, and what you can set down. It is a quick way to see where your energy is best spent.",
      },
    ],
  },
  {
    title: "Your journal",
    items: [
      {
        q: "Where are my entries?",
        a: (
          <>
            In Journal, in the main navigation, newest first. Search by any word, or filter by tag. Today shows entries from a week, a month and a year ago in{" "}
            <em>On this day</em>.
          </>
        ),
      },
      {
        q: "Will I lose what I'm writing if my connection drops?",
        a: "No. A draft is kept on your device as you type and offered back when you return. It is removed once the entry is saved.",
      },
      { q: "Can I print my journal or keep a copy?", a: "Yes. In Journal, choose Print or save as PDF for any month or the whole journal. Settings also has a full download of your data." },
    ],
  },
  {
    title: "Goals, reports and patterns",
    items: [
      { q: "How do goals work?", a: "A goal has a reason and small steps. Give steps a date and they appear in My plans. With goal prompts on, Today shows the next step of each goal." },
      {
        q: "Where do the insights come from?",
        a: "From your own check-ins and tracking over the last 90 days, compared in plain arithmetic: for example, your mood after 7 or more hours of sleep against shorter nights. An insight only appears when there are enough days on both sides.",
      },
    ],
  },
  {
    title: "Privacy and your account",
    items: [
      { q: "Who can read my journal?", a: "Only you. The JournApp team, admins included, cannot read your journal, check-ins, goals or pictures. The database itself enforces this." },
      {
        q: "Can I lock JournApp on a shared phone?",
        a: "Yes. In Settings, set an app lock code. JournApp then asks for it when opened, and after a few minutes away. The code stays on that device.",
      },
      { q: "I'm travelling. Why is “today” wrong?", a: "Your days follow the time zone in Settings. When your phone is somewhere new, Today offers to switch; you can also change it in Settings." },
      { q: "How do I delete everything?", a: "Settings, then Delete account. It erases your account and everything in it, permanently. Download your data first if you'd like a copy." },
    ],
  },
];

export default function GuidePage() {
  return (
    <>
      <h1>How JournApp works</h1>
      <p className="text-[19px] text-muted">Short answers to the questions members ask most.</p>
      {SECTIONS.map((section) => (
        <section key={section.title} aria-labelledby={slug(section.title)} className="flex flex-col gap-2">
          <h2 id={slug(section.title)}>{section.title}</h2>
          <div className="flex flex-col divide-y divide-rule rounded-[20px] bg-raised">
            {section.items.map((item) => (
              <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
                  {item.q}
                  <span aria-hidden className="text-[22px] leading-none text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[16px] text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-6 text-[16px] text-muted">
        Still stuck, or have an idea?{" "}
        <Link href={`${routes.settings}#feedback`} className="font-medium text-accent-ink underline underline-offset-4">
          Send feedback
        </Link>{" "}
        from Settings. If things feel heavy,{" "}
        <Link href={routes.help} className="font-medium text-accent-ink underline underline-offset-4">
          support is here
        </Link>
        .
      </p>
    </>
  );
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z]+/g, "-");
}
