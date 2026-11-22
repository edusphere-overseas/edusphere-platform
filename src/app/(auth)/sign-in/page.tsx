import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/portal/AuthForms";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  if (!portalConfigured) return <PortalUnavailable />;
  return (
    <Suspense fallback={<div className="h-[30rem] rounded-3xl bg-white/90" />}>
      {searchParams.then((p) => (
        <SignInForm next={typeof p.next === "string" ? p.next : undefined} error={typeof p.error === "string" ? p.error : undefined} />
      ))}
    </Suspense>
  );
}
