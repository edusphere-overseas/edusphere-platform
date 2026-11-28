import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import {
  applyHref,
  countryInfo,
  durationText,
  eligibilityHref,
  lakh,
  levelShort,
  locationLabel,
  universityHref,
  type CourseHit,
  type University,
  type UniversityHit,
} from "@/lib/catalogue";

/** Result cards for the course finder, university pages and country pages (light style). */

const fmt = (n: number) => n.toLocaleString("en-IN");

export function Flag({ country, className = "h-3.5 w-5" }: { country: string; className?: string }) {
  const f = countryInfo(country)?.flag;
  if (!f) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${f}.svg`} alt="" className={`${className} shrink-0 rounded-[2px] object-cover ring-1 ring-deep/10`} />;
}

export const placeOf = (u: University, withCountry = true) =>
  [u.city, u.region && locationLabel(u.country, u.region), withCountry && u.country !== "europe" ? countryInfo(u.country)?.short : ""]
    .filter((x, i, all) => x && all.indexOf(x) === i)
    .join(", ");

const SMALL = new Set(["the", "of", "and", "for", "at", "in", "de", "di", "del", "la", "le", "des", "der", "fur", "für", "y", "e"]);
const TONES = ["bg-[#e6f2f4] text-[#2f7a86]", "bg-[#e8eff6] text-[#2c6085]", "bg-[#f1ecf7] text-[#6a4c93]", "bg-[#fbefe6] text-[#a35a1f]", "bg-[#e9f3ec] text-[#2f7048]", "bg-[#f7ebee] text-[#9b3b52]"];

/** Initials on a soft colour, standing in for the university's logo (we don't copy logos) */
export function Monogram({ name, className = "h-14 w-14 text-lg" }: { name: string; className?: string }) {
  const words = name
    .replace(/\([^)]*\)/g, "")
    .split(/[\s\-–,.]+/)
    .filter((w) => w && !SMALL.has(w.toLowerCase()) && /^\p{L}/u.test(w));
  const pick = words.filter((w) => !/^(university|universit[àäéy]|college|institute|school)$/i.test(w));
  const letters = (pick.length ? pick : words)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-xl font-extrabold tracking-tight ${TONES[h % TONES.length]} ${className}`}>
      {letters || "U"}
    </span>
  );
}

const typeText = (t: string) => (t === "public" ? "Public" : t === "private" ? "Private" : "");

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] font-semibold tracking-wide text-slate uppercase">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-bold ${muted ? "text-slate/80" : "text-deep"}`}>{value}</dd>
    </div>
  );
}

const btnBase = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition";

export function UniversityCard({ hit, level, course }: { hit: UniversityHit; level?: string; course?: string }) {
  const { u, feeInr, matching } = hit;
  const third =
    u.courses > 0
      ? { label: level ? `${levelShort(level)} courses` : "Courses", value: matching ? fmt(matching) : "Ask us" }
      : u.country === "canada"
        ? { label: "Work permit", value: u.pgwp ? "PGWP eligible" : "Ask us", muted: !u.pgwp }
        : u.students
          ? { label: "Students", value: fmt(u.students) }
          : { label: "Courses", value: "Ask us", muted: true };
  return (
    <li className="flex min-w-0 flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(13,34,54,0.05),0_10px_30px_-20px_rgba(13,34,54,0.25)] ring-1 ring-deep/8 transition hover:ring-teal/40">
      <div className="flex items-start gap-4">
        <Monogram name={u.name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.05rem] leading-snug font-bold text-deep">
            <Link href={universityHref(u.id)} className="hover:text-teal">
              {u.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{placeOf(u) || countryInfo(u.country)?.name}</span>
            <Flag country={u.country} />
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-mist px-3.5 py-3">
        <Stat label="Tuition" value={feeInr ? `≈ ${lakh(feeInr)}/yr` : "Ask us"} muted={!feeInr} />
        <Stat label="Type" value={typeText(u.type) || "Not listed"} muted={!u.type} />
        <Stat {...third} />
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Link href={universityHref(u.id)} className={`${btnBase} order-last col-span-2 text-deep ring-1 ring-slate/25 hover:bg-mist sm:order-none`}>
          Know more
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">about {u.name}</span>
        </Link>
        <Link href={eligibilityHref({ university: u.id, country: u.country, level, course })} className={`${btnBase} bg-deep text-white hover:bg-navy`}>
          Check eligibility
          <span className="sr-only">for {u.name}</span>
        </Link>
        <Link href={applyHref({ university: u.id, country: u.country, level, course })} className={`${btnBase} bg-teal text-white hover:bg-navy`}>
          Apply
          <span className="sr-only">to {u.name}</span>
        </Link>
      </div>
    </li>
  );
}

export function CourseCard({ hit }: { hit: CourseHit }) {
  const { c, feeInr } = hit;
  const u = c.university;
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(13,34,54,0.05),0_10px_30px_-20px_rgba(13,34,54,0.25)] ring-1 ring-deep/8 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-teal/10 px-2.5 py-1 text-teal">{levelShort(c.level)}</span>
          {c.months > 0 && <span className="rounded-full bg-mist px-2.5 py-1 text-slate">{durationText(c.months)}</span>}
          {feeInr > 0 && <span className="rounded-full bg-mist px-2.5 py-1 text-slate">≈ {lakh(feeInr)} first year</span>}
        </p>
        <h3 className="mt-2 text-[1.05rem] leading-snug font-bold text-deep">{c.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-slate">
          <Flag country={u.country} />
          <span className="min-w-0">
            <Link href={universityHref(u.id)} className="font-semibold text-deep/85 hover:text-teal">
              {u.name}
            </Link>
            {placeOf(u) && <span> · {placeOf(u)}</span>}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href={eligibilityHref({ university: u.id, country: u.country, level: c.level, course: c.title })} className={`${btnBase} bg-deep text-white hover:bg-navy`}>
          Check eligibility
          <span className="sr-only">
            for {c.title} at {u.name}
          </span>
        </Link>
        <Link href={applyHref({ university: u.id, country: u.country, level: c.level, course: c.title })} className={`${btnBase} bg-teal text-white hover:bg-navy`}>
          Apply
          <span className="sr-only">
            for {c.title} at {u.name}
          </span>
        </Link>
      </div>
    </li>
  );
}

export function PgwpBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Work-permit-eligible programmes
    </span>
  );
}
