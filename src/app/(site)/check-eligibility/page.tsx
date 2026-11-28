import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClipboardCheck, GraduationCap, MousePointerClick, ShieldCheck } from "lucide-react";
import { StudyWizard } from "@/components/apply/StudyWizard";
import { WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/pages/PageHero";
import { getSiteContent, whatsappHref } from "@/lib/content";
import { wizardSetup } from "@/lib/wizard";

export const metadata: Metadata = {
  title: "Check your eligibility to study abroad",
  description:
    "Free two-minute eligibility check for universities in the UK, Australia, the USA, Canada, New Zealand and Europe, based on your marks and English score. Then apply with Edusphere Overseas.",
};

export default async function CheckEligibilityPage({ searchParams }: PageProps<"/check-eligibility">) {
  const c = await getSiteContent();
  const points = [
    { icon: MousePointerClick, title: "Two minutes, free", text: "Three short steps: your plans, your marks and English score, and where to send your result." },
    { icon: GraduationCap, title: "Typical requirements", text: "We compare your profile with what universities in that country usually ask Indian students for." },
    { icon: ClipboardCheck, title: "Apply in one click", text: "Happy with the result? Apply straight away: we create your student portal account and your counsellor calls you." },
    { icon: ShieldCheck, title: "Your data stays with us", text: "We use it only to advise you. We never sell it." },
  ];
  return (
    <>
      <PageHero
        eyebrow="Eligibility check"
        crumbs={[
          ...(c.sections.courseFinder ? [{ href: "/course-finder", label: "Course finder" }] : []),
          { href: "/check-eligibility", label: "Check eligibility" },
        ]}
        title={
          <>
            Check your <span className="text-teal-light">eligibility</span>
          </>
        }
        intro="Find out where your marks and English score could take you, in two minutes. Then apply with free guidance from your counsellor."
      />
      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 sm:px-8 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-6 text-ink scheme-light shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
            <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-2xl bg-mist" />}>
              <Wizard searchParams={searchParams} />
            </Suspense>
          </div>
          <aside className="grid gap-5">
            <h2 className="text-xl font-extrabold text-white">How it works</h2>
            <ul className="grid gap-4">
              {points.map((p) => (
                <li key={p.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/20 text-teal-light">
                    <p.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold text-white">{p.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/65">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={whatsappHref(c.whatsappNumber, "Hi Edusphere, could you check my eligibility to study abroad?")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Prefer to chat? WhatsApp us
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}

async function Wizard({ searchParams }: { searchParams: PageProps<"/check-eligibility">["searchParams"] }) {
  const sp = await searchParams;
  await connection(); // intakes and the date limit depend on today's date
  const w = await wizardSetup(sp, "/check-eligibility");
  return (
    <StudyWizard
      mode="eligibility"
      countries={w.countries}
      intakes={w.intakes}
      mainIntakes={w.mainIntakes}
      initial={w.initial}
      signInHref={w.signInHref}
      today={w.today}
      portalUser={w.portal?.kind === "family"}
    />
  );
}
