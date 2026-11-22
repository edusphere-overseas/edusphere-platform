import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WelcomeForm } from "@/components/portal/AuthForms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome" };

/** First visit after Google sign-in or an invitation: choose student or parent, and consent. */
export default function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  return (
    <Suspense fallback={<div className="h-[30rem] rounded-3xl bg-white/90" />}>
      <Welcome searchParams={searchParams} />
    </Suspense>
  );
}

async function Welcome({ searchParams }: { searchParams: PageProps<"/welcome">["searchParams"] }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) redirect("/sign-in");
  const [{ data: profile }, { data: details }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, phone, onboarded_at, invited_by").eq("id", uid).single(),
    supabase.from("student_profiles").select("date_of_birth").eq("user_id", uid).maybeSingle(),
  ]);
  if (!profile) redirect("/sign-in");
  if (profile.onboarded_at || ["admin", "counsellor", "editor"].includes(profile.role ?? "")) redirect("/portal");
  const p = await searchParams;
  return (
    <WelcomeForm
      role={profile.role}
      suggestedRole={typeof p.role === "string" ? p.role : undefined}
      name={profile.full_name}
      phone={profile.phone ?? ""}
      dob={details?.date_of_birth ?? ""}
      invited={!!profile.invited_by}
    />
  );
}
