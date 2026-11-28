"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * The finder's filters, search and sorting in one GET form. Ticking a filter or changing the
 * sort updates the results straight away (typing waits for Enter). Without JavaScript it still
 * works as a normal form. Defaults and empty fields are left out of the address.
 */
export function FilterForm({ action, defaults, children }: { action: string; defaults: Record<string, string>; children: React.ReactNode }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  const go = () => {
    if (!form.current) return;
    const p = new URLSearchParams();
    for (const [k, v] of new FormData(form.current)) {
      const s = String(v).trim();
      if (!s || defaults[k] === s) continue;
      p.append(k, s);
    }
    const q = p.toString();
    start(() => router.push(`${action}${q ? `?${q}` : ""}`, { scroll: false }));
  };

  return (
    <form
      ref={form}
      action={action}
      method="get"
      role="search"
      aria-busy={pending}
      data-pending={pending || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.type === "search" || t.type === "text") return;
        go();
      }}
      className="group/finder"
    >
      {children}
    </form>
  );
}

/** On phones the filter column opens as a panel */
export function MobileFilters({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-deep ring-1 ring-slate/25 lg:hidden"
        aria-expanded={open}
        aria-controls="finder-filters"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters{count ? ` (${count})` : ""}
      </button>
      <div
        id="finder-filters"
        className={`${open ? "fixed inset-0 z-[60] overflow-y-auto bg-mist p-5" : "hidden"} lg:static lg:z-auto lg:block lg:overflow-visible lg:bg-transparent lg:p-0`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-lg font-extrabold text-deep">Filters</p>
          <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate/25" aria-label="Close filters">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
        <button type="button" onClick={() => setOpen(false)} className="sticky bottom-0 mt-5 w-full rounded-full bg-teal px-5 py-3.5 font-semibold text-white lg:hidden">
          Show results
        </button>
      </div>
    </>
  );
}
