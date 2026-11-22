import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { AccountMenu } from "@/components/portal/AccountMenu";
import { DesktopNav, MobileNav } from "@/components/portal/PortalNav";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { StudentSwitcher } from "@/components/portal/StudentSwitcher";
import { Notice } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Edusphere portal" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  if (!portalConfigured) {
    return (
      <div className="grid min-h-dvh place-items-center bg-deep px-4 [color-scheme:light]">
        <div className="w-full max-w-md">
          <PortalUnavailable />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-dvh bg-mist text-ink [color-scheme:light]">
      <Suspense fallback={<ShellLoading />}>
        <PortalFrame>{children}</PortalFrame>
      </Suspense>
    </div>
  );
}

function HeaderBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-deep/95 pt-[env(safe-area-inset-top)] text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
        <Link href="/portal" aria-label="Portal home" className="shrink-0">
          <Logo showTagline={false} />
        </Link>
        {children}
      </div>
    </header>
  );
}

function ShellLoading() {
  return (
    <>
      <HeaderBar />
      <div className="mx-auto max-w-6xl animate-pulse px-4 pt-8 sm:px-8" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-56 rounded-lg bg-deep/8" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-2xl bg-white" />
          <div className="h-40 rounded-2xl bg-white" />
        </div>
      </div>
    </>
  );
}

async function PortalFrame({ children }: { children: React.ReactNode }) {
  const p = await getPortal();
  return (
    <>
      <HeaderBar>
        <DesktopNav />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {p.students.length > 1 && p.student && <StudentSwitcher students={p.students} current={p.student.id} />}
          <AccountMenu name={p.profile.full_name || p.profile.email} email={p.profile.email} role={p.role ?? "member"} />
        </div>
      </HeaderBar>
      <main id="main" className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-8 sm:pt-10 lg:pb-16">
        {p.staff ? (
          <Notice title="Staff accounts" tone="info">
            Student records for staff open in the admin dashboard, which comes in the next step of the build.{" "}
            <Link href="/admin" className="font-semibold underline">
              Go to the admin portal
            </Link>
          </Notice>
        ) : (
          children
        )}
      </main>
      {!p.staff && <MobileNav />}
    </>
  );
}
