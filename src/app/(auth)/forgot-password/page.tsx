import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/portal/AuthForms";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return portalConfigured ? <ForgotPasswordForm /> : <PortalUnavailable />;
}
