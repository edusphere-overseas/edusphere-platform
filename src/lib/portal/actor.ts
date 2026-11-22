import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** The signed-in person, for server actions. Null when signed out. */
export async function getActor() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return null;
  const { data: profile } = await supabase.from("profiles").select("id, role, full_name, email, onboarded_at").eq("id", uid).single();
  if (!profile) return null;
  const staff = profile.role === "admin" || profile.role === "counsellor";
  return { supabase, uid, profile, staff, name: profile.full_name || profile.email };
}

/** Who to email about a student: the student, approved parents and their counsellor. */
export async function familyContacts(studentId: string) {
  try {
    const admin = createAdminClient();
    const [{ data: student }, { data: links }, { data: details }] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", studentId).single(),
      admin.from("parent_links").select("parent_id").eq("student_id", studentId).eq("status", "approved"),
      admin.from("student_profiles").select("counsellor_id").eq("user_id", studentId).maybeSingle(),
    ]);
    const ids = [...(links ?? []).map((l) => l.parent_id), ...(details?.counsellor_id ? [details.counsellor_id] : [])];
    const { data: people } = ids.length ? await admin.from("profiles").select("id, email").in("id", ids) : { data: [] as { id: string; email: string }[] };
    return {
      studentName: student?.full_name || student?.email || "the student",
      family: [student?.email, ...(links ?? []).map((l) => people?.find((p) => p.id === l.parent_id)?.email)].filter(Boolean) as string[],
      counsellorEmail: people?.find((p) => p.id === details?.counsellor_id)?.email ?? null,
    };
  } catch (error) {
    console.error("[portal] could not look up contacts:", error instanceof Error ? error.message : error);
    return { studentName: "the student", family: [] as string[], counsellorEmail: null };
  }
}

/** Write to the activity log (views, downloads and other events without a database trigger). */
export async function logActivity(actorId: string, studentId: string | null, action: string, entity: string, entityId: string | null, details: Record<string, unknown> = {}) {
  try {
    await createAdminClient().from("activity_log").insert({
      actor_id: actorId,
      student_id: studentId,
      action,
      entity,
      entity_id: entityId,
      details: details as never,
    });
  } catch (error) {
    console.error("[portal] activity log failed:", error instanceof Error ? error.message : error);
  }
}
