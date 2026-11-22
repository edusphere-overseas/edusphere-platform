"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base = [
  { href: "/staff", label: "Overview" },
  { href: "/staff/enquiries", label: "Enquiries" },
  { href: "/staff/students", label: "Students" },
];

const isActive = (path: string, href: string) => (href === "/staff" ? path === "/staff" : path === href || path.startsWith(href + "/"));

/** Staff sections: in the header on wide screens, a scrolling bar under it on phones. */
export function StaffNav({ admin, variant }: { admin: boolean; variant: "header" | "bar" }) {
  const path = usePathname();
  const items = admin ? [...base, { href: "/staff/team", label: "Team" }] : base;
  return (
    <nav aria-label="Staff" className={variant === "header" ? "hidden items-center gap-1 lg:flex" : "flex gap-1 overflow-x-auto px-4 pb-3 sm:px-8 lg:hidden"}>
      {items.map(({ href, label }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Tabs on a student's record. */
export function StudentTabs({ id, counts }: { id: string; counts: { documents: number; services: number } }) {
  const path = usePathname();
  const root = `/staff/students/${id}`;
  const tabs = [
    { href: root, label: "Overview" },
    { href: `${root}/documents`, label: "Documents", badge: counts.documents },
    { href: `${root}/applications`, label: "Applications" },
    { href: `${root}/services`, label: "Services", badge: counts.services },
    { href: `${root}/messages`, label: "Messages" },
  ];
  return (
    <nav aria-label="Student record" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-deep/10 px-4 sm:mx-0 sm:px-0">
      {tabs.map(({ href, label, badge }) => {
        const active = href === root ? path === root : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${active ? "border-teal text-deep" : "border-transparent text-slate hover:text-deep"}`}
          >
            {label}
            {!!badge && <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-bold text-[#9a5b00]">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
