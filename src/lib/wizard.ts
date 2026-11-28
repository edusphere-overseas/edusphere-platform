import "server-only";
import { CATALOGUE_COUNTRIES, getUniversity, isCountry, LEVELS, locationLabel, MAIN_INTAKES } from "@/lib/catalogue";
import { intakeOptions } from "@/lib/intakes";
import { portalConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** What the eligibility check and the apply form start with: the address's choices, and who is signed in. */
export async function wizardSetup(sp: Record<string, string | string[] | undefined>, path: "/apply" | "/check-eligibility") {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 200) : "");
  const u = one("u") ? await getUniversity(one("u")) : null;
  const country = u?.country ?? (isCountry(one("country")) ? one("country") : "");
  const level = LEVELS.some((l) => l.id === one("level")) ? one("level") : "";
  const initial = {
    country,
    level,
    university: u ? { id: u.id, name: u.name, place: [u.city, locationLabel(u.country, u.region)].filter(Boolean).join(", ") } : null,
    typed: u ? "" : one("name").slice(0, 160),
    course: one("course"),
  };
  const back = `${path}${u ? `?u=${u.id}` : country ? `?country=${country}` : ""}`;

  let portal: { kind: "staff" | "family"; name: string; role: string } | null = null;
  if (portalConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const uid = data?.claims?.sub;
    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("role, full_name, onboarded_at").eq("id", uid).maybeSingle();
      if (profile?.role === "admin" || profile?.role === "counsellor" || profile?.role === "editor") portal = { kind: "staff", name: profile.full_name ?? "", role: profile.role };
      else if (profile?.onboarded_at) portal = { kind: "family", name: profile.full_name ?? "", role: profile.role ?? "student" };
    }
  }

  return {
    countries: CATALOGUE_COUNTRIES.map(({ id, name, flag }) => ({ id, name, flag })),
    intakes: intakeOptions(),
    mainIntakes: MAIN_INTAKES,
    today: new Date().toISOString().slice(0, 10),
    initial,
    signInHref: `/sign-in?next=${encodeURIComponent(back)}`,
    portal,
  };
}
