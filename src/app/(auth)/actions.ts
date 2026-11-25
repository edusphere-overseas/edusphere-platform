"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/portal/consent";
import { safeNext } from "@/lib/portal/urls";
import { siteOrigin } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  done?: string;
  /** typed values sent back so the form keeps them after an error (never passwords) */
  values?: Record<string, string>;
  unverifiedEmail?: string;
} | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const captcha = (f: FormData) => str(f, "cf-turnstile-response") || undefined;

function friendly(message: string) {
  if (/captcha/i.test(message)) return "The spam check didn't finish. Please wait a moment and try again.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/weak|pwned|password should/i.test(message)) return "Please choose a stronger password (at least 8 characters, mixing letters and numbers).";
  return "Something went wrong. Please try again.";
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const values = { email };
  if (!emailOk(email) || !password) return { error: "Enter your email and password.", values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha(form) } });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Please verify your email first: open the link we sent you.", values, unverifiedEmail: email };
    }
    if (error.code === "invalid_credentials") return { error: "That email and password don't match.", values };
    return { error: friendly(error.message), values };
  }
  redirect(safeNext(str(form, "next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const role = str(form, "role") === "parent" ? "parent" : "student";
  const values = {
    role,
    full_name: str(form, "full_name").slice(0, 120),
    email: str(form, "email").toLowerCase(),
    phone: str(form, "phone").slice(0, 30),
    date_of_birth: str(form, "date_of_birth"),
  };
  const password = String(form.get("password") ?? "");

  if (!values.full_name) return { error: "Please enter your full name.", values };
  if (!emailOk(values.email)) return { error: "Please enter a valid email address.", values };
  if (role === "student") {
    const dob = new Date(values.date_of_birth + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date_of_birth) || isNaN(+dob) || dob > new Date() || dob < new Date("1940-01-02")) {
      return { error: "Please enter your date of birth.", values };
    }
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: "Use at least 8 characters for your password, with letters and numbers.", values };
  }
  if (form.get("consent") !== "on") return { error: "Please tick the consent box to create your account.", values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/confirm`,
      captchaToken: captcha(form),
      data: {
        role,
        full_name: values.full_name,
        phone: values.phone,
        date_of_birth: role === "student" ? values.date_of_birth : undefined,
        consent_version: CONSENT_VERSION,
      },
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { done: values.email };
    return { error: friendly(error.message), values };
  }
  // Same answer whether or not the email already had an account
  return { done: values.email };
}

export async function resendVerification(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  if (!emailOk(email)) return { error: "Please enter a valid email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteOrigin()}/auth/confirm`, captchaToken: captcha(form) },
  });
  if (error && /rate|too many/i.test(error.message)) return { error: friendly(error.message) };
  return { done: email };
}

export async function signInWithGoogle(form: FormData) {
  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  // Supabase only returns to addresses on its allow list, so the request's own address is safe here.
  const origin = host ? `${proto}://${host}` : siteOrigin();
  const next = safeNext(str(form, "next"));
  const role = str(form, "role");
  const target = new URL("/auth/callback", origin);
  target.searchParams.set("next", role === "student" || role === "parent" ? `/welcome?role=${role}` : next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: target.toString(), queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect("/sign-in?error=google");
  redirect(data.url);
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  if (!emailOk(email)) return { error: "Please enter a valid email address.", values: { email } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin()}/auth/confirm`,
    captchaToken: captcha(form),
  });
  if (error && /captcha|rate|too many/i.test(error.message)) return { error: friendly(error.message), values: { email } };
  return { done: email };
}

export async function setNewPassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: "Use at least 8 characters, with letters and numbers." };
  }
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "This link has expired. Please ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password, data: { needs_password: null } });
  if (error) {
    if (error.code === "same_password") return { error: "Please choose a password you haven't used here before." };
    return { error: friendly(error.message) };
  }
  redirect("/portal");
}

export async function completeOnboarding(_: FormState, form: FormData): Promise<FormState> {
  const role = str(form, "role");
  const values = {
    role,
    full_name: str(form, "full_name").slice(0, 120),
    phone: str(form, "phone").slice(0, 30),
    date_of_birth: str(form, "date_of_birth"),
  };
  if (role !== "student" && role !== "parent") return { error: "Please choose student or parent.", values };
  if (!values.full_name) return { error: "Please enter your full name.", values };
  if (role === "student" && !/^\d{4}-\d{2}-\d{2}$/.test(values.date_of_birth)) return { error: "Please enter your date of birth.", values };
  if (form.get("consent") !== "on") return { error: "Please tick the consent box to continue.", values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_role: role,
    p_full_name: values.full_name,
    p_phone: values.phone,
    p_date_of_birth: (role === "student" ? values.date_of_birth : null) as string,
    p_consent_version: CONSENT_VERSION,
  });
  if (error) return { error: error.code === "23514" || error.code === "42501" ? error.message : "Something went wrong. Please try again.", values };
  redirect("/portal");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Google sign-in on our own page (Google's button), so Google shows the website's address
 * instead of the database's. The browser gets a one-time ID token from Google and the
 * server turns it into a session.
 */
export async function signInWithGoogleToken(input: { token: string; nonce: string; next?: string; role?: string }): Promise<{ to?: string; error?: string }> {
  const token = typeof input?.token === "string" ? input.token : "";
  const nonce = typeof input?.nonce === "string" ? input.nonce : "";
  if (!token || token.length > 8192 || !nonce || nonce.length > 200) return { error: "Google sign-in didn't finish. Please try again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token, nonce });
  if (error) {
    console.error("[auth] Google ID token sign-in failed:", error.code, error.message);
    return { error: "Google sign-in didn't finish. Please try again." };
  }
  const role = input.role;
  return { to: role === "student" || role === "parent" ? `/welcome?role=${role}` : safeNext(input.next) };
}
