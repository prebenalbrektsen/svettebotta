"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Uka", icon: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  { href: "/logg", label: "Logg økt", icon: "M12 5v14M5 12h14" },
  { href: "/prat", label: "Prat", icon: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" },
  { href: "/statistikk", label: "Statistikk", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/meg", label: "Meg", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" },
];

export function NavLinks({ isAdmin, mobile, unread = 0, onStrava, adminBadge = 0 }: { isAdmin: boolean; mobile?: boolean; unread?: number; onStrava?: boolean; adminBadge?: number }) {
  const path = usePathname();
  // On Strava the watch logs for you, so the tab is a list of workouts, not a form.
  const base = onStrava ? LINKS.map((l) => (l.href === "/logg" ? { ...l, label: "Økter", icon: "M22 12h-4l-3 9L9 3l-3 9H2" } : l)) : LINKS;
  const links = isAdmin ? [...base, { href: "/admin", label: "Admin", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7.1 19.7l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.3 7.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" }] : base;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const counts: Record<string, number> = { "/prat": unread, "/admin": adminBadge };
  const badge = (href: string) =>
    counts[href] > 0 && !active(href) ? (
      <span className="absolute -top-1 -right-2 min-w-4 rounded-full bg-heat px-1 text-center text-[10px] leading-4 font-bold text-white">{counts[href] > 9 ? "9+" : counts[href]}</span>
    ) : null;
  if (mobile) {
    return (
      <ul className="flex justify-around">
        {links.map((l) => (
          <li key={l.href} className="flex-1">
            <Link href={l.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active(l.href) ? "text-heat" : "text-muted"}`}>
              <span className="relative">{badge(l.href)}<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={l.icon} /></svg></span>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="flex gap-1">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(l.href) ? "bg-ink text-paper" : "text-muted hover:text-ink"} relative`}>{l.label}{badge(l.href)}</Link>
        </li>
      ))}
    </ul>
  );
}
