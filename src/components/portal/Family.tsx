"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, Mail, RefreshCw, Share2 } from "lucide-react";
import { newLinkCode, requestLinkByCode, requestLinkByEmail, type LinkState } from "@/app/portal/_actions/family";
import { consentText } from "@/lib/portal/consent";
import { FormError, SubmitButton } from "./FormBits";
import { btnGhost, btnPrimary, hint, input, label, Notice } from "./ui";

const relationships = ["Mother", "Father", "Guardian", "Parent"];

function Relationship() {
  return (
    <label className={label}>
      You are their
      <select name="relationship" defaultValue="Mother" className={input}>
        {relationships.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
    </label>
  );
}

function Guardian() {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-slate">
      <input name="guardian" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-teal" />
      <span>{consentText.guardian}</span>
    </label>
  );
}

/** Parent: link to a child by their email (invites them if they have no account) or by their code. */
export function LinkChildForm() {
  const [tab, setTab] = useState<"email" | "code">("email");
  const [emailState, emailAction] = useActionState<LinkState, FormData>(requestLinkByEmail, null);
  const [codeState, codeAction] = useActionState<LinkState, FormData>(requestLinkByCode, null);
  const tabCls = (t: string) =>
    `flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${tab === t ? "bg-white text-deep shadow-sm" : "text-slate hover:text-deep"}`;

  return (
    <div>
      <div role="tablist" aria-label="How to link" className="flex gap-1 rounded-full bg-mist p-1">
        <button role="tab" type="button" aria-selected={tab === "email"} className={tabCls("email")} onClick={() => setTab("email")}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Their email
        </button>
        <button role="tab" type="button" aria-selected={tab === "code"} className={tabCls("code")} onClick={() => setTab("code")}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Their link code
        </button>
      </div>

      {tab === "email" ? (
        emailState?.done ? (
          <div className="mt-5">
            <Notice tone="ok" title="Request sent">
              We&apos;ve emailed {emailState.done}. If they don&apos;t have an account yet, the email invites them to create one. Once they approve, their records appear here.
            </Notice>
          </div>
        ) : (
          <form action={emailAction} className="mt-5 grid gap-4">
            <label className={label}>
              Your child&apos;s full name
              <input name="name" required maxLength={120} autoComplete="off" className={input} />
            </label>
            <label className={label}>
              Your child&apos;s email
              <input name="email" type="email" required autoComplete="off" className={input} />
              <span className={hint}>If they don&apos;t have an account yet, we&apos;ll create one and invite them to set a password.</span>
            </label>
            <Relationship />
            <Guardian />
            <FormError message={emailState?.error} />
            <SubmitButton pending="Sending…">Send request</SubmitButton>
          </form>
        )
      ) : codeState?.done ? (
        <div className="mt-5">
          <Notice tone="ok" title="Request sent">
            Your child needs to approve it in their portal. Their records appear here once they do.
          </Notice>
        </div>
      ) : (
        <form action={codeAction} className="mt-5 grid gap-4">
          <label className={label}>
            Link code
            <input
              name="code"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCD-2345"
              maxLength={12}
              className={`${input} font-mono text-lg tracking-[0.2em] uppercase`}
            />
            <span className={hint}>Your child finds it in their portal under Family.</span>
          </label>
          <Relationship />
          <Guardian />
          <FormError message={codeState?.error} />
          <SubmitButton pending="Checking…">Send request</SubmitButton>
        </form>
      )}
    </div>
  );
}

/** Student: their code, to share with a parent. */
export function LinkCode({ code, signUpUrl }: { code: string; signUpUrl: string }) {
  const pretty = `${code.slice(0, 4)}-${code.slice(4)}`;
  const [copied, setCopied] = useState(false);
  const message = `Please follow my study abroad application on the Edusphere Overseas portal. Create a parent account at ${signUpUrl} and enter my link code: ${pretty}`;

  return (
    <div>
      <p className="font-mono text-3xl font-bold tracking-[0.18em] text-deep sm:text-4xl" aria-label={`Link code ${pretty.split("").join(" ")}`}>
        {pretty}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className={btnGhost}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(pretty);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          {copied ? <Check className="h-4 w-4 text-[#17663a]" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy code"}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Send on WhatsApp
        </a>
        <form action={newLinkCode}>
          <SubmitButton className={btnGhost} pending="Changing…">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            New code
          </SubmitButton>
        </form>
      </div>
      <p className={`${hint} mt-3`}>A new code stops the old one working. Requests already sent stay until you answer them.</p>
    </div>
  );
}
