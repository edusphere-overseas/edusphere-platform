"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, PencilLine, Search, X } from "lucide-react";
import { hint, input, label } from "@/components/portal/ui";

export type CountryOption = { id: string; name: string; flag: string };
export type PickedUniversity = { id: string; name: string; place?: string } | null;
type Option = { id: string; name: string; country: string; place: string; courses: number };

/**
 * Country, university, course and intake fields, shared by the apply form and the portal.
 * The university is picked from the open-data catalogue, or typed in when it isn't listed.
 * Sends: country, university_ref (catalogue id, or empty), university (typed name), course, intake.
 */
export function UniversityFields({
  countries,
  intakes,
  initialCountry = "",
  initialUniversity = null,
  initialTyped = "",
  initialCourse = "",
  initialIntake = "",
  errorField,
}: {
  countries: CountryOption[];
  intakes: string[];
  initialCountry?: string;
  initialUniversity?: PickedUniversity;
  initialTyped?: string;
  initialCourse?: string;
  initialIntake?: string;
  errorField?: string;
}) {
  const [country, setCountry] = useState(initialCountry);
  const [picked, setPicked] = useState<PickedUniversity>(initialUniversity);
  const [typing, setTyping] = useState(!initialUniversity && !!initialTyped);
  const ids = useId();
  const flag = countries.find((c) => c.id === country)?.flag;

  return (
    <div className="grid gap-4">
      <label className={label}>
        Country
        <span className="relative">
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/flags/${flag}.svg`} alt="" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-6 -translate-y-1/2 rounded-[3px] object-cover ring-1 ring-deep/10" />
          )}
          <select
            name="country"
            required
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setPicked(null);
            }}
            aria-invalid={errorField === "country" || undefined}
            className={`${input} ${flag ? "pl-12" : ""}`}
          >
            <option value="" disabled>
              Choose a country
            </option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </span>
      </label>

      <input type="hidden" name="university_ref" value={!typing && picked ? picked.id : ""} />
      {typing ? (
        <label className={label}>
          University name
          <input
            name="university"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initialTyped || picked?.name || ""}
            autoComplete="off"
            placeholder="Type the university or college name"
            aria-invalid={errorField === "university" || undefined}
            className={input}
          />
          <span className={hint}>
            We work with most universities, including many that aren&apos;t in the public lists.{" "}
            <button type="button" onClick={() => setTyping(false)} className="font-semibold text-teal hover:text-navy">
              Search the list instead
            </button>
          </span>
        </label>
      ) : picked ? (
        <div className={label}>
          <span id={`${ids}-uni`}>University</span>
          <div className="flex items-center gap-3 rounded-xl border border-teal/40 bg-teal/6 px-3.5 py-3" aria-labelledby={`${ids}-uni`}>
            <Check className="h-4.5 w-4.5 shrink-0 text-teal" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-deep">{picked.name}</span>
              {picked.place && <span className="block text-xs font-normal text-slate">{picked.place}</span>}
            </span>
            <button type="button" onClick={() => setPicked(null)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-teal ring-1 ring-teal/30 hover:bg-white">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Change
            </button>
          </div>
        </div>
      ) : (
        <UniversitySearch
          country={country}
          invalid={errorField === "university"}
          onPick={(u) => setPicked(u)}
          onNotListed={() => setTyping(true)}
        />
      )}

      <CourseField universityId={!typing && picked ? picked.id : ""} initial={initialCourse} />

      <label className={label}>
        <span>
          Intake <span className="font-normal text-slate">(when you&apos;d like to start)</span>
        </span>
        <select name="intake" defaultValue={initialIntake} aria-invalid={errorField === "intake" || undefined} className={input}>
          <option value="">Not sure yet</option>
          {intakes.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function UniversitySearch({ country, invalid, onPick, onNotListed }: { country: string; invalid?: boolean; onPick: (u: NonNullable<PickedUniversity>) => void; onNotListed: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const ids = useId();
  const listId = `${ids}-list`;

  useEffect(() => {
    if (!country) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/catalogue?kind=universities&country=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { items: Option[] };
        setItems(json.items ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline: keep the last list */
      } finally {
        setBusy(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, country]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const total = items.length + 1; // + "not listed"
  const choose = (i: number) => {
    if (i === items.length) onNotListed();
    else if (items[i]) onPick({ id: items[i].id, name: items[i].name, place: items[i].place });
  };

  return (
    <div ref={box} className={`${label} relative`}>
      <label htmlFor={`${ids}-q`}>University</label>
      <span className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate/70" aria-hidden="true" />
        <input
          id={`${ids}-q`}
          type="text"
          role="combobox"
          aria-expanded={open && !!country}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${ids}-o${active}` : undefined}
          aria-invalid={invalid || undefined}
          disabled={!country}
          value={q}
          placeholder={country ? "Start typing a university name" : "Choose a country first"}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % total);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a <= 0 ? total - 1 : a - 1));
            } else if (e.key === "Enter" && open && active >= 0) {
              e.preventDefault();
              choose(active);
            } else if (e.key === "Escape") setOpen(false);
          }}
          className={`${input} pl-11`}
        />
        {busy && <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-slate" aria-hidden="true" />}
      </span>
      {open && country && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-30 mt-1.5 max-h-80 overflow-auto rounded-xl bg-white p-1.5 font-normal shadow-[0_18px_40px_-12px_rgba(13,34,54,0.35)] ring-1 ring-deep/10">
          {items.map((u, i) => (
            <li
              key={u.id}
              id={`${ids}-o${i}`}
              role="option"
              aria-selected={active === i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={`cursor-pointer rounded-lg px-3 py-2.5 ${active === i ? "bg-mist" : "hover:bg-mist"}`}
            >
              <span className="block text-sm font-semibold text-deep">{u.name}</span>
              <span className="block text-xs text-slate">{[u.place, u.courses ? `${u.courses} courses` : ""].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
          {!busy && items.length === 0 && <li className="px-3 py-2.5 text-sm text-slate">No match in the list.</li>}
          <li
            id={`${ids}-o${items.length}`}
            role="option"
            aria-selected={active === items.length}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(items.length)}
            className={`mt-1 flex cursor-pointer items-center gap-2 rounded-lg border-t border-deep/8 px-3 py-2.5 text-sm font-semibold text-teal ${active === items.length ? "bg-mist" : "hover:bg-mist"}`}
          >
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            My university isn&apos;t listed: type its name
          </li>
        </ul>
      )}
      <span className={hint}>
        Can&apos;t find it?{" "}
        <button type="button" onClick={onNotListed} disabled={!country} className="font-semibold text-teal hover:text-navy disabled:text-slate">
          Type the university name
        </button>
        . We&apos;re partnered with almost every university.
      </span>
    </div>
  );
}

function CourseField({ universityId, initial }: { universityId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [options, setOptions] = useState<string[]>([]);
  const listId = useId();

  useEffect(() => {
    if (!universityId) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalogue?kind=courses&u=${encodeURIComponent(universityId)}&q=${encodeURIComponent(value)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { items: { title: string }[] };
        setOptions((json.items ?? []).map((c) => c.title));
      } catch {
        /* ignore */
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [universityId, value]);
  const shown = universityId ? options : [];

  return (
    <label className={label}>
      <span>
        Course <span className="font-normal text-slate">(optional)</span>
      </span>
      <input
        name="course"
        maxLength={200}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        list={shown.length ? listId : undefined}
        autoComplete="off"
        placeholder="For example, MSc Data Science"
        className={input}
      />
      {shown.length > 0 && (
        <datalist id={listId}>
          {shown.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
      <span className={hint}>Not decided? Leave it blank and your counsellor will help you choose.</span>
    </label>
  );
}
