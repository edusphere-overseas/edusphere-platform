import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getStaff } from "./context";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One student's record, once per request. Counsellors only get students assigned to them:
 * the database returns nothing for anyone else, and the page shows "not found".
 */
export const getStudent = cache(async (id: string) => {
  if (!uuid.test(id)) notFound();
  const s = await getStaff(`/staff/students/${id}`);
  if (!s.allowed) notFound();
  const [{ data: profile }, { data: details }] = await Promise.all([
    s.supabase.from("profiles").select("id, full_name, email, phone, role, created_at, onboarded_at, invited_by").eq("id", id).maybeSingle(),
    s.supabase.from("student_profiles").select("*").eq("user_id", id).maybeSingle(),
  ]);
  if (!profile || !details || profile.role !== "student") notFound();
  return { s, student: profile, details, name: profile.full_name || profile.email };
});

export type StudentRecord = Awaited<ReturnType<typeof getStudent>>;
