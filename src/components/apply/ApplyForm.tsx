"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { applyForUniversity, type ApplyState } from "@/app/(site)/apply/actions";
import { FormError, Turnstile } from "@/components/portal/FormBits";
import { btnPrimary, hint, input, label } from "@/components/portal/ui";
import { consentText } from "@/lib/portal/consent";
import { UniversityFields, type CountryOption, type PickedUniversity } from "./UniversityFields";

/** The course finder's "Apply" form for visitors: their choice, their details, and a new portal account. */
export function ApplyForm({
  countries,
  intakes,
  initial,
}: {
  countries: CountryOption[];
  intakes: string[];
  initial: { country?: string; university?: PickedUniversity; typed?: string; course?: string };
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyForUniversity, null);
  const v = state?.values;

  if (state?.done) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal/12 text-teal">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-deep">Application received</h2>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate">
          Thanks! Your counsellor will be in touch about <strong className="text-deep">{state.done.university}</strong>, usually within one working day.
        </p>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate">
          We&apos;ve also sent a link to <strong className="text-deep">{state.done.email}</strong>. Open it to verify your email and choose a password for your
          student portal, where you can follow every stage of your application.
        </p>
        <p className="mt-3 text-sm text-slate">Nothing after a few minutes? Check your spam folder.</p>
        <p className="mt-6 text-sm text-slate">
          Already have an account?{" "}
          <Link href="/sign-in?next=/portal/applications" className="font-semibold text-teal hover:text-navy">
            Sign in to see your applications
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate={false}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-8"
    >
      <fieldset className="grid gap-4">
        <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold text-deep">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-teal text-sm text-white">1</span>
          Where would you like to study?
        </legend>
        <UniversityFields
          countries={countries}
          intakes={intakes}
          initialCountry={v?.country ?? initial.country ?? ""}
          initialUniversity={initial.university ?? null}
          initialTyped={v?.university ?? initial.typed ?? ""}
          initialCourse={v?.course ?? initial.course ?? ""}
          initialIntake={v?.intake ?? ""}
          errorField={state?.field}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold text-deep">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-teal text-sm text-white">2</span>
          Your details
        </legend>
        <label className={label}>
          Full name
          <input name="full_name" required autoComplete="name" maxLength={120} defaultValue={v?.full_name} aria-invalid={state?.field === "full_name" || undefined} className={input} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Date of birth
            <input
              name="date_of_birth"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              defaultValue={v?.date_of_birth}
              aria-invalid={state?.field === "date_of_birth" || undefined}
              className={input}
            />
          </label>
          <label className={label}>
            Mobile number
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              maxLength={30}
              placeholder="+91 …"
              defaultValue={v?.phone}
              aria-invalid={state?.field === "phone" || undefined}
              className={input}
            />
          </label>
        </div>
        <label className={label}>
          Email
          <input name="email" type="email" required autoComplete="email" maxLength={254} defaultValue={v?.email} aria-invalid={state?.field === "email" || undefined} className={input} />
          <span className={hint}>We create your student portal account with this email, so you can follow your application.</span>
        </label>
        <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <label className="flex items-start gap-3 text-sm leading-relaxed text-slate">
          <input name="consent" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-teal" />
          <span>{consentText.student}</span>
        </label>
        <p className="-mt-2 pl-8 text-xs text-slate">
          How we use your data:{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-teal hover:text-navy">
            Privacy policy
          </Link>
        </p>
      </fieldset>

      <div className="grid gap-4">
        <Turnstile resetKey={state} />
        <FormError message={state?.error} />
        <button type="submit" disabled={pending} aria-busy={pending} className={`${btnPrimary} w-full py-3.5 text-base`}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {pending ? "Sending…" : "Send my application"}
        </button>
        <p className="text-center text-xs leading-relaxed text-slate">
          Free of charge. Sending this creates your Edusphere student portal account, so you can upload documents and follow each stage.
        </p>
      </div>
    </form>
  );
}
