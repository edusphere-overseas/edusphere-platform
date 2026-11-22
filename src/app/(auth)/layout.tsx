import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: { default: "Student and parent portal", template: "%s | Edusphere Overseas" },
  robots: { index: false, follow: false },
};

/** Sign-in, sign-up and password pages: a light card on the brand's dark background. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-deep">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-teal/25 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -left-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-navy/40 blur-[120px]" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="Edusphere Overseas home">
          <Logo showTagline={false} />
        </Link>
        <Link href="/" className="text-sm font-semibold text-white/70 transition hover:text-white">
          Back to website
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pt-4 pb-16 sm:items-center sm:px-8 sm:pt-8">
        <div className="w-full max-w-md [color-scheme:light]">{children}</div>
      </main>
    </div>
  );
}
