"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconFolder, IconHome, IconPlay, IconSettings } from "./Icons";

const LINKS = [
  { href: "/", label: "Accueil", icon: IconHome },
  { href: "/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/formation", label: "Formation", icon: IconPlay },
  { href: "/ressources", label: "Ressources", icon: IconFolder },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ isAdmin, mobile = false }: { isAdmin: boolean; mobile?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin", icon: IconSettings }] : LINKS;
  return (
    <>
      {links.map(({ href, label, icon: Icon }) => {
        const cls = [isActive(pathname, href) ? "active" : "", href === "/admin" ? "admin" : ""].join(" ").trim();
        return (
          <Link key={href} href={href} className={cls || undefined}>
            {mobile && <Icon />}
            {label}
          </Link>
        );
      })}
    </>
  );
}
