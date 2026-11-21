"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import type { Library } from "@/lib/content";

type Uni = Library["universities"][number];

/** Universities with a country filter. */
export function UniversityList({ items, countries }: { items: Uni[]; countries: { flag: string; name: string }[] }) {
  const [flag, setFlag] = useState<string>("all");
  const shown = useMemo(() => (flag === "all" ? items : items.filter((u) => u.flag === flag)), [flag, items]);
  const available = countries.filter((c) => items.some((u) => u.flag === c.flag));

  return (
    <div>
      {available.length > 1 && (
        <div role="group" aria-label="Filter by country" className="flex flex-wrap gap-2">
          {[{ flag: "all", name: "All countries" }, ...available].map((c) => (
            <button
              key={c.flag}
              type="button"
              aria-pressed={flag === c.flag}
              onClick={() => setFlag(c.flag)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition ${
                flag === c.flag ? "bg-white text-deep ring-white" : "bg-white/[0.04] text-white/80 ring-white/12 hover:bg-white/10"
              }`}
            >
              {c.flag !== "all" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/flags/${c.flag}.svg`} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
              )}
              {c.name}
            </button>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-white/50" aria-live="polite">
        {shown.length} {shown.length === 1 ? "university" : "universities"}
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((u) => (
          <li key={u._id} className="flex flex-col rounded-3xl border border-white/10 bg-panel/60 p-5">
            <div className="flex items-start justify-between gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${u.flag}.svg`} alt="" className="h-6 w-8 rounded-[4px] object-cover ring-1 ring-white/15" />
              {u.partner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/20 px-2.5 py-1 text-[0.7rem] font-semibold text-teal-light">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Partner
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">{u.name}</h3>
            {u.city && <p className="text-sm text-white/55">{u.city}</p>}
            {u.courses && u.courses.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {u.courses.slice(0, 6).map((c) => (
                  <li key={c} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/70">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {u.website && (
              <a href={u.website} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-teal-light hover:underline">
                Website
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
