import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/portal/AuthForms";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  if (!portalConfigured) return <PortalUnavailable />;
  return (
    <Suspense fallback={<div className="h-[22rem] rounded-3xl bg-white/90" />}>
      {searchParams.then((p) => (
        <NewPasswordForm welcome={p.welcome === "apply" ? "apply" : p.welcome === "1" ? "invite" : undefined} />
      ))}
    </Suspense>
  );
}
