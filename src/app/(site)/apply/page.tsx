import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckCircle2, MessageCircle, Search, UserRoundCheck } from "lucide-react";
import { AddUniversityForm } from "@/components/apply/AddUniversityForm";
import { StudyWizard } from "@/components/apply/StudyWizard";
import { WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/pages/PageHero";
import { getSiteContent, whatsappHref } from "@/lib/content";
import { wizardSetup } from "@/lib/wizard";

export const metadata: Metadata = {
  title: "Apply to a university",
  description: "Apply to universities in the UK, Australia, the USA, Canada, New Zealand and Europe with free guidance from Edusphere Overseas.",
};

export default async function ApplyPage({ searchParams }: PageProps<"/apply">) {
  const c = await getSiteContent();
  const steps = [
    { icon: Search, title: "Choose", text: "Pick the country, the level and the university. Not in our list? Type its name: we work with almost every university." },
    { icon: UserRoundCheck, title: "Your portal account", text: "We create your student portal account, so you can upload documents and follow each stage." },
    { icon: MessageCircle, title: "Your counsellor calls", text: "Usually within one working day, to check the course, entry requirements and deadlines with you." },
  ];
  return (
    <>
      <PageHero
        eyebrow="Apply"
        crumbs={[
          ...(c.sections.courseFinder ? [{ href: "/course-finder", label: "Course finder" }] : []),
          { href: "/apply", label: "Apply" },
        ]}
        title={
          <>
            Apply to your <span className="text-teal-light">university</span>
          </>
        }
        intro="Tell us where you'd like to study. Our counsellors handle the application with you, free of charge."
      />
      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 sm:px-8 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-6 text-ink scheme-light shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
            <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-2xl bg-mist" />}>
              <Apply searchParams={searchParams} />
            </Suspense>
          </div>
          <aside className="grid gap-5">
            <h2 className="text-xl font-extrabold text-white">What happens next</h2>
            <ol className="grid gap-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/20 text-teal-light">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold text-white">
                      {i + 1}. {s.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/65">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <a
              href={whatsappHref(c.whatsappNumber, "Hi Edusphere, I'd like help applying to a university.")}
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

async function Apply({ searchParams }: { searchParams: PageProps<"/apply">["searchParams"] }) {
  const sp = await searchParams;
  await connection(); // the intake list depends on today's date
  const w = await wizardSetup(sp, "/apply");

  if (w.portal?.kind === "staff") {
    return (
      <div>
        <h2 className="text-xl font-extrabold text-deep">You&apos;re signed in as staff</h2>
        <p className="mt-2 leading-relaxed text-slate">
          Add universities for a student from their page in the{" "}
          <Link href="/staff/students" className="font-semibold text-teal hover:text-navy">
            staff dashboard
          </Link>
          . Sign out to try the student form.
        </p>
      </div>
    );
  }
  // Signed in: add straight to the portal's application tracker
  if (w.portal) {
    return (
      <>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-deep">
          <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
          Signed in as {w.portal.name || "you"}
        </h2>
        <p className="mt-2 mb-6 leading-relaxed text-slate">
          {w.portal.role === "parent"
            ? "The university is added to your student's application tracker, and their counsellor is told."
            : "The university is added to your application tracker, and your counsellor is told."}
        </p>
        <AddUniversityForm countries={w.countries} intakes={w.intakes} initial={w.initial} />
      </>
    );
  }

  return (
    <StudyWizard
      mode="apply"
      countries={w.countries}
      intakes={w.intakes}
      mainIntakes={w.mainIntakes}
      initial={w.initial}
      signInHref={w.signInHref}
      today={w.today}
    />
  );
}
