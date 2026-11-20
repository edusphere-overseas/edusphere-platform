"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

type NavItem = { href: string; label: string };

export function Header({ nav }: { nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Background lives on its own layer: a blur on <header> itself would trap the fixed mobile menu */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 border-b transition-[background-color,border-color] duration-300 ${
          scrolled || open
            ? "border-white/10 bg-deep/85 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      />
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Edusphere Overseas home" className="rounded-lg" onClick={() => setOpen(false)}>
          <Logo introTarget />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative whitespace-nowrap rounded-full px-3 py-2 text-[0.84rem] font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
            >
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
            href="/#contact"
            className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-4.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(68,154,168,0.8)] transition hover:bg-teal-light"
          >
            Book a free consultation
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

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto bg-deep/97 backdrop-blur-xl transition-[opacity,visibility] duration-300 xl:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col px-5 pt-4 pb-10 sm:px-8">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-white/8 py-4 text-xl font-bold text-white transition-[opacity,transform] duration-500"
              style={{
                transitionDelay: open ? `${80 + i * 40}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(8px)",
              }}
            >
              {item.label}
              <ArrowRight className="h-5 w-5 text-teal-light" aria-hidden="true" />
            </Link>
          ))}
          <div className="mt-8 grid gap-3">
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="rounded-full bg-teal px-5 py-3.5 text-center font-semibold text-white"
            >
              Book a free consultation
            </Link>
            <Link
              href="/portal"
              onClick={() => setOpen(false)}
              className="rounded-full px-5 py-3.5 text-center font-semibold text-white ring-1 ring-white/25"
            >
              Student login
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
