"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { applyHref, eligibilityHref, lakh, LEVELS, levelShort } from "@/lib/catalogue-shared";

export type CourseItem = { title: string; level: string; months: number; feeYearInr: number; url: string };

const duration = (months: number) => {
  if (!months) return "";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round((months / 12) * 2) / 2;
  return `${years} year${years === 1 ? "" : "s"}`;
};

/** A university's courses with a level filter and a search, each with "Check eligibility" and "Apply". */
export function CourseTable({ courses, levels, university, country }: { courses: CourseItem[]; levels: string[]; university: string; country: string }) {
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(15);
  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return courses.filter((c) => (!level || c.level === level) && words.every((w) => c.title.toLowerCase().includes(w)));
  }, [courses, level, q]);
  const count = (l: string) => courses.filter((c) => c.level === l).length;
  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition ${active ? "bg-deep text-white ring-deep" : "bg-white text-deep ring-slate/25 hover:ring-teal/60"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={!level} onClick={() => (setLevel(""), setShown(15))} className={chip(!level)}>
          All <span className="opacity-60">{courses.length}</span>
        </button>
        {LEVELS.filter((l) => levels.includes(l.id)).map((l) => (
          <button key={l.id} type="button" aria-pressed={level === l.id} onClick={() => (setLevel(l.id), setShown(15))} className={chip(level === l.id)}>
            {l.short} <span className="opacity-60">{count(l.id)}</span>
          </button>
        ))}
      </div>
      {courses.length > 10 && (
        <label className="relative mt-4 block max-w-md">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => (setQ(e.target.value), setShown(15))}
            placeholder="Search these courses"
            className="w-full rounded-full border border-slate/25 bg-white py-2.5 pr-4 pl-10 text-sm text-ink outline-none focus:border-teal focus:ring-3 focus:ring-teal/20"
          />
        </label>
      )}
      <p className="mt-4 text-sm text-slate" aria-live="polite">
        {list.length} course{list.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-3 divide-y divide-deep/8 overflow-hidden rounded-2xl bg-white ring-1 ring-deep/8">
        {list.slice(0, shown).map((c, i) => (
          <li key={`${c.title}-${c.level}-${i}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-deep">
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal">
                    {c.title}
                    <span className="sr-only"> (opens the course page in a new tab)</span>
                  </a>
                ) : (
                  c.title
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate">{[levelShort(c.level), duration(c.months), c.feeYearInr ? `≈ ${lakh(c.feeYearInr)} first year` : ""].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={eligibilityHref({ university, country, level: c.level, course: c.title })}
                className="inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold text-deep ring-1 ring-slate/25 hover:bg-mist"
              >
                Check eligibility
                <span className="sr-only"> for {c.title}</span>
              </Link>
              <Link href={applyHref({ university, country, level: c.level, course: c.title })} className="inline-flex min-h-9 items-center rounded-full bg-teal px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-navy">
                Apply
                <span className="sr-only"> for {c.title}</span>
              </Link>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="p-4 text-sm text-slate">No course matches. Try another word, or ask your counsellor.</li>}
      </ul>
      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + 30)} className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-deep ring-1 ring-slate/25 hover:bg-white">
          Show more courses ({list.length - shown} more)
        </button>
      )}
    </div>
  );
}
