"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export type NavItem = { href: string; label: string };
export type NavDestination = { id: string; name: string; flag: string; summary: string };

/**
 * Sticky header. Its layout height never changes (so the page never jumps);
 * only the visible bar gets slimmer once you scroll. The background is a
 * separate layer painted *under* the content (no negative z-index), which
 * Safari on iPhone renders reliably.
 */
export function Header({ nav, destinations }: { nav: NavItem[]; destinations: NavDestination[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
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
            {destinations.length > 0 && (
              <div ref={destRef} className="relative" onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen(true)} onPointerLeave={(e) => e.pointerType === "mouse" && hoverOpen(false)}>
                <button
                  type="button"
                  aria-expanded={destOpen}
                  aria-controls="dest-menu"
                  onClick={() => setDestOpen((v) => !v)}
                  className={`${linkClass("/destinations")} inline-flex items-center gap-1`}
                >
                  Destinations
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${destOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <div
                  id="dest-menu"
                  className={`absolute top-full left-1/2 w-[34rem] -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] duration-200 ${
                    destOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="rounded-3xl border border-white/10 bg-[#102a42] p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                    <ul className="grid grid-cols-2 gap-1">
                      {destinations.map((d) => (
                        <li key={d.id}>
                          <Link
                            href={`/destinations/${d.id}`}
                            className="group flex items-start gap-3 rounded-2xl p-3 transition hover:bg-white/[0.06]"
                            onClick={() => setDestOpen(false)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/flags/${d.flag}.svg`} alt="" className="flag-wave mt-0.5 h-6 w-8 shrink-0 rounded-[4px] object-cover ring-1 ring-white/20" />
                            <span>
                              <span className="block text-sm font-bold text-white">{d.name}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-white/55">{d.summary}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/destinations"
                      onClick={() => setDestOpen(false)}
                      className="mt-2 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3 text-sm font-semibold text-teal-light transition hover:bg-white/[0.09]"
                    >
                      Compare all destinations
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
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
              <Link href="/destinations" onClick={() => setOpen(false)} className="flex items-center justify-between py-2 text-xl font-bold text-white">
                Destinations
                <ArrowRight className="h-5 w-5 text-teal-light" aria-hidden="true" />
              </Link>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {destinations.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/destinations/${d.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl bg-white/[0.05] px-3 py-2.5 text-sm font-semibold text-white/90 ring-1 ring-white/8"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/flags/${d.flag}.svg`} alt="" className="h-5 w-7 shrink-0 rounded-[3px] object-cover" />
                      <span className="truncate">{d.name}</span>
                    </Link>
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
