"use client";

import { startTransition, useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { addUniversity, type AddUniversityState } from "@/app/portal/_actions/applications";
import { FormError } from "@/components/portal/FormBits";
import { btnPrimary } from "@/components/portal/ui";
import { UniversityFields, type CountryOption, type PickedUniversity } from "./UniversityFields";

/** Signed-in students and parents: add a university to the application tracker. */
export function AddUniversityForm({
  countries,
  intakes,
  initial = {},
  submitLabel = "Add to my applications",
}: {
  countries: CountryOption[];
  intakes: string[];
  initial?: { country?: string; university?: PickedUniversity; typed?: string; course?: string };
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<AddUniversityState, FormData>(addUniversity, null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-4"
    >
      <UniversityFields
        countries={countries}
        intakes={intakes}
        initialCountry={initial.country ?? ""}
        initialUniversity={initial.university ?? null}
        initialTyped={initial.typed ?? ""}
        initialCourse={initial.course ?? ""}
        errorField={state?.field}
      />
      <FormError message={state?.error} />
      <div>
        <button type="submit" disabled={pending} aria-busy={pending} className={btnPrimary}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Adding…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
