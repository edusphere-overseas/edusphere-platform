"use client";

import { chooseStudent } from "@/app/portal/_actions/family";

/** Parents linked to more than one child pick whose records to show. */
export function StudentSwitcher({ students, current }: { students: { id: string; name: string }[]; current: string }) {
  return (
    <form action={chooseStudent} className="min-w-0">
      <label className="sr-only" htmlFor="student-switch">
        Showing records for
      </label>
      <select
        id="student-switch"
        name="student"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-[11rem] truncate rounded-full border border-white/15 bg-white/8 py-2 pr-8 pl-3.5 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-teal-light sm:max-w-[16rem]"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="ml-2 text-sm text-white underline">
          Show
        </button>
      </noscript>
    </form>
  );
}
