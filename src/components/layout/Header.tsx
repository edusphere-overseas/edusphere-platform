"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, ClipboardCheck, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { eligibilityHref, POPULAR_COURSES, universityHref } from "@/lib/catalogue-shared";

export type NavItem = { href: string; label: string };
export type StudyCountry = {
  id: string;
  name: string;
  flag: string;
  summary: string;
  universities: number;
  courses: number;
  regionLabel: string;
  locations: { value: string; label: string }[];
  top: { id: string; name: string }[];
};
export type StudyMenuProps = { countries: StudyCountry[]; destinationPages: boolean; courseFinder: boolean };

const fmt = (n: number) => n.toLocaleString("en-IN");
const countryHome = (c: StudyCountry, m: StudyMenuProps) => (m.destinationPages ? `/destinations/${c.id}` : `/destinations/${c.id}/universities`);
const listHref = (c: StudyCountry, params: Record<string, string>) => `/destinations/${c.id}/universities?${new URLSearchParams(params)}`;
const courseHref = (c: StudyCountry, p: (typeof POPULAR_COURSES)[number]) =>
  c.courses > 0 ? listHref(c, { level: p.level, subject: p.subject }) : eligibilityHref({ country: c.id, level: p.level, course: p.course });

/**
 * Sticky header. Its layout height never changes (so the page never jumps);
 * only the visible bar gets slimmer once you scroll. The background is a
 * separate layer painted *under* the content (no negative z-index), which
 * Safari on iPhone renders reliably.
 */
export function Header({ nav, study }: { nav: NavItem[]; study: StudyMenuProps }) {
  const destinations = study.countries;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [active, setActive] = useState(destinations[0]?.id ?? "");
  const current = destinations.find((d) => d.id === active) ?? destinations[0];
  const [menuTop, setMenuTop] = useState(72);
  const bar = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setDestOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const measure = () => setMenuTop(Math.max(0, Math.floor(bar.current?.getBoundingClientRect().bottom ?? 72)));
    measure();
    const settle = setTimeout(measure, 350); // again once a scroll or the bar's height change has settled
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(settle);
      document.documentElement.style.overflow = "";
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setDestOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setDestOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const solid = scrolled || open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const hoverOpen = (v: boolean) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (v) setDestOpen(true);
    else closeTimer.current = setTimeout(() => setDestOpen(false), 140);
  };
  const linkClass = (href: string) =>
    `relative whitespace-nowrap rounded-full px-3 py-2 text-[0.84rem] font-medium transition-colors hover:bg-white/5 hover:text-white ${
      isActive(href) ? "text-white" : "text-white/75"
    }`;

  return (
    <header className="pointer-events-none sticky top-0 z-50 h-[4.5rem]">
      <div ref={bar} className={`pointer-events-auto relative transition-[height] duration-300 ${scrolled ? "h-16" : "h-[4.5rem]"}`}>
        <div
          aria-hidden="true"
          className={`absolute inset-0 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
            solid ? "border-white/10 bg-[#0d2236f2] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl" : "border-transparent bg-transparent"
          }`}
        />
        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" aria-label="Edusphere Overseas home" className="rounded-lg" onClick={() => setOpen(false)}>
            <Logo introTarget />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
            {destinations.length > 0 && current && (
              <div ref={destRef} onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen(true)} onPointerLeave={(e) => e.pointerType === "mouse" && hoverOpen(false)}>
                <button
                  type="button"
                  aria-expanded={destOpen}
                  aria-controls="study-menu"
                  onClick={() => setDestOpen((v) => !v)}
                  className={`${linkClass("/destinations")} inline-flex items-center gap-1`}
                >
                  Study abroad
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${destOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <div
                  id="study-menu"
                  className={`absolute inset-x-5 top-full pt-2 transition-[opacity,transform,visibility] duration-200 sm:inset-x-8 ${
                    destOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-[15.5rem_1fr] overflow-hidden rounded-3xl border border-white/10 bg-[#102a42] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                    <ul className="grid content-start gap-0.5 border-r border-white/8 bg-white/[0.02] p-3" aria-label="Countries">
                      {destinations.map((d) => (
                        <li key={d.id}>
                          <Link
                            href={countryHome(d, study)}
                            onPointerEnter={() => setActive(d.id)}
                            onFocus={() => setActive(d.id)}
                            onClick={() => setDestOpen(false)}
                            aria-current={d.id === current.id ? "true" : undefined}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${d.id === current.id ? "bg-white/[0.08] text-white" : "text-white/75 hover:text-white"}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/flags/${d.flag}.svg`} alt="" className="h-5 w-7 shrink-0 rounded-[3px] object-cover ring-1 ring-white/20" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{d.name}</span>
                              <span className="block text-xs text-white/45">{fmt(d.universities)} universities</span>
                            </span>
                            <ChevronRight className={`h-4 w-4 shrink-0 transition ${d.id === current.id ? "text-teal-light" : "opacity-0"}`} aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="p-6">
                      <Link href={countryHome(current, study)} onClick={() => setDestOpen(false)} className="group inline-flex items-center gap-2 text-xl font-extrabold text-white">
                        Study in {current.name}
                        <ArrowRight className="h-5 w-5 text-teal-light transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                      {current.summary && <p className="mt-1 max-w-xl text-sm leading-snug text-white/55">{current.summary}</p>}
                      <div className="mt-5 grid grid-cols-3 gap-6">
                        <MenuColumn title={`Top ${current.regionLabel}`}>
                          {current.locations.map((l) => (
                            <MenuLink key={l.value} href={listHref(current, { loc: l.value })} onClick={() => setDestOpen(false)}>
                              {l.label}
                            </MenuLink>
                          ))}
                        </MenuColumn>
                        <MenuColumn title="Popular courses">
                          {POPULAR_COURSES.map((p) => (
                            <MenuLink key={p.label} href={courseHref(current, p)} onClick={() => setDestOpen(false)}>
                              {p.label}
                            </MenuLink>
                          ))}
                        </MenuColumn>
                        <MenuColumn title="Top universities">
                          {current.top.map((u) => (
                            <MenuLink key={u.id} href={universityHref(u.id)} onClick={() => setDestOpen(false)}>
                              {u.name}
                            </MenuLink>
                          ))}
                        </MenuColumn>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/8 pt-5">
                        <Link
                          href={`/destinations/${current.id}/universities`}
                          onClick={() => setDestOpen(false)}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-deep hover:bg-mist"
                        >
                          All {fmt(current.universities)} universities
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                          href={eligibilityHref({ country: current.id })}
                          onClick={() => setDestOpen(false)}
                          className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light"
                        >
                          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                          Check eligibility
                        </Link>
                        {study.courseFinder && (
                          <Link href="/course-finder" onClick={() => setDestOpen(false)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
                            <Search className="h-4 w-4" aria-hidden="true" />
                            Course finder
                          </Link>
                        )}
                        {study.destinationPages && (
                          <Link href="/destinations" onClick={() => setDestOpen(false)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:text-white">
                            Compare destinations
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <Link
              href="/portal"
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/20 transition hover:bg-white/5 hover:text-white hover:ring-white/40"
            >
              Student login
            </Link>
            <Link
              href="/contact#enquiry"
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-4.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(68,154,168,0.8)] transition hover:bg-teal-light"
            >
              Free consultation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white ring-1 ring-white/15 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        inert={!open}
        style={{ top: menuTop }}
        className={`fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain bg-[#0d2236] transition-[opacity,visibility] duration-300 xl:hidden ${
          open ? "pointer-events-auto visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col px-5 pt-5 pb-10 sm:px-8">
          {destinations.length > 0 && (
            <div className="border-b border-white/8 pb-5">
              <p className="py-2 text-xl font-bold text-white">Study abroad</p>
              <ul className="mt-2 grid gap-2">
                {destinations.map((d) => (
                  <li key={d.id}>
                    <details className="group rounded-2xl bg-white/[0.05] ring-1 ring-white/8">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-3 text-sm font-semibold text-white/90 [&::-webkit-details-marker]:hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/flags/${d.flag}.svg`} alt="" className="h-5 w-7 shrink-0 rounded-[3px] object-cover" />
                        <span className="flex-1">{d.name}</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="grid gap-1 px-3 pb-3 text-sm">
                        {[
                          { href: countryHome(d, study), label: `Study in ${d.name}` },
                          { href: `/destinations/${d.id}/universities`, label: `All ${fmt(d.universities)} universities` },
                          { href: eligibilityHref({ country: d.id }), label: "Check eligibility" },
                          ...d.top.slice(0, 3).map((u) => ({ href: universityHref(u.id), label: u.name })),
                        ].map((l) => (
                          <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-white/75 hover:bg-white/5 hover:text-white">
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="flex items-center justify-between border-b border-white/8 py-4 text-xl font-bold text-white transition-[opacity,transform] duration-500"
              style={{
                transitionDelay: open ? `${60 + i * 35}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(8px)",
              }}
            >
              {item.label}
              <ArrowRight className="h-5 w-5 text-teal-light" aria-hidden="true" />
            </Link>
          ))}
          <div className="mt-8 grid gap-3">
            <Link href="/contact#enquiry" onClick={() => setOpen(false)} className="rounded-full bg-teal px-5 py-3.5 text-center font-semibold text-white">
              Book a free consultation
            </Link>
            <Link href="/portal" onClick={() => setOpen(false)} className="rounded-full px-5 py-3.5 text-center font-semibold text-white ring-1 ring-white/25">
              Student login
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function MenuColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold tracking-[0.16em] text-teal-light/80 uppercase">{title}</p>
      <ul className="mt-3 grid gap-1">{children}</ul>
    </div>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} onClick={onClick} className="block truncate rounded-lg py-1.5 text-sm text-white/75 transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}
