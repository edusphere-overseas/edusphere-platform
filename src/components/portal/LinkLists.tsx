import { Check, UserRound, X } from "lucide-react";
import { updateLink } from "@/app/portal/_actions/family";
import type { FamilyLink } from "@/lib/portal/context";
import { SubmitButton } from "./FormBits";
import { btnDanger, btnGhost, btnPrimary, Card, formatDate, Pill } from "./ui";

/** Student: requests from parents waiting for an answer. */
export function PendingRequests({ links }: { links: FamilyLink[] }) {
  const pending = links.filter((l) => l.status === "pending");
  if (!pending.length) return null;
  return (
    <div className="grid gap-3">
      {pending.map((l) => (
        <Card key={l.id} className="ring-2 ring-teal/40" as="div">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">Request to follow your application</p>
          <p className="mt-2 text-lg font-bold text-deep">
            {l.person?.name ?? "A parent"} <span className="font-medium text-slate">({l.relationship.toLowerCase()})</span>
          </p>
          {l.person && <p className="text-sm text-slate">{[l.person.email, l.person.phone].filter(Boolean).join(" · ")}</p>}
          <p className="mt-3 text-sm leading-relaxed text-slate">
            If you approve, they can see your documents, application stages and service requests, upload documents and message your counsellor. You can remove them at any time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={updateLink}>
              <input type="hidden" name="link" value={l.id} />
              <input type="hidden" name="action" value="approve" />
              <SubmitButton className={btnPrimary} pending="Approving…">
                <Check className="h-4 w-4" aria-hidden="true" />
                Approve
              </SubmitButton>
            </form>
            <form action={updateLink}>
              <input type="hidden" name="link" value={l.id} />
              <input type="hidden" name="action" value="decline" />
              <SubmitButton className={btnGhost} pending="Declining…">
                <X className="h-4 w-4" aria-hidden="true" />
                Decline
              </SubmitButton>
            </form>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Approved links (and, for parents, requests still waiting). */
export function LinkedPeople({ links, viewer }: { links: FamilyLink[]; viewer: "student" | "parent" }) {
  const shown = viewer === "student" ? links.filter((l) => l.status === "approved") : links;
  if (!shown.length) return null;
  return (
    <ul className="divide-y divide-deep/6">
      {shown.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-slate">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-deep">
              {l.status === "approved" ? (l.person?.name ?? "Linked") : (l.requestedAs ?? "Request sent")}
            </p>
            <p className="truncate text-sm text-slate">
              {l.status === "approved"
                ? viewer === "student"
                  ? `${l.relationship} · ${l.person?.email ?? ""}`
                  : `You are their ${l.relationship.toLowerCase()} · ${l.person?.email ?? ""}`
                : `Sent ${formatDate(l.createdAt)} · waiting for them to approve`}
            </p>
          </div>
          {l.status === "approved" ? <Pill tone="green">Linked</Pill> : <Pill tone="amber">Waiting</Pill>}
          <form action={updateLink}>
            <input type="hidden" name="link" value={l.id} />
            <input type="hidden" name="action" value="remove" />
            <SubmitButton className={`${btnDanger} min-h-9 px-3.5 py-1.5`} pending="Removing…">
              {l.status === "approved" ? "Remove" : "Cancel"}
            </SubmitButton>
          </form>
        </li>
      ))}
    </ul>
  );
}
