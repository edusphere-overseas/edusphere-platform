import "server-only";
import type { Portal } from "./context";
import { buildChecklist, itemStatus, OTHER_DOC, type ChecklistItem, type DocStatus } from "./journey";
import type { Tables } from "@/lib/supabase/database.types";

/** Anything with a signed-in database client: the portal for families, or the staff dashboard. */
type Db = Pick<Portal, "supabase">;

export type DocRow = Tables<"documents">;
export type ApplicationRow = Tables<"applications">;
export type RequestRow = Tables<"service_requests">;

/** Countries that decide the checklist: from active applications, else the student's preferences. */
export function checklistCountries(apps: Pick<ApplicationRow, "country" | "status">[], preferred: string[] | null | undefined) {
  const fromApps = [...new Set(apps.filter((a) => a.status === "active" && a.country).map((a) => a.country!))];
  return fromApps.length ? fromApps : (preferred ?? []);
}

export async function loadDocuments(p: Db, studentId: string) {
  const { data } = await p.supabase
    .from("documents")
    .select("*")
    .eq("student_id", studentId)
    .not("status", "in", "(uploading,replaced)")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function loadApplications(p: Db, studentId: string) {
  const { data } = await p.supabase.from("applications").select("*").eq("student_id", studentId).order("created_at", { ascending: true });
  return data ?? [];
}

export async function loadRequests(p: Db, studentId: string) {
  const { data } = await p.supabase.from("service_requests").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
  return data ?? [];
}

export type ChecklistEntry = ChecklistItem & { status: DocStatus; files: DocRow[] };

export function checklistWithStatus(items: ChecklistItem[], docs: DocRow[]) {
  const general = docs.filter((d) => !d.service_request_id);
  const entries: ChecklistEntry[] = items.map((item) => {
    const files = general.filter((d) => d.doc_type === item.key);
    return { ...item, files, status: itemStatus(files) };
  });
  // Documents of a kind that's no longer on the checklist still show, under "Other documents"
  const known = new Set(items.map((i) => i.key));
  const others = general.filter((d) => !known.has(d.doc_type));
  const otherEntry: ChecklistEntry = { ...OTHER_DOC, files: others, status: itemStatus(others) };
  const required = entries.filter((e) => e.required);
  return {
    entries,
    other: otherEntry,
    requiredCount: required.length,
    approvedCount: required.filter((e) => e.status === "approved").length,
    reuploadCount: entries.filter((e) => e.status === "reupload").length + (otherEntry.status === "reupload" ? 1 : 0),
    reviewCount: entries.filter((e) => e.status === "under_review").length + (otherEntry.status === "under_review" ? 1 : 0),
  };
}

export function studentChecklist(p: Portal, apps: ApplicationRow[], docs: DocRow[]) {
  const countries = checklistCountries(apps, p.student?.details?.preferred_countries);
  const items = buildChecklist({ countries, level: p.student?.details?.preferred_level });
  return { countries, ...checklistWithStatus(items, docs) };
}
