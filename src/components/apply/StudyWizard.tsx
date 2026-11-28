"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Info, Loader2, MailCheck, PencilLine, Sparkles, XCircle } from "lucide-react";
import { applyForUniversity, type ApplyState } from "@/app/(site)/apply/actions";
import { checkEligibility, type EligibilityState } from "@/app/(site)/check-eligibility/actions";
import { FormError, Turnstile } from "@/components/portal/FormBits";
import { btnGhost, btnPrimary, hint, input, label } from "@/components/portal/ui";
import { applyHref, lakh, LEVELS, levelShort, universityHref } from "@/lib/catalogue-shared";
import { ENGLISH_TESTS, QUALIFICATIONS, SCORE_SCALES, countryShort } from "@/lib/eligibility";
import { consentText } from "@/lib/portal/consent";
import { UniversityFields, type CountryOption, type PickedUniversity } from "./UniversityFields";

type Mode = "eligibility" | "apply";
type Initial = { country?: string; level?: string; university?: PickedUniversity; typed?: string; course?: string };

const STEPS = ["Your plans", "Your education", "Your details"];
const STEP_OF: Record<string, number> = {
  country: 0,
  level: 0,
  university: 0,
  intake: 0,
  qualification: 1,
  score: 1,
  scale: 1,
  test_score: 1,
  passing_year: 1,
};

const LEVEL_HINTS: Record<string, string> = {
  foundation: "A year before a degree",
  diploma: "1 to 2 years, practical",
  bachelor: "Undergraduate degree",
  pgcert: "Shorter, after a degree",
  master: "MS, MSc, MBA, MA",
  doctorate: "Research degree",
};

/**
 * The step-by-step eligibility check and apply form (three steps, one form).
 * "eligibility": shows an indicative result, then lets the student apply in one click.
 * "apply": creates the student's portal account and the application straight away.
 * `portalUser`: already signed in as a student or parent, so "Apply" goes to the portal's form.
 */
export function StudyWizard({
  mode,
  countries,
  intakes,
  mainIntakes,
  initial,
  signInHref,
  today,
  portalUser = false,
}: {
  mode: Mode;
  countries: CountryOption[];
  intakes: string[];
  mainIntakes: Record<string, string[]>;
  initial: Initial;
  signInHref: string;
  today: string;
  portalUser?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(initial.country ?? "");
  const [level, setLevel] = useState(initial.level ?? "");
  const [qualification, setQualification] = useState("");
  const [scale, setScale] = useState("percent");
  const [test, setTest] = useState("");
  const [intake, setIntake] = useState("");
  const [local, setLocal] = useState<{ field: string; message: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [snap, setSnap] = useState({ dob: false, course: "" });

  const [elig, checkAction, checking] = useActionState<EligibilityState, FormData>(async (prev, data) => {
    const next = await checkEligibility(prev, data);
    if (next?.field && STEP_OF[next.field] !== undefined) setStep(STEP_OF[next.field]);
    if (next?.result) setEditing(false);
    return next;
  }, null);
  const [applied, applyAction, applying] = useActionState<ApplyState, FormData>(async (prev, data) => {
    const next = await applyForUniversity(prev, data);
    if (next?.field && STEP_OF[next.field] !== undefined && mode === "apply") setStep(STEP_OF[next.field]);
    return next;
  }, null);

  if (applied?.done) return <ApplyDone email={applied.done.email} university={applied.done.university} />;

  const showResult = mode === "eligibility" && elig?.result && !editing;
  const serverError = mode === "eligibility" ? elig?.error : applied?.error;
  const errorField = local?.field ?? (mode === "eligibility" ? elig?.field : applied?.field);
  const scaleInfo = SCORE_SCALES.find((s) => s.id === scale)!;
  const testInfo = ENGLISH_TESTS.find((t) => t.id === test);
  const pg = ["pgcert", "master", "doctorate"].includes(level);

  const value = (name: string) => {
    const el = form.current?.elements.namedItem(name);
    return el && "value" in el ? String(el.value).trim() : "";
  };
  const fail = (field: string, message: string) => {
    setLocal({ field, message });
    const el = form.current?.querySelector<HTMLElement>(`[name="${field}"]`);
    el?.focus();
    return false;
  };
  const validate = (s: number) => {
    setLocal(null);
    if (s === 0) {
      if (!country) return fail("country", "Please choose a country.");
      if (!level) return fail("level", "Please choose what you'd like to study.");
      if (mode === "apply" && !value("university_ref") && value("university").length < 2) return fail("university", "Choose a university from the list, or type its name.");
    }
    if (s === 1) {
      if (!qualification) return fail("qualification", "Please choose your highest qualification.");
      const score = Number.parseFloat(value("score"));
      if (!(score > 0) || score > scaleInfo.max) return fail("score", `Please enter your marks (up to ${scaleInfo.max}).`);
      if (!test) return fail("test", "Please tell us about your English test.");
      if (testInfo && test !== "none") {
        const t = Number.parseFloat(value("test_score"));
        if (!(t > 0) || t > testInfo.max) return fail("test_score", `Please enter your ${testInfo.label} score (up to ${testInfo.max}).`);
      }
    }
    if (s === 2) {
      if (!value("full_name")) return fail("full_name", "Please enter your full name.");
      if (!/^[0-9+()\-\s]{7,30}$/.test(value("phone"))) return fail("phone", "Please enter your mobile number.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value("email"))) return fail("email", "Please enter a valid email address.");
      if (mode === "apply" && !value("date_of_birth")) return fail("date_of_birth", "Please enter your date of birth.");
      const consent = form.current?.elements.namedItem("consent") as HTMLInputElement | null;
      if (!consent?.checked) return fail("consent", mode === "apply" ? "Please tick the consent box to send your application." : "Please tick the consent box to see your result.");
    }
    return true;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate(step)) return;
    if (step < 2) {
      setStep(step + 1);
      requestAnimationFrame(() => form.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
      return;
    }
    const data = new FormData(e.currentTarget);
    setSnap({ dob: !!data.get("date_of_birth"), course: String(data.get("course") ?? "") });
    startTransition(() => (mode === "eligibility" ? checkAction(data) : applyAction(data)));
  };

  /** Apply from the result screen: everything from the check, plus the chosen university */
  const applyFrom = (panel: HTMLFormElement, pick: { id?: string; name?: string } | null, headline: string) => {
    if (!form.current) return;
    const data = new FormData(form.current);
    for (const [k, v] of new FormData(panel)) if (k !== "university_ref" && k !== "university" && k !== "course") data.set(k, v);
    if (pick) {
      data.set("university_ref", pick.id ?? "");
      data.set("university", pick.id ? "" : (pick.name ?? ""));
    } else {
      const panelData = new FormData(panel);
      data.set("university_ref", String(panelData.get("university_ref") ?? ""));
      data.set("university", String(panelData.get("university") ?? ""));
      if (panelData.get("course")) data.set("course", String(panelData.get("course")));
    }
    data.set("eligibility", headline);
    startTransition(() => applyAction(data));
  };

  const pending = checking || applying;
  const err = (f: string) => (errorField === f ? { "aria-invalid": true as const } : {});

  return (
    <div>
      {showResult && elig?.result && (
        <EligibilityResultView
          result={elig.result}
          country={country}
          level={level}
          countries={countries}
          intakes={intakes}
          needsDob={!snap.dob}
          today={today}
          course={snap.course}
          portalUser={portalUser}
          applying={applying}
          applyError={applied?.error}
          applyState={applied}
          onApply={applyFrom}
          onEdit={(toLevel) => {
            if (toLevel) setLevel(toLevel);
            setEditing(true);
            setStep(0);
          }}
        />
      )}

      <form ref={form} noValidate onSubmit={onSubmit} hidden={!!showResult} className="scroll-mt-28">
        <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <span className={`block h-1.5 rounded-full transition-colors ${i <= step ? "bg-teal" : "bg-deep/10"}`} />
              <span className={`mt-2 block text-xs font-semibold ${i === step ? "text-deep" : "text-slate"}`}>
                <span className="sr-only">Step </span>
                {i + 1}. {s}
              </span>
            </li>
          ))}
        </ol>

        {/* Step 1: plans */}
        <fieldset hidden={step !== 0} className="grid gap-6">
          <legend className="mb-5 text-xl font-extrabold text-deep">
            {mode === "eligibility" ? "Where would you like to study?" : "Where are you applying?"}
          </legend>
          <div role="radiogroup" aria-label="Country" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {countries.map((c) => (
              <Tile key={c.id} name="country" value={c.id} checked={country === c.id} onChange={() => setCountry(c.id)} invalid={errorField === "country"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${c.flag}.svg`} alt="" className="h-5 w-7 shrink-0 rounded-[3px] object-cover ring-1 ring-deep/10" />
                <span className="font-semibold text-deep">{countryShort(c.id).replace(/^the /, "")}</span>
              </Tile>
            ))}
          </div>

          <div>
            <p className="mb-2.5 text-sm font-semibold text-deep">What would you like to study?</p>
            <div role="radiogroup" aria-label="Study level" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <Tile key={l.id} name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} invalid={errorField === "level"} stacked>
                  <span className="font-semibold text-deep">{l.short}</span>
                  <span className="text-xs text-slate">{LEVEL_HINTS[l.id]}</span>
                </Tile>
              ))}
            </div>
          </div>

          <UniversityFields
            key={country}
            countries={countries}
            intakes={intakes}
            fixedCountry={country}
            optional={mode === "eligibility"}
            showIntake={false}
            initialUniversity={country === initial.country ? (initial.university ?? null) : null}
            initialTyped={country === initial.country ? (initial.typed ?? "") : ""}
            initialCourse={initial.course ?? ""}
            errorField={errorField}
          />

          <div>
            <p className="mb-2.5 text-sm font-semibold text-deep">When would you like to start?</p>
            <input type="hidden" name="intake" value={intake} />
            <div className="flex flex-wrap gap-2">
              {["", ...intakes.slice(0, 6)].map((i) => {
                const main = i && (mainIntakes[country] ?? []).includes(i.split(" ")[0]);
                return (
                  <button
                    key={i || "none"}
                    type="button"
                    aria-pressed={intake === i}
                    onClick={() => setIntake(i)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                      intake === i ? "bg-teal text-white ring-teal" : "bg-white text-deep ring-slate/25 hover:ring-teal/60"
                    }`}
                  >
                    {i || "Not sure yet"}
                    {main && <span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${intake === i ? "bg-white/20" : "bg-teal/10 text-teal"}`}>Main intake</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        {/* Step 2: education */}
        <fieldset hidden={step !== 1} className="grid gap-6">
          <legend className="mb-5 text-xl font-extrabold text-deep">Your education</legend>
          <div>
            <p className="mb-2.5 text-sm font-semibold text-deep">Your highest qualification</p>
            <div role="radiogroup" aria-label="Highest qualification" className="grid gap-2.5 sm:grid-cols-2">
              {QUALIFICATIONS.map((q) => (
                <Tile key={q.id} name="qualification" value={q.id} checked={qualification === q.id} onChange={() => setQualification(q.id)} invalid={errorField === "qualification"}>
                  <span className="font-semibold text-deep">{q.label}</span>
                </Tile>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={label}>
              <span>Your marks</span>
              <div role="radiogroup" aria-label="Marks as" className="flex gap-1 rounded-xl bg-mist p-1">
                {SCORE_SCALES.map((s) => (
                  <label key={s.id} className={`flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-center text-xs font-semibold ${scale === s.id ? "bg-white text-deep shadow-sm" : "text-slate"}`}>
                    <input type="radio" name="scale" value={s.id} checked={scale === s.id} onChange={() => setScale(s.id)} className="sr-only" />
                    {s.id === "percent" ? "%" : s.id === "cgpa10" ? "CGPA /10" : "GPA /4"}
                  </label>
                ))}
              </div>
              <input
                name="score"
                type="number"
                inputMode="decimal"
                min={0}
                max={scaleInfo.max}
                step={scaleInfo.step}
                placeholder={scale === "percent" ? "e.g. 72" : scale === "cgpa10" ? "e.g. 7.8" : "e.g. 3.2"}
                {...err("score")}
                className={input}
              />
              <span className={hint}>{qualification === "12th" ? "Your 12th (PUC) result." : "Your overall result for your highest qualification."}</span>
            </div>
            <label className={label}>
              <span>
                Year you finished <span className="font-normal text-slate">(or will finish)</span>
              </span>
              <input name="passing_year" type="number" inputMode="numeric" min={1970} max={2035} placeholder="e.g. 2025" {...err("passing_year")} className={input} />
            </label>
          </div>

          <div>
            <p className="mb-2.5 text-sm font-semibold text-deep">English test</p>
            <div role="radiogroup" aria-label="English test" className="flex flex-wrap gap-2">
              {ENGLISH_TESTS.map((t) => (
                <label
                  key={t.id}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal ${
                    test === t.id ? "bg-teal text-white ring-teal" : `bg-white text-deep hover:ring-teal/60 ${errorField === "test" ? "ring-[#b42318]/60" : "ring-slate/25"}`
                  }`}
                >
                  <input type="radio" name="test" value={t.id} checked={test === t.id} onChange={() => setTest(t.id)} className="sr-only" />
                  {t.id === "none" ? "Not taken yet" : t.label.replace(" Academic", "").replace(" English Test", "")}
                </label>
              ))}
            </div>
            {testInfo && test !== "none" && (
              <label className={`${label} mt-4 max-w-xs`}>
                Overall {testInfo.label} score
                <input
                  name="test_score"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={testInfo.max}
                  step={testInfo.step}
                  placeholder={test === "ielts" ? "e.g. 6.5" : test === "pte" ? "e.g. 58" : test === "toefl" ? "e.g. 90" : "e.g. 110"}
                  {...err("test_score")}
                  className={input}
                />
              </label>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {qualification && qualification !== "12th" && (
              <label className={label}>
                <span>
                  Backlogs <span className="font-normal text-slate">(subjects not cleared first time)</span>
                </span>
                <input name="backlogs" type="number" inputMode="numeric" min={0} max={99} defaultValue={0} className={input} />
              </label>
            )}
            <label className={label}>
              <span>
                Your city <span className="font-normal text-slate">(optional)</span>
              </span>
              <input name="city" maxLength={80} autoComplete="address-level2" placeholder="e.g. Mangaluru" className={input} />
            </label>
          </div>
          {pg && qualification === "12th" && (
            <p className="flex items-start gap-2 rounded-xl bg-mist p-3 text-sm text-slate">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              {levelShort(level)} programmes usually need a bachelor&apos;s degree first. You can still continue: we&apos;ll show you the options.
            </p>
          )}
        </fieldset>

        {/* Step 3: contact */}
        <fieldset hidden={step !== 2} className="grid gap-4">
          <legend className="mb-5 text-xl font-extrabold text-deep">{mode === "eligibility" ? "Where should we send your result?" : "Your details"}</legend>
          <label className={label}>
            Full name
            <input name="full_name" maxLength={120} autoComplete="name" {...err("full_name")} className={input} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Mobile number
              <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} placeholder="+91 …" {...err("phone")} className={input} />
            </label>
            <label className={label}>
              <span>
                Date of birth {mode === "eligibility" && <span className="font-normal text-slate">(needed when you apply)</span>}
              </span>
              <input name="date_of_birth" type="date" max={today} {...err("date_of_birth")} className={input} />
            </label>
          </div>
          <label className={label}>
            Email
            <input name="email" type="email" autoComplete="email" maxLength={254} {...err("email")} className={input} />
            {mode === "apply" && <span className={hint}>We create your student portal account with this email, so you can follow your application.</span>}
          </label>
          <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <label className="flex items-start gap-3 text-sm leading-relaxed text-slate">
            <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-teal" {...err("consent")} />
            <span>{consentText.student}</span>
          </label>
          <p className="-mt-2 pl-8 text-xs text-slate">
            How we use your data:{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-teal hover:text-navy">
              Privacy policy
            </Link>
          </p>
          {mode === "apply" && step === 2 && <Turnstile resetKey={applied} />}
        </fieldset>

        <div className="mt-7 grid gap-4">
          <FormError message={local?.message ?? serverError} />
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className={btnGhost}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            )}
            <button type="submit" disabled={pending} aria-busy={pending} className={`${btnPrimary} flex-1 py-3.5 text-base`}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {step < 2 ? "Next" : pending ? (mode === "apply" ? "Sending…" : "Checking…") : mode === "apply" ? "Send my application" : "Check my eligibility"}
              {step < 2 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <p className="text-center text-xs leading-relaxed text-slate">
            {mode === "apply"
              ? "Free of charge. Sending this creates your Edusphere student portal account, so you can upload documents and follow each stage."
              : "Free, and takes two minutes. A counsellor may call to talk through your options."}
          </p>
        </div>
        <p className="mt-5 border-t border-deep/8 pt-5 text-center text-sm text-slate">
          Already have an account?{" "}
          <Link href={signInHref} className="font-semibold text-teal hover:text-navy">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function Tile({
  name,
  value,
  checked,
  onChange,
  invalid,
  stacked,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  invalid?: boolean;
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`relative flex cursor-pointer rounded-xl bg-white px-3.5 py-3 text-sm ring-1 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal ${
        stacked ? "flex-col gap-0.5" : "items-center gap-2.5"
      } ${checked ? "bg-teal/6 ring-2 ring-teal" : invalid ? "ring-[#b42318]/50" : "ring-slate/25 hover:ring-teal/60"}`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
      {checked && <Check className="absolute top-2 right-2 h-4 w-4 text-teal" aria-hidden="true" />}
    </label>
  );
}

const VERDICT = {
  strong: { Icon: Sparkles, tone: "bg-teal/10 text-teal ring-teal/25" },
  good: { Icon: CheckCircle2, tone: "bg-teal/10 text-teal ring-teal/25" },
  possible: { Icon: Info, tone: "bg-[#fff4e5] text-[#9a5b00] ring-[#9a5b00]/20" },
  pathway: { Icon: Info, tone: "bg-navy/8 text-navy ring-navy/20" },
  not_yet: { Icon: AlertTriangle, tone: "bg-navy/8 text-navy ring-navy/20" },
} as const;

function EligibilityResultView({
  result,
  country,
  level,
  countries,
  intakes,
  needsDob,
  today,
  course,
  portalUser,
  applying,
  applyError,
  applyState,
  onApply,
  onEdit,
}: {
  result: NonNullable<NonNullable<EligibilityState>["result"]>;
  country: string;
  level: string;
  countries: CountryOption[];
  intakes: string[];
  needsDob: boolean;
  today: string;
  course: string;
  portalUser: boolean;
  applying: boolean;
  applyError?: string;
  applyState: ApplyState;
  onApply: (panel: HTMLFormElement, pick: { id?: string; name?: string } | null, headline: string) => void;
  onEdit: (level?: string) => void;
}) {
  const panel = useRef<HTMLFormElement>(null);
  const [choosing, setChoosing] = useState(false);
  const [local, setLocal] = useState("");
  const v = VERDICT[result.verdict];
  const chosen = result.university ?? (result.typed ? { id: "", name: result.typed } : null);
  const suggestLevel = result.suggestLevel ? LEVELS.find((l) => l.id === result.suggestLevel) : null;

  const go = (pick: { id?: string; name?: string } | null) => {
    setLocal("");
    if (!panel.current) return;
    const dob = panel.current.elements.namedItem("date_of_birth") as HTMLInputElement | null;
    if (dob && !dob.value) {
      setLocal("Please enter your date of birth to apply.");
      dob.focus();
      return;
    }
    if (!pick) {
      const d = new FormData(panel.current);
      if (!d.get("university_ref") && String(d.get("university") ?? "").trim().length < 2) {
        setLocal("Choose a university from the list, or type its name.");
        return;
      }
    }
    onApply(panel.current, pick, result.headline);
  };

  const applyButton = (pick: { id?: string; name?: string }, text: string, primary?: boolean) =>
    portalUser ? (
      <Link href={applyHref({ university: pick.id || undefined, country, course: course || undefined, level })} className={primary ? btnPrimary : btnGhost}>
        {text}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    ) : (
      <button type="button" disabled={applying} onClick={() => go(pick)} className={primary ? btnPrimary : btnGhost}>
        {applying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {text}
        {!applying && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    );

  return (
    <div className="grid gap-6" role="status" aria-live="polite">
      <div className={`flex items-start gap-4 rounded-2xl p-5 ring-1 ${v.tone}`}>
        <v.Icon className="mt-0.5 h-7 w-7 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold tracking-wide uppercase opacity-80">Your indicative result</p>
          <h2 className="mt-1 text-xl font-extrabold text-deep sm:text-2xl">{result.headline}</h2>
          <p className="mt-1.5 leading-relaxed text-slate">{result.summary}</p>
        </div>
      </div>

      <ul className="grid gap-2.5">
        {result.points.map((p) => (
          <li key={p.text} className="flex items-start gap-3 text-sm leading-relaxed text-deep">
            {p.ok === true ? (
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" aria-label="Meets it" />
            ) : p.ok === false ? (
              <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#b42318]" aria-label="Below it" />
            ) : (
              <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#9a5b00]" aria-label="Worth knowing" />
            )}
            <span>{p.text}</span>
          </li>
        ))}
      </ul>

      {result.requirements && (
        <div className="rounded-2xl bg-mist p-4 text-sm leading-relaxed text-slate">
          <p className="font-bold text-deep">
            Typical requirements: {levelShort(level)} in {countryShort(country)}
          </p>
          <p className="mt-1.5">{result.requirements.academic}.</p>
          <p className="mt-1">{result.requirements.english}.</p>
          <p className="mt-2 text-xs">An indicative check from typical entry requirements, not a university&apos;s decision. Your counsellor confirms each university&apos;s rules with you.</p>
        </div>
      )}

      {suggestLevel && (
        <button type="button" onClick={() => onEdit(suggestLevel.id)} className={`${btnGhost} justify-self-start`}>
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Check for {suggestLevel.short} instead
        </button>
      )}

      <form ref={panel} onSubmit={(e) => e.preventDefault()} className="grid gap-4 rounded-2xl p-5 ring-1 ring-deep/10">
        <div>
          <h3 className="text-lg font-extrabold text-deep">Apply with Edusphere, free</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            {portalUser
              ? "Add the university to your application tracker, and your counsellor takes it from there."
              : "We create your student portal account with the details you've given, add the university to your application, and your counsellor calls you."}
          </p>
        </div>
        {!portalUser && needsDob && (
          <label className={`${label} max-w-xs`}>
            Date of birth
            <input name="date_of_birth" type="date" max={today} className={input} />
          </label>
        )}

        {chosen && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal/6 p-4 ring-1 ring-teal/25">
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-teal">Your choice</span>
              {chosen.id ? (
                <Link href={universityHref(chosen.id)} className="font-bold text-deep hover:text-teal">
                  {chosen.name}
                </Link>
              ) : (
                <span className="font-bold text-deep">{chosen.name}</span>
              )}
            </span>
            {applyButton(chosen, `Apply to ${shorten(chosen.name)}`, true)}
          </div>
        )}

        {result.suggestions.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-deep">{chosen ? "Other universities to consider" : "Universities that fit"}</p>
            <ul className="mt-2.5 grid gap-2.5">
              {result.suggestions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5 ring-1 ring-deep/8">
                  <span className="min-w-0">
                    <Link href={universityHref(s.id)} className="block font-semibold text-deep hover:text-teal">
                      {s.name}
                    </Link>
                    <span className="block text-xs text-slate">
                      {[s.place, s.type && (s.type === "public" ? "Public" : "Private"), s.feeInr ? `Tuition ≈ ${lakh(s.feeInr)} a year` : ""].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {applyButton({ id: s.id, name: s.name }, "Apply")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!portalUser &&
          (choosing ? (
            <div className="grid gap-4 border-t border-deep/8 pt-4">
              <UniversityFields countries={countries} intakes={intakes} fixedCountry={country} showIntake={false} initialCourse={course} />
              <button type="button" disabled={applying} onClick={() => go(null)} className={`${btnPrimary} justify-self-start`}>
                {applying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Apply to this university
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setChoosing(true)} className="justify-self-start text-sm font-semibold text-teal hover:text-navy">
              Choose a different university
            </button>
          ))}

        {!portalUser && <Turnstile resetKey={applyState} />}
        <FormError message={local || applyError} />
      </form>

      <button type="button" onClick={() => onEdit()} className="justify-self-start text-sm font-semibold text-slate hover:text-deep">
        <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
        Change my answers
      </button>
    </div>
  );
}

const shorten = (name: string) => (name.length > 34 ? `${name.slice(0, 32).trimEnd()}…` : name);

export function ApplyDone({ email, university }: { email: string; university: string }) {
  return (
    <div className="text-center" role="status">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal/12 text-teal">
        <MailCheck className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-deep">Application received</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate">
        Thanks! Your counsellor will be in touch about <strong className="text-deep">{university}</strong>, usually within one working day.
      </p>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate">
        We&apos;ve also sent a link to <strong className="text-deep">{email}</strong>. Open it to verify your email and choose a password for your student portal, where you can
        follow every stage of your application.
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
