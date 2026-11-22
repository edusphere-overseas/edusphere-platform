"use server";

import { refresh } from "next/cache";
import { familyContacts, getActor, logActivity } from "@/lib/portal/actor";
import { emails, sendEmail } from "@/lib/portal/email";
import { checklistLabel, DESTINATIONS, stageLabel, STAGES } from "@/lib/portal/journey";
import { serviceByKey, statusLabel } from "@/lib/portal/services";
import { APPLICATION_STATUSES, LEAD_STATUSES, OFFICES, PAYMENT_STATUSES } from "@/lib/staff/context";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; ok?: string } | null;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const RETRY = "Something went wrong. Please refresh the page and try again.";
const NOT_ALLOWED = "You don't have access to change this.";

/** Counsellors and admins only. The database checks every change again with its own access rules. */
async function staffActor() {
  const actor = await getActor();
  return actor?.staff ? actor : null;
}

function dbError(error: { code?: string; message?: string } | null, fallback = RETRY) {
  if (!error) return null;
  if (error.code === "42501") return error.message && !/row-level security|permission denied/i.test(error.message) ? error.message : NOT_ALLOWED;
  if (error.code === "23514") return error.message && !/violates check constraint/i.test(error.message) ? error.message : "Please check the values and try again.";
  console.error("[staff]", error.code, error.message);
  return fallback;
}

// ---------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------

/** Approve a document, or ask the family for a new upload (with a reason they will see). */
export async function reviewDocument(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor) return { error: NOT_ALLOWED };
  const id = str(form, "id", 40);
  const decision = str(form, "decision", 20);
  const reason = str(form, "reason", 500);
  if (!uuid.test(id) || !["approved", "reupload", "under_review"].includes(decision)) return { error: RETRY };
  if (decision === "reupload" && !reason) return { error: "Tell the family what to fix, for example \"the photo is blurred\"." };

  const { data: doc, error } = await actor.supabase
    .from("documents")
    .update({ status: decision, reviewer_reason: decision === "reupload" ? reason : null })
    .eq("id", id)
    .select("student_id, doc_type, label, file_name")
    .single();
  const problem = dbError(error);
  if (problem || !doc) return { error: problem ?? NOT_ALLOWED };

  if (decision === "reupload") {
    const contacts = await familyContacts(doc.student_id);
    const name = checklistLabel(doc.doc_type, DESTINATIONS.map((d) => d.id), doc.label);
    if (contacts.family.length) await emails.documentDecision(contacts.family, name, false, reason);
  }
  refresh();
  return { ok: decision === "approved" ? "Approved." : decision === "reupload" ? "Re-upload requested. The family has been emailed." : "Moved back to review." };
}

// ---------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------

/** Add an application, or change one (stage, status, deadline, note). */
export async function saveApplication(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor) return { error: NOT_ALLOWED };
  const id = str(form, "id", 40);
  const studentId = str(form, "student", 40);
  const values = {
    university: str(form, "university", 160),
    course: str(form, "course", 200),
    country: str(form, "country", 40) || null,
    intake: str(form, "intake", 40) || null,
    stage: str(form, "stage", 20) || "counselling",
    status: str(form, "status", 20) || "active",
    deadline: str(form, "deadline", 10) || null,
    note: str(form, "note", 1000) || null,
  };
  const notify = form.get("notify") === "on";
  if ((id && !uuid.test(id)) || !uuid.test(studentId)) return { error: RETRY };
  if (!values.university) return { error: "Please enter the university." };
  if (!STAGES.some((s) => s.key === values.stage) || !APPLICATION_STATUSES.some((s) => s.key === values.status)) return { error: RETRY };
  if (values.country && !DESTINATIONS.some((d) => d.id === values.country)) return { error: RETRY };
  if (values.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(values.deadline)) return { error: "Please choose a valid deadline." };

  let previousStage: string | null = null;
  if (id) {
    const { data: before } = await actor.supabase.from("applications").select("stage, student_id").eq("id", id).maybeSingle();
    if (!before || before.student_id !== studentId) return { error: NOT_ALLOWED };
    previousStage = before.stage;
    const { error } = await actor.supabase.from("applications").update(values).eq("id", id);
    const problem = dbError(error);
    if (problem) return { error: problem };
  } else {
    const { error } = await actor.supabase.from("applications").insert({ ...values, student_id: studentId, created_by: actor.uid });
    const problem = dbError(error);
    if (problem) return { error: problem };
  }

  let emailed = false;
  if (notify && values.status === "active" && values.stage !== previousStage) {
    const contacts = await familyContacts(studentId);
    if (contacts.family.length) {
      await emails.stageChanged(contacts.family, values.university, stageLabel(values.stage, values.country));
      emailed = true;
    }
  }
  refresh();
  return { ok: `${id ? "Saved" : "Added"}.${emailed ? " The family has been emailed." : ""}` };
}

/** Admins only: remove an application added by mistake. */
export async function deleteApplication(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor || actor.profile.role !== "admin") return { error: "Only an admin can remove an application. Mark it withdrawn instead." };
  const id = str(form, "id", 40);
  if (!uuid.test(id)) return { error: RETRY };
  const { data: app } = await actor.supabase.from("applications").select("student_id, university").eq("id", id).maybeSingle();
  const { error } = await actor.supabase.from("applications").delete().eq("id", id);
  const problem = dbError(error);
  if (problem) return { error: problem };
  if (app) await logActivity(actor.uid, app.student_id, "application_deleted", "application", id, { university: app.university });
  refresh();
  return { ok: "Removed." };
}

// ---------------------------------------------------------------------
// Service requests
// ---------------------------------------------------------------------

/** Move a request through its steps, confirm payment and choose who looks after it. */
export async function updateServiceRequest(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor) return { error: NOT_ALLOWED };
  const id = str(form, "id", 40);
  const status = str(form, "status", 40);
  const payment = str(form, "payment", 20);
  const assignedTo = str(form, "assigned_to", 40);
  const notify = form.get("notify") === "on";
  if (!uuid.test(id) || (assignedTo && !uuid.test(assignedTo))) return { error: RETRY };

  const { data: before } = await actor.supabase.from("service_requests").select("student_id, service, status, price").eq("id", id).maybeSingle();
  if (!before) return { error: NOT_ALLOWED };
  const def = serviceByKey(before.service);
  if (!def || (status !== "cancelled" && !def.steps.some((s) => s.key === status))) return { error: RETRY };
  if (!PAYMENT_STATUSES.some((p) => p.key === payment)) return { error: RETRY };

  const { error } = await actor.supabase
    .from("service_requests")
    .update({ status, payment_status: before.price ? payment : "not_required", assigned_to: assignedTo || null })
    .eq("id", id);
  const problem = dbError(error);
  if (problem) return { error: problem };

  let emailed = false;
  if (notify && status !== before.status) {
    const contacts = await familyContacts(before.student_id);
    if (contacts.family.length) {
      await emails.serviceStatus(contacts.family, def.title, statusLabel(before.service, status));
      emailed = true;
    }
  }
  refresh();
  return { ok: `Saved.${emailed ? " The family has been emailed." : ""}` };
}

// ---------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------

/** Change an enquiry's status; admins also choose the counsellor and office. */
export async function updateLead(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor) return { error: NOT_ALLOWED };
  const id = str(form, "id", 40);
  const status = str(form, "status", 20);
  if (!uuid.test(id) || !LEAD_STATUSES.some((s) => s.key === status)) return { error: RETRY };

  const change: { status: string; assigned_to?: string | null; office?: string } = { status };
  if (actor.profile.role === "admin") {
    const assignedTo = str(form, "assigned_to", 40);
    if (assignedTo && !uuid.test(assignedTo)) return { error: RETRY };
    change.assigned_to = assignedTo || null;
    const office = str(form, "office", 40);
    if (office) {
      if (!OFFICES.some((o) => o.key === office)) return { error: RETRY };
      change.office = office;
    }
  }
  const { data, error } = await actor.supabase.from("leads").update(change).eq("id", id).select("id, name, assigned_to").maybeSingle();
  const problem = dbError(error);
  if (problem) return { error: problem };
  if (!data) return { error: NOT_ALLOWED };
  refresh();
  return { ok: "Saved." };
}

// ---------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------

/** Admins only: choose a student's counsellor and office. */
export async function assignStudent(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor || actor.profile.role !== "admin") return { error: "Only an admin can assign students." };
  const studentId = str(form, "student", 40);
  const counsellorId = str(form, "counsellor", 40);
  const office = str(form, "office", 40) || "mangalore";
  if (!uuid.test(studentId) || (counsellorId && !uuid.test(counsellorId)) || !OFFICES.some((o) => o.key === office)) return { error: RETRY };

  const { data: before } = await actor.supabase.from("student_profiles").select("counsellor_id").eq("user_id", studentId).maybeSingle();
  if (!before) return { error: NOT_ALLOWED };
  if (counsellorId) {
    const { data: c } = await actor.supabase.from("profiles").select("role").eq("id", counsellorId).maybeSingle();
    if (!c || !["admin", "counsellor"].includes(c.role ?? "")) return { error: "Choose a counsellor or admin." };
  }
  const { error } = await actor.supabase.from("student_profiles").update({ counsellor_id: counsellorId || null, office }).eq("user_id", studentId);
  const problem = dbError(error);
  if (problem) return { error: problem };
  await logActivity(actor.uid, studentId, "student_assigned", "student", studentId, { counsellor_id: counsellorId || null, office });

  // Their enquiry follows them, so the counsellor sees it too
  await actor.supabase.from("leads").update({ assigned_to: counsellorId || null, office }).eq("profile_id", studentId);

  if (counsellorId && counsellorId !== before.counsellor_id && counsellorId !== actor.uid) {
    const admin = createAdminClient();
    const [{ data: c }, { data: st }] = await Promise.all([
      admin.from("profiles").select("email, full_name").eq("id", counsellorId).single(),
      admin.from("profiles").select("full_name, email").eq("id", studentId).single(),
    ]);
    if (c?.email) {
      const studentName = st?.full_name || st?.email || "A student";
      await sendEmail({
        to: c.email,
        subject: `New student for you: ${studentName}`,
        heading: `${studentName} is now your student`,
        lines: [`${actor.name} assigned ${studentName} to you in the staff dashboard. You'll now get their messages and service requests.`],
        button: { label: "Open their record", path: `/staff/students/${studentId}` },
      });
    }
  }
  refresh();
  return { ok: "Saved." };
}

// ---------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------

const ROLE_CHOICES = ["admin", "counsellor", "editor", "none"] as const;

/**
 * Admins only: give an existing account a staff role, change it, or remove staff access.
 * Roles can't be changed by anyone through the database directly, so this runs with the
 * server's key, after checking the person asking is an admin.
 */
export async function setRole(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await staffActor();
  if (!actor || actor.profile.role !== "admin") return { error: "Only an admin can change the team." };
  const email = str(form, "email", 254).toLowerCase();
  const role = str(form, "role", 20) as (typeof ROLE_CHOICES)[number];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !ROLE_CHOICES.includes(role)) return { error: "Enter their email address and choose a role." };

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, role, full_name, email, onboarded_at").eq("email", email).maybeSingle();
  if (!target) {
    return { error: `There's no portal account for ${email} yet. Ask them to create one (Sign up, or Continue with Google), then add them here.` };
  }
  if (target.id === actor.uid) return { error: "You can't change your own role. Ask another admin." };
  if ((target.role === "student" || target.role === "parent") && role !== "none" && form.get("confirm") !== "on") {
    return { error: `${email} is a ${target.role} account. Tick the box to confirm it should become a staff account: it will see student records.` };
  }

  const newRole = role === "none" ? null : role;
  const { error } = await admin
    .from("profiles")
    .update({ role: newRole, onboarded_at: newRole ? (target.onboarded_at ?? new Date().toISOString()) : null })
    .eq("id", target.id);
  if (error) {
    console.error("[staff] role change failed:", error.message);
    return { error: RETRY };
  }
  if (newRole) {
    // A team member isn't a prospective student: close their sign-up enquiry
    await admin.from("leads").update({ status: "closed" }).eq("profile_id", target.id).in("status", ["new", "contacted"]);
  } else {
    // No longer staff: hand their students and open work back to the admins
    await admin.from("student_profiles").update({ counsellor_id: null }).eq("counsellor_id", target.id);
    await admin.from("leads").update({ assigned_to: null }).eq("assigned_to", target.id);
    await admin.from("service_requests").update({ assigned_to: null }).eq("assigned_to", target.id);
  }
  await logActivity(actor.uid, null, "role_changed", "profile", target.id, { email, from: target.role, to: newRole });
  refresh();
  const name = target.full_name || target.email;
  return { ok: newRole ? `${name} is now ${newRole === "admin" ? "an admin" : newRole === "editor" ? "a content editor" : "a counsellor"}.` : `${name} no longer has staff access.` };
}
