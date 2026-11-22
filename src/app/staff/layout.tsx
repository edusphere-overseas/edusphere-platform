import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, FilePenLine, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/Logo";
import { PortalUnavailable } from "@/components/portal/PortalUnavailable";
import { Notice } from "@/components/portal/ui";
import { StaffNav } from "@/components/staff/StaffNav";
import { getStaff, ROLE_LABEL } from "@/lib/staff/context";
import { portalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: { default: "Staff dashboard", template: "%s | Edusphere staff" },
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: LayoutProps<"/staff">) {
  if (!portalConfigured) {
    return (
      <div className="grid grid-cols-1 min-h-dvh place-items-center bg-deep px-4 [color-scheme:light]">
        <div className="w-full max-w-md">
          <PortalUnavailable />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-dvh bg-mist text-ink [color-scheme:light]">
      <Suspense fallback={<ShellLoading />}>
        <StaffFrame>{children}</StaffFrame>
      </Suspense>
    </div>
  );
}

function HeaderBar({ children, below }: { children?: React.ReactNode; below?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-deep/95 pt-[env(safe-area-inset-top)] text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-8">
        <Link href="/staff" aria-label="Staff dashboard home" className="flex shrink-0 items-center gap-3">
          <Logo showTagline={false} />
          <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/75 sm:inline">Staff</span>
        </Link>
        {children}
      </div>
      {below}
    </header>
  );
}

function ShellLoading() {
  return (
    <>
      <HeaderBar />
      <div className="mx-auto max-w-7xl animate-pulse px-4 pt-8 sm:px-8" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-56 rounded-lg bg-deep/8" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white" />
          ))}
        </div>
        <div className="mt-6 h-64 rounded-2xl bg-white" />
      </div>
    </>
  );
}

async function StaffFrame({ children }: { children: React.ReactNode }) {
  const s = await getStaff();
  const name = s.profile.full_name || s.profile.email;
  return (
    <>
      <HeaderBar below={s.allowed && <StaffNav admin={s.isAdmin} variant="bar" />}>
        {s.allowed && <StaffNav admin={s.isAdmin} variant="header" />}
        <details className="group relative ml-auto">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pr-2 pl-1 text-white/85 transition hover:bg-white/8 [&::-webkit-details-marker]:hidden">
            <span className="grid grid-cols-1 h-9 w-9 place-items-center rounded-full bg-teal text-sm font-bold text-white">
              {name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]!.toUpperCase())
                .join("")}
            </span>
            <span className="sr-only">Account menu</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white p-2 text-ink shadow-[0_20px_50px_-20px_rgba(13,34,54,0.5)] ring-1 ring-deep/8">
            <div className="px-3 pt-2 pb-3">
              <p className="truncate font-bold text-deep">{name}</p>
              <p className="truncate text-xs text-slate">{s.profile.email}</p>
              <p className="mt-1 text-xs font-semibold text-teal">{ROLE_LABEL[s.role] ?? "No staff role"}</p>
            </div>
            <div className="h-px bg-deep/8" />
            <Link href="/admin/content" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-deep transition hover:bg-mist">
              <FilePenLine className="h-4.5 w-4.5 text-slate" aria-hidden="true" />
              Website content
            </Link>
            <form action={signOut}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-deep transition hover:bg-mist">
                <LogOut className="h-4.5 w-4.5 text-slate" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </details>
      </HeaderBar>
      <main id="main" className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-8 sm:pt-10">
        {s.allowed ? (
          children
        ) : (
          <div className="mx-auto max-w-xl">
            <Notice tone="warn" title="This area is for Edusphere counsellors and admins">
              {s.role === "editor" ? (
                <>
                  Your account edits website content.{" "}
                  <Link href="/admin/content" className="font-semibold underline">
                    Open Content
                  </Link>
                </>
              ) : (
                <>
                  If you work at Edusphere, ask an admin to add you on the Team page of this dashboard. Students and parents use{" "}
                  <Link href="/portal" className="font-semibold underline">
                    the portal
                  </Link>
                  .
                </>
              )}
            </Notice>
          </div>
        )}
      </main>
    </>
  );
}
