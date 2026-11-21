import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href: string; label: string };

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string | null;
  crumbs?: Crumb[];
  flag?: string | null;
  children?: React.ReactNode;
  aside?: React.ReactNode;
};

/** Header used by every inner page: breadcrumbs, title, intro and optional actions. */
export function PageHero({ eyebrow, title, intro, crumbs = [], flag, children, aside }: Props) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/8">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-teal/20 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -left-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-navy/35 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-5 pt-8 pb-14 sm:px-8 sm:pt-12 sm:pb-20">
        <nav aria-label="Breadcrumb" className="hero-in" style={{ ["--d" as string]: "0s" }}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-white/50">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-white/75">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="transition hover:text-white">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={`mt-10 grid items-center gap-10 ${aside ? "lg:grid-cols-[1.25fr_1fr]" : ""}`}>
          <div className="max-w-3xl">
            {flag && (
              <span className="hero-in mb-7 block aspect-[4/3] w-20 overflow-hidden rounded-xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ring-1 ring-white/20 sm:w-24" style={{ ["--d" as string]: "0.04s" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${flag}.svg`} alt="" className="h-full w-full object-cover" />
              </span>
            )}
            <span className="hero-in inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-light" style={{ ["--d" as string]: "0.06s" }}>
              <span className="h-px w-6 bg-teal-light/70" aria-hidden="true" />
              {eyebrow}
            </span>
            <h1
              className="hero-in mt-4 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
              style={{ ["--d" as string]: "0.12s" }}
            >
              {title}
            </h1>
            {intro && (
              <p className="hero-in mt-6 max-w-2xl text-lg leading-relaxed text-white/70" style={{ ["--d" as string]: "0.2s" }}>
                {intro}
              </p>
            )}
            {children && (
              <div className="hero-in mt-8" style={{ ["--d" as string]: "0.28s" }}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div className="hero-in" style={{ ["--d" as string]: "0.2s" }}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
