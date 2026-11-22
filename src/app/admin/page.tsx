import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, FilePenLine } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Admin portal",
  robots: { index: false, follow: false },
};

const areas = [
  {
    href: "/admin/content",
    icon: FilePenLine,
    title: "Content",
    text: "Banners, news ticker, offices, contact details, destinations, services, \"Open now\", team and photos.",
    ready: true,
  },
  {
    href: "/staff",
    icon: ClipboardList,
    title: "Students and enquiries",
    text: "The staff dashboard: enquiries, students, documents, applications, service requests and messages.",
    ready: true,
  },
];

export default function AdminHome() {
  return (
    <div className="min-h-dvh bg-deep">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Back to the website">
            <Logo showTagline={false} />
          </Link>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">Admin portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">Welcome back</h1>
        <p className="mt-3 text-white/65">Choose where you want to work.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {areas.map(({ href, icon: Icon, title, text, ready }) =>
            ready ? (
              <Link
                key={title}
                href={href}
                className="group rounded-3xl border border-white/10 bg-panel/70 p-7 transition hover:border-teal-light/40 hover:bg-panel"
              >
                <Icon className="h-7 w-7 text-teal-light" aria-hidden="true" />
                <h2 className="mt-5 flex items-center gap-2 text-xl font-bold text-white">
                  {title}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </Link>
            ) : (
              <div key={title} className="rounded-3xl border border-dashed border-white/12 p-7">
                <Icon className="h-7 w-7 text-white/40" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-bold text-white/70">
                  {title}
                  <span className="ml-3 rounded-full bg-white/8 px-2.5 py-1 align-middle text-xs font-semibold text-white/60">
                    Coming with the portal
                  </span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{text}</p>
              </div>
            ),
          )}
        </div>
        <p className="mt-10 text-sm text-white/45">
          Content uses the Sanity account you were invited to; changes appear on the website within about a minute of
          publishing. The staff dashboard uses your Edusphere portal sign-in.
        </p>
      </main>
    </div>
  );
}
