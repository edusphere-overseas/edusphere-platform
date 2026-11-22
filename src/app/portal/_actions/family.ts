"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getActor } from "@/lib/portal/actor";
import { STUDENT_COOKIE } from "@/lib/portal/context";
import { emails } from "@/lib/portal/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/supabase/env";

export type LinkState = { error?: string; done?: string } | null;

const RELATIONSHIPS = ["Mother", "Father", "Parent", "Guardian"];
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Parent: link by the student's email. Same answer whether or not the email has an account. */
export async function requestLinkByEmail(_: LinkState, form: FormData): Promise<LinkState> {
  const actor = await getActor();
  if (!actor || actor.profile.role !== "parent") return { error: "Only parent accounts can link to a student." };
  const email = str(form, "email").toLowerCase();
  const studentName = str(form, "name").slice(0, 120);
  const relationship = RELATIONSHIPS.includes(str(form, "relationship")) ? str(form, "relationship") : "Parent";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Please enter your child's email address." };
  if (email === actor.profile.email.toLowerCase()) return { error: "Please enter your child's email, not your own." };
  if (!studentName) return { error: "Please enter your child's full name." };
  if (form.get("guardian") !== "on") return { error: "Please confirm you are the parent or legal guardian." };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("request_link_by_email", { p_parent: actor.uid, p_email: email, p_relationship: relationship });
  if (error) return { error: "Something went wrong. Please try again." };
  const result = data as { result: string; link_id?: string; student_id?: string };

  if (result.result === "rate_limited") return { error: "Too many requests. Please try again in an hour." };
  if (result.result === "already_linked") return { error: "You're already linked to this student." };
  if (result.result === "requested" && result.link_id) {
    await emails.linkRequest(email, actor.name);
  }
  if (result.result === "invite") {
    // No account yet: create the student's account and invite them to set a password.
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role: "student", full_name: studentName, invited_by: actor.uid, inviter_name: actor.name },
      redirectTo: `${siteOrigin()}/auth/confirm`,
    });
    if (inviteError || !invited?.user) {
      console.error("[portal] invite failed:", inviteError?.message);
      return { error: "We couldn't send the invitation. Please try again later." };
    }
    const { error: linkError } = await admin.rpc("link_invited_student", {
      p_parent: actor.uid,
      p_student: invited.user.id,
      p_relationship: relationship,
      p_email: email,
    });
    if (linkError) {
      console.error("[portal] linking the invited student failed:", linkError.message);
      return { error: "We couldn't finish the request. Please try again later." };
    }
  }
  refresh();
  return { done: email };
}

/** Parent: link with the code from the student's Family page. */
export async function requestLinkByCode(_: LinkState, form: FormData): Promise<LinkState> {
  const actor = await getActor();
  if (!actor || actor.profile.role !== "parent") return { error: "Only parent accounts can link to a student." };
  const code = str(form, "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const relationship = RELATIONSHIPS.includes(str(form, "relationship")) ? str(form, "relationship") : "Parent";
  if (code.length !== 8) return { error: "The code has 8 letters and numbers, like ABCD-2345." };
  if (form.get("guardian") !== "on") return { error: "Please confirm you are the parent or legal guardian." };

  const { data, error } = await actor.supabase.rpc("request_link_by_code", {
    p_code: code,
    p_relationship: relationship,
    p_guardian_confirmed: true,
  });
  if (error) return { error: "Something went wrong. Please try again." };
  const result = data as { result: string; link_id?: string };
  if (result.result === "rate_limited") return { error: "Too many attempts. Please try again in an hour." };
  if (result.result === "not_found") return { error: "We couldn't find that code. Check it with your child." };
  if (result.result === "already_linked") return { error: "You're already linked to this student." };
  if (result.link_id) {
    const admin = createAdminClient();
    const { data: link } = await admin.from("parent_links").select("student_id").eq("id", result.link_id).single();
    const { data: student } = link ? await admin.from("profiles").select("email").eq("id", link.student_id).single() : { data: null };
    if (student?.email) await emails.linkRequest(student.email, actor.name);
  }
  refresh();
  return { done: "code" };
}

/** Student approves or declines; either side can remove a link. */
export async function updateLink(form: FormData) {
  const actor = await getActor();
  if (!actor) return;
  const id = str(form, "link");
  const action = str(form, "action");
  if (!["approve", "decline", "remove"].includes(action)) return;
  const { data: status, error } = await actor.supabase.rpc("update_parent_link", { p_link: id, p_action: action });
  if (error) return;
  if (status === "approved") {
    const admin = createAdminClient();
    const { data: link } = await admin.from("parent_links").select("parent_id").eq("id", id).single();
    const { data: parent } = link ? await admin.from("profiles").select("email").eq("id", link.parent_id).single() : { data: null };
    if (parent?.email) await emails.linkApproved(parent.email, actor.name);
  }
  refresh();
}

export async function newLinkCode() {
  const actor = await getActor();
  if (!actor || actor.profile.role !== "student") return;
  await actor.supabase.rpc("regenerate_link_code");
  refresh();
}

/** Parent with more than one child: which student the portal shows. */
export async function chooseStudent(form: FormData) {
  const id = str(form, "student");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  (await cookies()).set(STUDENT_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 180 });
  refresh();
}
