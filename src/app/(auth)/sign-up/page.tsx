import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/portal/AuthForms";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  if (!portalConfigured) return <PortalUnavailable />;
  return (
    <Suspense fallback={<div className="h-[40rem] rounded-3xl bg-white/90" />}>
      {searchParams.then((p) => (
        <SignUpForm next={typeof p.next === "string" ? p.next : undefined} initialRole={typeof p.role === "string" ? p.role : undefined} />
      ))}
    </Suspense>
  );
}
