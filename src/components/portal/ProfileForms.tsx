"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { updateAccount, updateStudentDetails, type ProfileState } from "@/app/portal/_actions/profile";
import { DESTINATIONS, FUNDING, LEVELS, TESTS } from "@/lib/portal/journey";
import { FormError, SubmitButton } from "./FormBits";
import { btnGhost, hint, input, label } from "./ui";

function Saved({ state }: { state: ProfileState }) {
  if (!state?.saved) return null;
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17663a]">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      Saved
    </span>
  );
}

export function AccountForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateAccount, null);
  return (
    <form action={action} className="grid gap-4">
      <label className={label}>
        Full name
        <input name="full_name" required maxLength={120} defaultValue={name} autoComplete="name" className={input} />
      </label>
      <label className={label}>
        Email
        <input value={email} readOnly disabled className={input} />
      </label>
      <label className={label}>
        Mobile number
        <input name="phone" type="tel" maxLength={30} defaultValue={phone} autoComplete="tel" inputMode="tel" className={input} />
      </label>
      <FormError message={state?.error} />
      <div className="flex items-center gap-4">
        <SubmitButton pending="Saving…">Save</SubmitButton>
        <Saved state={state} />
      </div>
    </form>
  );
}

type Row = Record<string, string>;

function Rows({
  name,
  legend,
  columns,
  initial,
  addText,
}: {
  name: string;
  legend: string;
  columns: { key: string; label: string; options?: string[]; placeholder?: string; wide?: boolean }[];
  initial: Row[];
  addText: string;
}) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : []);
  const blank = Object.fromEntries(columns.map((c) => [c.key, ""]));
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-semibold text-deep">{legend}</legend>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((row, i) => (
        <div key={i} className="relative grid gap-3 rounded-2xl bg-mist p-4 pr-12 sm:grid-cols-6">
          {columns.map((c) => (
            <label key={c.key} className={`grid gap-1 text-xs font-semibold text-slate ${c.wide ? "sm:col-span-3" : "sm:col-span-1"} ${c.options ? "sm:col-span-2" : ""}`}>
              {c.label}
              {c.options ? (
                <select value={row[c.key]} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))} className={`${input} py-2.5`}>
                  <option value="">Choose…</option>
                  {c.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={row[c.key]}
                  maxLength={120}
                  placeholder={c.placeholder}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                  className={`${input} py-2.5`}
                />
              )}
            </label>
          ))}
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
            className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-slate hover:bg-white hover:text-[#b42318]"
            aria-label={`Remove row ${i + 1}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {rows.length < 8 && (
        <button type="button" onClick={() => setRows([...rows, { ...blank }])} className={`${btnGhost} justify-self-start`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addText}
        </button>
      )}
    </fieldset>
  );
}

type Details = {
  date_of_birth: string | null;
  city: string | null;
  preferred_countries: string[];
  preferred_level: string | null;
  preferred_course: string | null;
  preferred_intake: string | null;
  academic_history: Row[];
  test_scores: Row[];
  work_experience: string | null;
  funding: string | null;
};

export function StudentDetailsForm({ d }: { d: Details }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateStudentDetails, null);
  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Date of birth
          <input name="date_of_birth" type="date" defaultValue={d.date_of_birth ?? ""} readOnly={!!d.date_of_birth} required className={input} />
          {d.date_of_birth && <span className={hint}>Ask your counsellor if this needs correcting.</span>}
        </label>
        <label className={label}>
          Home city
          <input name="city" maxLength={80} defaultValue={d.city ?? ""} placeholder="For example Mangaluru" className={input} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-deep">Countries you&apos;re interested in</legend>
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-deep ring-1 ring-slate/25 has-[:checked]:bg-teal/10 has-[:checked]:ring-2 has-[:checked]:ring-teal">
              <input type="checkbox" name="countries" value={c.id} defaultChecked={d.preferred_countries.includes(c.id)} className="sr-only" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${c.flag}.svg`} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          Level
          <select name="level" defaultValue={d.preferred_level ?? ""} className={input}>
            <option value="">Choose…</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Intake
          <input name="intake" maxLength={40} defaultValue={d.preferred_intake ?? ""} placeholder="For example Sep 2027" className={input} />
        </label>
        <label className={label}>
          Funding
          <select name="funding" defaultValue={d.funding ?? ""} className={input}>
            <option value="">Choose…</option>
            {FUNDING.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <label className={label}>
        Course or subject
        <input name="course" maxLength={160} defaultValue={d.preferred_course ?? ""} placeholder="For example MSc Data Science" className={input} />
      </label>

      <Rows
        name="education"
        legend="Education so far"
        addText="Add education"
        initial={d.academic_history}
        columns={[
          { key: "level", label: "Level", options: ["10th", "12th", "Diploma", "Bachelor's", "Master's", "Other"] },
          { key: "institution", label: "School or college", wide: true },
          { key: "year", label: "Year", placeholder: "2024" },
          { key: "board", label: "Board or university", wide: true },
          { key: "score", label: "Score", placeholder: "85% or 8.2 CGPA", wide: true },
        ]}
      />
      <Rows
        name="tests"
        legend="Test scores"
        addText="Add a test"
        initial={d.test_scores}
        columns={[
          { key: "test", label: "Test", options: TESTS },
          { key: "score", label: "Overall score", placeholder: "7.0" },
          { key: "date", label: "Date taken", placeholder: "Aug 2026", wide: true },
        ]}
      />
      <label className={label}>
        Work experience <span className="font-normal text-slate">(optional)</span>
        <textarea name="work" rows={3} maxLength={2000} defaultValue={d.work_experience ?? ""} className={input} />
      </label>

      <FormError message={state?.error} />
      <div className="flex items-center gap-4">
        <SubmitButton pending="Saving…">Save profile</SubmitButton>
        <Saved state={state} />
      </div>
    </form>
  );
}
