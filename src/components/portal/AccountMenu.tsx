"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound, Users } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

export function AccountMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-deep transition hover:bg-mist";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-white/85 transition hover:bg-white/8"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-sm font-bold text-white">{initials}</span>
        <span className="sr-only">Account menu</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white p-2 text-ink shadow-[0_20px_50px_-20px_rgba(13,34,54,0.5)] ring-1 ring-deep/8">
          <div className="px-3 pt-2 pb-3">
            <p className="truncate font-bold text-deep">{name}</p>
            <p className="truncate text-xs text-slate">{email}</p>
            <p className="mt-1 text-xs font-semibold capitalize text-teal">{role}</p>
          </div>
          <div className="h-px bg-deep/8" />
          <Link role="menuitem" href="/portal/family" className={item} onClick={() => setOpen(false)}>
            <Users className="h-4.5 w-4.5 text-slate" aria-hidden="true" />
            {role === "parent" ? "My children" : "Family"}
          </Link>
          <Link role="menuitem" href="/portal/profile" className={item} onClick={() => setOpen(false)}>
            <UserRound className="h-4.5 w-4.5 text-slate" aria-hidden="true" />
            Profile
          </Link>
          <form action={signOut}>
            <button role="menuitem" type="submit" className={`${item} w-full`}>
              <LogOut className="h-4.5 w-4.5 text-slate" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
