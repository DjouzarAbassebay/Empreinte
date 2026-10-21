"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/formation", label: "Formation" },
  { href: "/admin/ressources", label: "Ressources" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="admin-tabs">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={(t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href)) ? "active" : undefined}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
