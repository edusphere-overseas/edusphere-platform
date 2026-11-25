"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { describeChoice, readUniversityChoice } from "@/lib/apply";
import { familyContacts } from "@/lib/portal/actor";
import { getPortal } from "@/lib/portal/context";
import { sendEmail, staffInbox } from "@/lib/portal/email";

export type AddUniversityState = { error?: string; field?: string } | null;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A student (or their parent) adds a university to the student's application tracker, as a shortlist entry. */
export async function addUniversity(_: AddUniversityState, form: FormData): Promise<AddUniversityState> {
  const p = await getPortal();
  if (p.staff) return { error: "Staff add universities from the student's page in the staff dashboard." };
  if (!p.student) return { error: "Link to a student first, then add universities to their list." };
  const choice = await readUniversityChoice(form);
  if (!choice.ok) return { error: choice.error, field: choice.field };
  const c = choice.value;

  const { data: existing } = await p.supabase.from("applications").select("id, university, course, status").eq("student_id", p.student.id);
  if ((existing ?? []).length >= 30) return { error: "Your list is full. Ask your counsellor to tidy it up first." };
  const same = (existing ?? []).find((a) => a.university.toLowerCase() === c.university.toLowerCase() && (a.course ?? "").toLowerCase() === c.course.toLowerCase());
  if (same) return { error: "This university and course are already on your list.", field: "university" };

  const { data, error } = await p.supabase
    .from("applications")
    .insert({
      student_id: p.student.id,
      university: c.university,
      university_ref: c.universityRef,
      country: c.country,
      course: c.course,
      intake: c.intake || null,
      stage: "shortlist",
      status: "active",
      created_by: p.userId,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[portal] add university failed:", error?.code, error?.message);
    return { error: error?.code === "42501" ? "You can't add universities for this student." : "Something went wrong. Please try again." };
  }

  const contacts = await familyContacts(p.student.id);
  const to = contacts.counsellorEmail ?? staffInbox();
  if (to) {
    const who = p.role === "parent" ? `${p.profile.full_name || p.profile.email} (parent of ${contacts.studentName})` : contacts.studentName;
    await sendEmail({
      to,
      subject: `${contacts.studentName} added ${c.university} to their list`,
      heading: "A university was added in the portal",
      lines: [`${who} added this to the application tracker as a shortlist entry:`, describeChoice(c), "Move it to Applied once the application is sent."],
      button: { label: "Open the student", path: `/staff/students/${p.student.id}` },
    });
  }
  redirect(`/portal/applications?added=${data.id}`);
}

/** Remove a university the person added themselves, while it is still on the shortlist. */
export async function removeUniversity(form: FormData) {
  const p = await getPortal();
  const id = String(form.get("id") ?? "");
  if (!uuid.test(id)) return;
  await p.supabase.from("applications").delete().eq("id", id).eq("created_by", p.userId).eq("stage", "shortlist");
  refresh();
}
