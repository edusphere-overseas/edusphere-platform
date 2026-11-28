import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Person = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone" | "role">;

export const STAFF_ROLES = ["admin", "counsellor"] as const;
export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  counsellor: "Counsellor",
  editor: "Content editor",
  student: "Student",
  parent: "Parent",
};

export const displayName = (p?: Pick<Person, "full_name" | "email"> | null) => (p ? p.full_name || p.email : "");

const loadStaff = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("id, full_name, email, phone, role").eq("id", userId).single();
  if (!profile) return null;
  const role = profile.role ?? "";
  return {
    supabase,
    userId,
    profile,
    role,
    allowed: role === "admin" || role === "counsellor",
    isAdmin: role === "admin",
    firstName: (profile.full_name || profile.email).split(/[\s@]/)[0],
  };
});

/**
 * The signed-in staff member (looked up once per request). Admins see every student;
 * counsellors see the students assigned to them. The database access rules enforce this
 * on every query, so these pages only decide what to show.
 */
export async function getStaff(path = "/staff") {
  const staff = await loadStaff();
  if (!staff) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  return staff;
}

export type Staff = Awaited<ReturnType<typeof getStaff>>;

/** Staff members (for "assigned to" lists and names). Staff may see each other's profiles. */
export async function loadTeam(s: Staff) {
  const { data } = await s.supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .in("role", ["admin", "counsellor", "editor"])
    .order("full_name");
  return (data ?? []) as Person[];
}

/** Profiles by id, for showing names next to records. */
export async function loadPeople(s: Staff, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map<string, Person>();
  const { data } = await s.supabase.from("profiles").select("id, full_name, email, phone, role").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, p as Person]));
}

export function ageFrom(dob: string | null | undefined) {
  if (!dob) return null;
  const d = new Date(dob + "T00:00:00Z");
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

/** Offices a student or enquiry can belong to. Add London here when it opens. */
export const OFFICES = [{ key: "mangalore", label: "Mangaluru" }] as const;
export const officeLabel = (key: string | null | undefined) => OFFICES.find((o) => o.key === key)?.label ?? key ?? "";

export const LEAD_STATUSES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "converted", label: "Became a student" },
  { key: "closed", label: "Closed" },
] as const;

export const LEAD_SOURCES: Record<string, string> = {
  website_enquiry: "Website enquiry",
  portal_signup: "Portal sign-up",
  booking: "Booking",
  programme: "Programme enquiry",
  course_finder: "Website application",
  eligibility_check: "Eligibility check",
};

export const APPLICATION_STATUSES = [
  { key: "active", label: "Active" },
  { key: "withdrawn", label: "Withdrawn" },
  { key: "unsuccessful", label: "Unsuccessful" },
] as const;

export const PAYMENT_STATUSES = [
  { key: "not_required", label: "No payment" },
  { key: "awaiting", label: "Awaiting payment" },
  { key: "confirmed", label: "Payment confirmed" },
] as const;

/** Activity log entries in plain words. */
export const ACTION_LABEL: Record<string, string> = {
  onboarded: "Joined the portal",
  link_requested: "Parent link requested",
  link_approved: "Parent link approved",
  link_declined: "Parent link declined",
  link_removed: "Parent link removed",
  document_uploaded: "Uploaded a document",
  document_approved: "Approved a document",
  document_reupload: "Asked for a re-upload",
  document_replaced: "Replaced a document",
  document_deleted: "Deleted a document",
  document_viewed: "Viewed a document",
  document_downloaded: "Downloaded a document",
  application_added: "Added an application",
  application_stage: "Changed an application",
  application_deleted: "Removed an application",
  service_requested: "Requested a service",
  service_status: "Updated a service request",
  student_assigned: "Changed counsellor or office",
  role_changed: "Changed a role",
};
