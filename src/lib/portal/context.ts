import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;
export type StudentDetails = Tables<"student_profiles">;

export type FamilyLink = {
  id: string;
  status: string;
  relationship: string;
  requestedVia: string;
  requestedAs: string | null;
  createdAt: string;
  /** the other person: the parent (for a student) or the student (for a parent, once approved) */
  person: { id: string; name: string; email: string; phone: string | null } | null;
};

export type FocusStudent = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  details: StudentDetails | null;
  counsellor: { name: string; email: string } | null;
  hasApprovedParent: boolean;
  isAdult: boolean;
};

export const STUDENT_COOKIE = "es-student";

function isAdult(dob: string | null | undefined) {
  if (!dob) return false;
  const d = new Date(dob + "T00:00:00Z");
  const now = new Date();
  const eighteenth = Date.UTC(d.getUTCFullYear() + 18, d.getUTCMonth(), d.getUTCDate());
  return eighteenth <= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Who is signed in, and which student the portal is showing (the student themselves,
 * or for a parent the linked student they picked). Runs once per request.
 */
export const getPortal = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/sign-in");

  // One database call for the person, their family links and the student in focus
  const chosen = (await cookies()).get(STUDENT_COOKIE)?.value;
  const { data } = await supabase.rpc("portal_context", { p_student: chosen && /^[0-9a-f-]{36}$/i.test(chosen) ? chosen : undefined });
  const ctx = data as unknown as {
    profile: Profile;
    links: FamilyLink[];
    student: (Omit<FocusStudent, "isAdult"> & { details: StudentDetails | null }) | null;
  } | null;
  if (!ctx?.profile) redirect("/sign-in");

  const profile = ctx.profile;
  const role = profile.role;
  const staff = role === "admin" || role === "counsellor" || role === "editor";
  if (!staff && !profile.onboarded_at) redirect("/welcome");

  const links = ctx.links;
  const student: FocusStudent | null = ctx.student
    ? { ...ctx.student, hasApprovedParent: role === "parent" || ctx.student.hasApprovedParent, isAdult: isAdult(ctx.student.details?.date_of_birth) }
    : null;
  const firstName = (profile.full_name || profile.email).split(/[\s@]/)[0];

  return {
    supabase,
    userId,
    profile,
    role,
    staff,
    firstName,
    links,
    students: role === "parent" ? links.filter((l) => l.status === "approved" && l.person).map((l) => ({ id: l.person!.id, name: l.person!.name })) : [],
    student,
    /** Under-18 students need an approved parent before documents are uploaded */
    canUpload: !!student && (role === "parent" || student.isAdult || student.hasApprovedParent),
    uploadBlock:
      !student || role === "parent" || student.isAdult || student.hasApprovedParent
        ? null
        : student.details?.date_of_birth
          ? ("under18" as const)
          : ("no_dob" as const),
  };
});

export type Portal = Awaited<ReturnType<typeof getPortal>>;
