import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, ChevronRight, ClipboardCheck, FileText, Globe, GraduationCap, Landmark, MapPin, Users, Wallet } from "lucide-react";
import { CourseTable } from "@/components/finder/CourseTable";
import { Flag, Monogram, placeOf, UniversityCard } from "@/components/finder/Cards";
import { WhatsAppIcon } from "@/components/icons";
import {
  applyHref,
  countryInfo,
  eligibilityHref,
  lakh,
  LEVELS,
  levelShort,
  locationLabel,
  MAIN_INTAKES,
  money,
  prebuiltUniversityIds,
  universityDetails,
} from "@/lib/catalogue";
import { getSiteContent, whatsappHref } from "@/lib/content";
import { countryShort, requirementText } from "@/lib/eligibility";

export async function generateStaticParams() {
  return (await prebuiltUniversityIds()).map((id) => ({ id }));
}

async function load(params: Promise<{ id: string }>) {
  const { id } = await params;
  return universityDetails(decodeURIComponent(id).slice(0, 40));
}

export async function generateMetadata({ params }: PageProps<"/universities/[id]">): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const u = d.university;
  const where = placeOf(u) || countryInfo(u.country)?.name;
  return {
    title: `${u.name}: courses, fees and admissions`,
    description: `${u.name}, ${where}: ${u.courses ? `${u.courses} courses, ` : ""}${d.feeInr ? `tuition about ${lakh(d.feeInr)} a year, ` : ""}entry requirements for Indian students. Check your eligibility and apply free with Edusphere Overseas.`,
  };
}

const DOCUMENTS = {
  ug: ["10th and 12th mark sheets", "Passport", "English test score (IELTS, PTE, TOEFL or Duolingo)", "Statement of purpose", "One or two letters of recommendation", "Proof of funds, for the visa"],
  pg: [
    "Degree certificate and transcripts (and 10th and 12th mark sheets)",
    "Passport",
    "English test score (IELTS, PTE, TOEFL or Duolingo)",
    "Statement of purpose and CV",
    "Two letters of recommendation",
    "Work experience letters, if any",
    "Proof of funds, for the visa",
  ],
};

export default function UniversityPage({ params }: PageProps<"/universities/[id]">) {
  // Most universities aren't built ahead, so the page streams in behind a placeholder
  return (
    <Suspense fallback={<UniversitySkeleton />}>
      <University params={params} />
    </Suspense>
  );
}

function UniversitySkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mx-auto max-w-7xl px-5 pt-20 pb-16 sm:px-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-xl bg-white/10" />
          <div className="grid flex-1 gap-3">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/10" />
            <div className="h-5 w-1/3 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
      <div className="h-[40rem] bg-mist" />
    </div>
  );
}

async function University({ params }: { params: PageProps<"/universities/[id]">["params"] }) {
  const [d, c] = await Promise.all([load(params), getSiteContent()]);
  if (!d) notFound();
  const u = d.university;
  const info = countryInfo(u.country)!;
  const where = placeOf(u, false);
  const type = u.type === "public" ? "Public" : u.type === "private" ? "Private" : "";
  const kind = /college/i.test(u.name) ? "college" : /institute|school/i.test(u.name) ? "institution" : "university";
  const levelNames = d.levels.map((l) => levelShort(l));
  const levelWords = d.levels.map((l) => (l === "pgcert" ? "PG diplomas" : l === "doctorate" ? "PhDs" : `${levelShort(l).toLowerCase()}s`.replace("'ss", "'s")));
  const admissionLevels = (d.levels.length ? d.levels : ["bachelor", "master"]).filter((l) => l === "bachelor" || l === "master" || l === "diploma" || l === "pgcert").slice(0, 3);
  const intakes = MAIN_INTAKES[u.country] ?? [];
  const short = u.name.replace(/\s+\([^)]*\)$/, "");

  const highlights = [
    { icon: MapPin, label: "Location", value: [where, info.short].filter(Boolean).join(", ") },
    type && { icon: Landmark, label: "Type", value: type },
    { icon: Wallet, label: "Typical tuition", value: d.feeInr ? `≈ ${lakh(d.feeInr)} a year` : "Ask your counsellor", note: d.feeInr ? money(u.feeYear, u.currency) + (u.country === "usa" ? " (out-of-state, undergraduate)" : " (first year)") : "" },
    u.courses > 0 && { icon: GraduationCap, label: "Courses listed", value: u.courses.toLocaleString("en-IN"), note: levelNames.join(", ") },
    u.students > 0 && { icon: Users, label: u.country === "usa" ? "Undergraduates" : "Students", value: u.students.toLocaleString("en-IN") },
    intakes.length > 0 && { icon: CalendarDays, label: "Main intakes", value: intakes.join(" and ") },
    u.country === "canada" && { icon: BadgeCheck, label: "Post-graduation work permit", value: u.pgwp ? "Has eligible programmes" : "Check with your counsellor" },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; note?: string }[];

  const about = [
    `${u.name} is ${type ? `a ${type.toLowerCase()}` : `a`} ${kind} in ${[where, countryShort(u.country)].filter(Boolean).join(", ")}.`,
    u.courses ? `The official data lists ${u.courses.toLocaleString("en-IN")} courses for international students here${levelNames.length ? `: ${levelWords.slice(0, -1).join(", ")}${levelWords.length > 1 ? " and " : ""}${levelWords[levelWords.length - 1]}` : ""}.` : "",
    d.feeInr ? `Typical first-year tuition is about ${lakh(d.feeInr)} (${money(u.feeYear, u.currency)}).` : "",
    "Edusphere's counsellors help you choose the course, prepare your application and visa, and stay with you until you fly, free of charge.",
  ].filter(Boolean);

  const tabs = [
    { id: "overview", label: "Overview" },
    ...(d.courses.length ? [{ id: "courses", label: "Courses and fees" }] : []),
    { id: "admissions", label: "Admissions" },
    ...(d.similar.length ? [{ id: "similar", label: "Similar universities" }] : []),
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-teal/20 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-5 pt-8 pb-12 sm:px-8 sm:pt-12 sm:pb-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-white/50">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              {[
                ...(c.sections.courseFinder ? [{ href: "/course-finder", label: "Course finder" }] : []),
                { href: `/destinations/${u.country}/universities`, label: `Universities in ${info.short}` },
              ].map((x) => (
                <li key={x.href} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <Link href={x.href} className="hover:text-white">
                    {x.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <Monogram name={u.name} className="h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl" />
            <div className="min-w-0">
              <h1 className="text-3xl leading-tight font-extrabold tracking-[-0.02em] text-balance text-white sm:text-5xl">{u.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {[where, info.name].filter(Boolean).join(", ")}
                <Flag country={u.country} className="h-4 w-6" />
              </p>
              <p className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                {type && <span className="rounded-full bg-white/10 px-3 py-1 text-white/85">{type}</span>}
                {u.courses > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-white/85">{u.courses.toLocaleString("en-IN")} courses</span>}
                {d.feeInr > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-white/85">Tuition ≈ {lakh(d.feeInr)}/yr</span>}
                {u.country === "canada" && u.pgwp && <span className="rounded-full bg-teal/25 px-3 py-1 text-teal-light">PGWP-eligible programmes</span>}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={eligibilityHref({ university: u.id, country: u.country })} className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light">
              <ClipboardCheck className="h-4.5 w-4.5" aria-hidden="true" />
              Check eligibility
            </Link>
            <Link href={applyHref({ university: u.id, country: u.country })} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-deep transition hover:bg-mist">
              Apply now
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </Link>
            {u.website && (
              <a href={u.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5">
                <Globe className="h-4.5 w-4.5" aria-hidden="true" />
                Official website
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(opens a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-deep/8 bg-white/95 backdrop-blur">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 sm:px-8">
          {tabs.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`} className="block border-b-2 border-transparent px-3 py-3.5 text-sm font-semibold whitespace-nowrap text-slate hover:border-teal hover:text-deep">
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bg-mist text-ink scheme-light">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-10 sm:px-8 sm:py-14 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid min-w-0 gap-12">
            <section id="overview" className="scroll-mt-32">
              <h2 className="text-2xl font-extrabold text-deep">Highlights</h2>
              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {highlights.map((h) => (
                  <div key={h.label} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-deep/8">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
                      <h.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold tracking-wide text-slate uppercase">{h.label}</dt>
                      <dd className="mt-0.5 font-bold text-deep">{h.value}</dd>
                      {h.note && <dd className="mt-0.5 text-xs text-slate">{h.note}</dd>}
                    </div>
                  </div>
                ))}
              </dl>
              <div className="mt-6 max-w-3xl space-y-3 leading-relaxed text-slate">
                {about.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>

            {d.courses.length > 0 && (
              <section id="courses" className="scroll-mt-32">
                <h2 className="text-2xl font-extrabold text-deep">Courses and fees</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">
                  Courses open to international students, from official data. Fees are indicative and shown in rupees at this month&apos;s exchange rate; your counsellor confirms
                  them with the university.
                </p>
                <div className="mt-5">
                  <CourseTable
                    courses={d.courses.map(({ title, level, months, feeYearInr, url }) => ({ title, level, months, feeYearInr, url }))}
                    levels={d.levels}
                    university={u.id}
                    country={u.country}
                  />
                </div>
              </section>
            )}

            <section id="admissions" className="scroll-mt-32">
              <h2 className="text-2xl font-extrabold text-deep">Admissions</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">
                Typical entry requirements for Indian students in {countryShort(u.country)}. Each course sets its own, so treat these as a guide and check your eligibility for
                a quick answer.
              </p>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {admissionLevels.map((l) => {
                  const r = requirementText(u.country, l);
                  if (!r) return null;
                  return (
                    <div key={l} className="rounded-2xl bg-white p-5 ring-1 ring-deep/8">
                      <h3 className="font-extrabold text-deep">{LEVELS.find((x) => x.id === l)?.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate">
                        <span className="font-semibold text-deep">Academic: </span>
                        {r.academic}.
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate">
                        <span className="font-semibold text-deep">English: </span>
                        {r.english}.
                      </p>
                      {r.notes.map((n) => (
                        <p key={n} className="mt-1.5 text-sm leading-relaxed text-slate">
                          {n}
                        </p>
                      ))}
                      <Link href={eligibilityHref({ university: u.id, country: u.country, level: l })} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-navy">
                        Check your eligibility for {levelShort(l)}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {(["ug", "pg"] as const).map((k) => (
                  <div key={k} className="rounded-2xl bg-white p-5 ring-1 ring-deep/8">
                    <h3 className="flex items-center gap-2 font-extrabold text-deep">
                      <FileText className="h-4.5 w-4.5 text-teal" aria-hidden="true" />
                      Documents you&apos;ll usually need ({k === "ug" ? "undergraduate" : "postgraduate"})
                    </h3>
                    <ul className="mt-3 grid gap-1.5 text-sm text-slate">
                      {DOCUMENTS[k].map((x) => (
                        <li key={x} className="flex gap-2">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {d.similar.length > 0 && (
              <section id="similar" className="scroll-mt-32">
                <h2 className="text-2xl font-extrabold text-deep">
                  Similar universities{u.location ? ` in ${locationLabel(u.country, u.location)}` : ""}
                </h2>
                <ul className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {d.similar.map((h) => (
                    <UniversityCard key={h.u.id} hit={h} />
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-32">
            <div className="rounded-3xl bg-deep p-6 text-white shadow-[0_30px_60px_-30px_rgba(13,34,54,0.6)]">
              <p className="text-xs font-bold tracking-wide text-teal-light uppercase">Free counselling</p>
              <h2 className="mt-2 text-xl font-extrabold">Interested in {short}?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">See if you&apos;re eligible in two minutes, or apply now and your counsellor takes it from there.</p>
              <div className="mt-5 grid gap-2.5">
                <Link href={eligibilityHref({ university: u.id, country: u.country })} className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-5 py-3 font-semibold text-white hover:bg-teal-light">
                  <ClipboardCheck className="h-4.5 w-4.5" aria-hidden="true" />
                  Check eligibility
                </Link>
                <Link href={applyHref({ university: u.id, country: u.country })} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-deep hover:bg-mist">
                  Apply now
                  <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(c.whatsappNumber, `Hi Edusphere, I'd like to know more about ${u.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/5"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-[#25D366]" />
                  Ask on WhatsApp
                </a>
              </div>
            </div>
            <p className="mt-4 px-2 text-xs leading-relaxed text-slate">
              Details from official open data. Edusphere is an independent consultancy: this page isn&apos;t run by the university.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
