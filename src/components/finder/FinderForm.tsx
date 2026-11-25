"use client";

import { Search } from "lucide-react";

type Opt = { id: string; label: string };

const field =
  "block w-full rounded-xl border-0 bg-white/[0.06] px-4 py-3 text-[0.95rem] text-white ring-1 ring-white/12 outline-none transition placeholder:text-white/40 focus:ring-2 focus:ring-teal-light [&>option]:bg-white [&>option]:text-deep";

/** Search box and filters for the course finder. A plain GET form: changing a filter searches straight away. */
export function FinderForm({
  view,
  q,
  country,
  level,
  subject,
  university,
  countries,
  levels,
  subjects,
}: {
  view: "courses" | "universities";
  q: string;
  country: string;
  level: string;
  subject: string;
  university?: string;
  countries: (Opt & { courses: boolean })[];
  levels: Opt[];
  subjects: Opt[];
}) {
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const courseCountry = !country || countries.find((c) => c.id === country)?.courses;
  return (
    <form action="/course-finder" method="get" role="search" className="grid gap-3 rounded-3xl border border-white/10 bg-panel/70 p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
      <input type="hidden" name="view" value={view} />
      {university && <input type="hidden" name="u" value={university} />}
      <label className="relative">
        <span className="sr-only">{view === "courses" ? "Course or subject" : "University name or city"}</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/45" aria-hidden="true" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          maxLength={80}
          placeholder={view === "courses" ? "Course or subject, e.g. data science" : "University name or city"}
          className={`${field} pl-11`}
        />
      </label>
      <label>
        <span className="sr-only">Country</span>
        <select name="country" defaultValue={country} onChange={submit} className={field}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Level</span>
        <select name="level" defaultValue={level} onChange={submit} disabled={view !== "courses" || !courseCountry} className={`${field} disabled:opacity-40`}>
          <option value="">All levels</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Subject</span>
        <select name="subject" defaultValue={subject} onChange={submit} disabled={view !== "courses" || !courseCountry} className={`${field} disabled:opacity-40`}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 font-semibold text-white transition hover:bg-teal-light">
        <Search className="h-4.5 w-4.5" aria-hidden="true" />
        Search
      </button>
    </form>
  );
}
