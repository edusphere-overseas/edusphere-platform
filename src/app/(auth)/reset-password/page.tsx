import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/portal/AuthForms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <Suspense fallback={<div className="h-[22rem] rounded-3xl bg-white/90" />}>
      {searchParams.then((p) => (
        <NewPasswordForm welcome={p.welcome === "1"} />
      ))}
    </Suspense>
  );
}
