import { ExternalLink, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Get support now" };

const GROUNDING = [
  { n: 5, text: "things you can see" },
  { n: 4, text: "things you can touch" },
  { n: 3, text: "things you can hear" },
  { n: 2, text: "things you can smell" },
  { n: 1, text: "slow breath, all the way out" },
];

export default function HelpPage() {
  return (
    <>
      <h1>Get support now</h1>
      <p className="text-[19px]">If things feel too heavy right now, you don&rsquo;t have to carry them alone.</p>

      <section aria-labelledby="urgent" className="flex flex-col gap-3 rounded-[20px] bg-sand p-5 sm:p-6">
        <h2 id="urgent" className="!mt-0">
          If you are in danger
        </h2>
        <p>
          If you might hurt yourself or someone else, or you are not safe where you are, call your local emergency number now. In
          Kenya, call <strong>999</strong> or <strong>112</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="tel:999" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-medium text-on-primary">
            <Phone className="size-[18px]" aria-hidden />
            Call 999
          </a>
          <a href="tel:112" className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-5 text-[15px] font-medium text-ink">
            <Phone className="size-[18px]" aria-hidden />
            Call 112
          </a>
        </div>
      </section>

      <h2>Talk to someone today</h2>
      <p>
        Free, confidential helplines are available in most countries, by phone, text or chat. Find one near you, open now, in the
        international directory:
      </p>
      <p>
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-accent-ink underline underline-offset-4"
        >
          findahelpline.com
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </p>
      <p>Telling one person you trust how you feel, a friend, a family member or a doctor, is a strong first step.</p>

      <h2>A minute to steady yourself</h2>
      <p>Wherever you are, slowly notice:</p>
      <ol className="flex flex-col gap-2">
        {GROUNDING.map((g) => (
          <li key={g.n} className="flex items-baseline gap-4">
            <span className="num w-6 font-serif text-[28px] leading-none text-accent">{g.n}</span>
            <span>{g.text}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-[15px] text-muted">
        JournApp supports reflection and wellbeing. It is not a crisis or medical service and is not monitored in real time.
      </p>
    </>
  );
}
