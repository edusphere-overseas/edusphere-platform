import type { Metadata } from "next";
import { CalendarClock, Coins, ExternalLink, ShieldCheck } from "lucide-react";
import { OpenNow } from "@/components/home/OpenNow";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { getLibrary, getSiteContent, type Library } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Scholarships and education loans",
  description: "Scholarships, fee awards and education loans for studying abroad, with links to every official source.",
};

function Item({ s }: { s: Library["scholarships"][number] }) {
  return (
    <li className="flex flex-col rounded-3xl border border-white/10 bg-panel/60 p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-light">{s.provider || (s.kind === "loan" ? "Education loan" : "Scholarship")}</span>
        {s.flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/flags/${s.flag}.svg`} alt="" className="h-4 w-6 rounded-[2px] object-cover ring-1 ring-white/20" />
        )}
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-[-0.01em] text-white">{s.title}</h3>
      {s.amount && <p className="mt-1.5 font-semibold text-white/85">{s.amount}</p>}
      {s.eligibility && <p className="mt-3 text-[0.95rem] leading-relaxed text-white/65">{s.eligibility}</p>}
      <div className="mt-auto grid gap-2 pt-5 text-sm">
        {s.deadline && (
          <p className="flex items-center gap-2 font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-teal-light" aria-hidden="true" />
            Deadline {formatDate(s.deadline)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Checked {formatDate(s.lastChecked)}
          </span>
          <a href={s.officialLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
            Official source
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </li>
  );
}

export default async function ScholarshipsPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const open = c.sections.openNow ? c.openNow.filter((p) => p.kind === "scholarship") : [];
  const scholarships = lib.scholarships.filter((s) => s.kind !== "loan");
  const loans = lib.scholarships.filter((s) => s.kind === "loan");

  return (
    <>
      <PageHero
        eyebrow="Funding"
        crumbs={[{ href: "/scholarships", label: "Scholarships and loans" }]}
        title={
          <>
            Scholarships and <span className="text-teal-light">education loans</span>
          </>
        }
        intro="Ways to fund your studies, each checked against its official source. We help you find what you qualify for and apply well."
      />

      {open.length > 0 && <OpenNow items={open} whatsapp={c.whatsappNumber} />}

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8">
          {scholarships.length > 0 && (
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">Scholarships</h2>
              <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {scholarships.map((s) => (
                  <Item key={s._id} s={s} />
                ))}
              </ul>
            </div>
          )}
          {loans.length > 0 && (
            <div>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">Education loans</h2>
              <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((s) => (
                  <Item key={s._id} s={s} />
                ))}
              </ul>
            </div>
          )}
          {lib.scholarships.length === 0 && open.length === 0 && (
            <Reveal className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 p-8 sm:p-10">
              <Coins className="h-8 w-8 text-teal-light/60" aria-hidden="true" />
              <h2 className="text-2xl font-extrabold text-white">Funding options are being added</h2>
              <p className="max-w-2xl leading-relaxed text-white/65">
                Scholarships and loans change every year, so we only list them once our team has checked the official source. Ask us now and we&apos;ll look at what you
                could qualify for.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      <CtaBand whatsapp={c.whatsappNumber} title="Let's find funding that fits" text="Tell us your course, grades and budget. We'll look for scholarships you could qualify for and explain your loan options." message="Hi Edusphere, I'd like help with scholarships and education loans." />
    </>
  );
}
