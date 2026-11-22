import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock3, Info } from "lucide-react";
import { DOC_STATUS_LABEL, type DocStatus } from "@/lib/portal/journey";

/** Shared look for the portal (light pages for easy reading on phones). */

export const input =
  "block w-full rounded-xl border border-slate/25 bg-white px-3.5 py-3 text-[0.95rem] text-ink shadow-[inset_0_1px_2px_rgba(13,34,54,0.04)] outline-none transition placeholder:text-slate/55 focus:border-teal focus:ring-3 focus:ring-teal/20 disabled:bg-mist disabled:text-slate";
export const label = "grid gap-1.5 text-sm font-semibold text-deep";
export const hint = "text-xs font-normal leading-relaxed text-slate";
export const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `${btn} bg-teal text-white shadow-[0_8px_20px_-10px_rgba(68,154,168,0.9)] hover:bg-navy`;
export const btnDark = `${btn} bg-deep text-white hover:bg-navy`;
export const btnGhost = `${btn} text-deep ring-1 ring-slate/25 hover:bg-mist`;
export const btnDanger = `${btn} text-[#b42318] ring-1 ring-[#b42318]/25 hover:bg-[#fef3f2]`;

export function Card({ children, className = "", as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" | "li" }) {
  return <Tag className={`rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(13,34,54,0.06),0_8px_24px_-16px_rgba(13,34,54,0.18)] ring-1 ring-deep/6 sm:p-6 ${className}`}>{children}</Tag>;
}

export function PageTitle({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">{title}</h1>
        {intro && <p className="mt-2 leading-relaxed text-slate">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

const tone = {
  missing: { cls: "bg-slate/10 text-slate", Icon: Circle },
  under_review: { cls: "bg-[#fff4e5] text-[#9a5b00]", Icon: Clock3 },
  approved: { cls: "bg-[#e7f6ee] text-[#17663a]", Icon: CheckCircle2 },
  reupload: { cls: "bg-[#fdecec] text-[#b42318]", Icon: AlertTriangle },
} as const;

export function DocBadge({ status }: { status: DocStatus }) {
  const { cls, Icon } = tone[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {DOC_STATUS_LABEL[status]}
    </span>
  );
}

export function Pill({ children, tone: t = "slate" }: { children: ReactNode; tone?: "slate" | "teal" | "amber" | "green" | "red" }) {
  const cls = {
    slate: "bg-slate/10 text-slate",
    teal: "bg-teal/12 text-navy",
    amber: "bg-[#fff4e5] text-[#9a5b00]",
    green: "bg-[#e7f6ee] text-[#17663a]",
    red: "bg-[#fdecec] text-[#b42318]",
  }[t];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{children}</span>;
}

export function Notice({ children, tone: t = "info", title }: { children: ReactNode; tone?: "info" | "warn" | "ok"; title?: string }) {
  const cls = {
    info: "border-teal/25 bg-teal/8 text-deep",
    warn: "border-[#f5b041]/40 bg-[#fff8eb] text-[#5c3b00]",
    ok: "border-[#17663a]/20 bg-[#e7f6ee] text-[#0f4d2b]",
  }[t];
  const Icon = t === "warn" ? AlertTriangle : t === "ok" ? CheckCircle2 : Info;
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-relaxed ${cls}`} role={t === "warn" ? "alert" : "status"}>
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate/30 bg-white/60 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">{icon}</div>
      <p className="mt-4 font-bold text-deep">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-sm leading-relaxed text-slate">{children}</div>}
    </div>
  );
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  if (isNaN(+d)) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
    timeZone: value.length === 10 ? undefined : "Asia/Kolkata",
  });
}
