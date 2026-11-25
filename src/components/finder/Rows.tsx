import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { applyHref, countryInfo, durationText, feeText, levelLabel, universityFee, type Course, type University } from "@/lib/catalogue";

/** Result rows for the course finder and the country pages (dark site style). */

const fmt = (n: number) => n.toLocaleString("en-IN");

export function Flag({ country }: { country: string }) {
  const f = countryInfo(country)?.flag;
  if (!f) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${f}.svg`} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/15" />;
}

const place = (u: University) => [u.city, u.region, u.country === "europe" ? "" : countryInfo(u.country)?.name].filter(Boolean).join(", ");

export function CourseRow({ c }: { c: Course }) {
  const facts = [levelLabel(c.level), durationText(c.months), feeText(c)].filter(Boolean);
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel/60 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-teal-light">{facts.join(" · ")}</p>
        <h3 className="mt-1 text-lg leading-snug font-bold text-white">{c.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
          <Flag country={c.university.country} />
          <span className="min-w-0">
            <span className="font-medium text-white/80">{c.university.name}</span>
            {place(c.university) && <span> · {place(c.university)}</span>}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {(c.url || c.university.website) && (
          <a
            href={c.url || c.university.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white/80 ring-1 ring-white/15 hover:bg-white/5"
          >
            {c.url ? "Course page" : "Website"}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(opens a new tab)</span>
          </a>
        )}
        <Link
          href={applyHref({ university: c.university.id, course: c.title, country: c.university.country })}
          className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-light"
        >
          Apply
          <span className="sr-only">
            for {c.title} at {c.university.name}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

export function UniversityRow({ u, coursesLink }: { u: University; coursesLink?: string }) {
  const extra = [universityFee(u), u.country === "canada" && u.pgwp ? "Has work-permit-eligible programmes" : "", u.country === "canada" && u.public ? "Public" : ""].filter(Boolean);
  return (
    <li className="flex flex-col rounded-2xl border border-white/10 bg-panel/60 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-1.5">
          <Flag country={u.country} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug font-bold text-white">{u.name}</h3>
          {place(u) && <p className="mt-0.5 text-sm text-white/60">{place(u)}</p>}
          {extra.length > 0 && <p className="mt-1.5 text-xs text-white/50">{extra.join(" · ")}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
        <Link href={applyHref({ university: u.id, country: u.country })} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light">
          Apply
          <span className="sr-only">to {u.name}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {coursesLink && (
          <Link href={coursesLink} className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/15 hover:bg-white/5">
            {fmt(u.courses)} {u.courses === 1 ? "course" : "courses"}
          </Link>
        )}
        {u.website && (
          <a href={u.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold text-teal-light hover:underline">
            Website
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(opens a new tab)</span>
          </a>
        )}
      </div>
    </li>
  );
}
