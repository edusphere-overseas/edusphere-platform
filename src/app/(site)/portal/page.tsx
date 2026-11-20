import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileUp, ListChecks } from "lucide-react";
import { getSiteContent, whatsappHref } from "@/lib/content";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Student and parent portal",
};

const features = [
  { icon: FileUp, title: "Upload documents", text: "Send passports, transcripts and test scores securely to our team." },
  { icon: ListChecks, title: "Track your application", text: "See each stage, from shortlist to visa, as it happens." },
  { icon: CalendarCheck, title: "Book counselling", text: "Pick a time that suits you from your counsellor's live calendar." },
];

/** Placeholder until the portal is built (Step 3 of the build plan). */
export default async function PortalPage() {
  const c = await getSiteContent();
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-teal/20 blur-[120px]" />
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-teal-light">Student and parent portal</span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">Your portal is on its way</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          Soon you&apos;ll sign in with your email or Google account, and parents can follow along too. Until then, our
          team is a message away.
        </p>
        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <Icon className="h-6 w-6 text-teal-light" aria-hidden="true" />
              <h2 className="mt-4 font-bold text-white">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={whatsappHref(c.whatsappNumber, "Hi Edusphere, I'd like help with my application.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Message our team
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
