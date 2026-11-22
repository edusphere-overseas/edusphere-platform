"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, LifeBuoy, ListChecks, MessageCircle } from "lucide-react";

const items = [
  { href: "/portal", label: "Home", Icon: Home },
  { href: "/portal/documents", label: "Documents", Icon: FileText },
  { href: "/portal/applications", label: "Tracker", Icon: ListChecks },
  { href: "/portal/services", label: "Services", Icon: LifeBuoy },
  { href: "/portal/messages", label: "Messages", Icon: MessageCircle },
];

const isActive = (path: string, href: string) => (href === "/portal" ? path === "/portal" : path === href || path.startsWith(href + "/"));

/** Desktop: links in the header. */
export function DesktopNav() {
  const path = usePathname();
  return (
    <nav aria-label="Portal" className="hidden items-center gap-1 lg:flex">
      {items.map(({ href, label }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones and tablets: a tab bar at the bottom of the screen, within thumb reach. */
export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Portal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-deep/8 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(13,34,54,0.35)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(path, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[0.68rem] font-semibold transition ${active ? "text-teal" : "text-slate hover:text-deep"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-teal/12" : ""}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
