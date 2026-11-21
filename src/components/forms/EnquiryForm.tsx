"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappHref } from "@/lib/links";

type Option = { value: string; label: string };

type Props = {
  destinations: Option[];
  offices: Option[];
  whatsapp: string;
};

const levels = ["Bachelor's (undergraduate)", "Master's (postgraduate)", "MBA", "PhD or research", "Diploma or foundation", "Not sure yet"];

function intakeOptions() {
  // Next four intakes from today: computed in the browser so it never goes stale.
  const now = new Date();
  const y = now.getFullYear();
  const list: string[] = [];
  for (const year of [y, y + 1, y + 2]) {
    for (const [m, name] of [[0, "January"], [4, "May"], [8, "September"]] as const) {
      if (new Date(year, m, 1) > now) list.push(`${name} ${year}`);
    }
  }
  return [...list.slice(0, 5), "Later / not sure"];
}

// Values that only exist in the browser (today's date, the page address), read without a hydration mismatch.
const noSubscribe = () => () => {};
let cachedIntakes: string[] | null = null;
const browserIntakes = () => (cachedIntakes ??= intakeOptions());
const serverIntakes = ["Later / not sure"];
const browserQuery = () => window.location.search;
const serverQuery = () => "";

const field =
  "mt-2 block w-full rounded-xl border border-white/15 bg-deep/60 px-4 py-3 text-base text-white placeholder:text-white/35 transition focus:border-teal-light focus:outline-none focus:ring-2 focus:ring-teal-light/30";
const label = "block text-sm font-semibold text-white/85";

/**
 * Enquiry form. Submissions go to Netlify Forms (form "enquiry", declared in
 * public/__forms.html) and arrive by email once notifications are set up.
 */
export function EnquiryForm({ destinations, offices, whatsapp }: Props) {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const intakes = useSyncExternalStore(noSubscribe, browserIntakes, () => serverIntakes);
  const query = useSyncExternalStore(noSubscribe, browserQuery, serverQuery);
  const fromUrl = new URLSearchParams(query).get("destination") ?? "";
  const [picked, setPicked] = useState<string | null>(null);
  const destination = picked ?? (destinations.some((o) => o.value === fromUrl) ? fromUrl : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setState("sending");
    const data = new FormData(form);
    data.set("page", window.location.pathname);
    const dest = destinations.find((o) => o.value === data.get("destination"));
    if (dest) data.set("destination", dest.label);
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-3xl border border-teal-light/30 bg-teal/10 p-8">
        <CheckCircle2 className="h-10 w-10 text-teal-light" aria-hidden="true" />
        <h3 className="text-2xl font-extrabold text-white">Thank you, we&apos;ve got your enquiry</h3>
        <p className="leading-relaxed text-white/75">A counsellor will contact you, usually within one working day. If it&apos;s urgent, message us on WhatsApp.</p>
        <a
          href={whatsappHref(whatsapp, "Hi Edusphere, I've just sent an enquiry on your website.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-light"
        >
          <WhatsAppIcon className="h-4.5 w-4.5" />
          WhatsApp us
        </a>
      </div>
    );
  }

  return (
    <form name="enquiry" method="POST" onSubmit={onSubmit} className="grid gap-5" noValidate={false}>
      <input type="hidden" name="form-name" value="enquiry" />
      <p className="hidden" aria-hidden="true">
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Your name
          <input name="name" required autoComplete="name" className={field} placeholder="Full name" />
        </label>
        <label className={label}>
          Phone or WhatsApp
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" pattern="[0-9+()\-\s]{7,}" className={field} placeholder="+91 …" />
        </label>
      </div>

      <label className={label}>
        Email <span className="font-normal text-white/45">(optional)</span>
        <input name="email" type="email" autoComplete="email" className={field} placeholder="you@example.com" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Where would you like to study?
          <select name="destination" value={destination} onChange={(e) => setPicked(e.target.value)} className={field}>
            <option value="">Not sure yet</option>
            {destinations.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Level of study
          <select name="level" defaultValue="" className={field}>
            <option value="" disabled>
              Choose one
            </option>
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={`grid gap-5 ${offices.length > 1 ? "sm:grid-cols-2" : ""}`}>
        <label className={label}>
          When would you like to start?
          <select name="intake" defaultValue="" className={field}>
            <option value="" disabled>
              Choose an intake
            </option>
            {intakes.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        {offices.length > 1 && (
          <label className={label}>
            Nearest office
            <select name="office" defaultValue={offices[0]?.value} className={field}>
              {offices.map((o) => (
                <option key={o.value} value={o.label}>
                  {o.label}
                </option>
              ))}
              <option value="Online">Online is fine</option>
            </select>
          </label>
        )}
      </div>

      <label className={label}>
        Anything you&apos;d like us to know? <span className="font-normal text-white/45">(optional)</span>
        <textarea name="message" rows={4} className={field} placeholder="Course interests, budget, questions from parents…" />
      </label>

      <label htmlFor={`${id}-consent`} className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
        <input id={`${id}-consent`} name="consent" type="checkbox" value="yes" required className="mt-1 h-4.5 w-4.5 shrink-0 accent-teal" />
        I agree that Edusphere Overseas may contact me by phone, WhatsApp or email about this enquiry. We use your details only to respond to you.
      </label>

      {state === "error" && (
        <p role="alert" className="rounded-xl border border-[#f08a8a]/40 bg-[#f08a8a]/10 px-4 py-3 text-sm text-white">
          Sorry, your enquiry couldn&apos;t be sent just now. Please try again, or{" "}
          <a href={whatsappHref(whatsapp, "Hi Edusphere, I'd like to book a free consultation.")} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            message us on WhatsApp
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light disabled:opacity-70 sm:justify-self-start"
      >
        {state === "sending" ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            Send enquiry
            <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
