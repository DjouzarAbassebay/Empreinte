import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import { IconLogout } from "./Icons";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function Nav({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";
  const name = profile.full_name || profile.email;
  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="bar">
            <Logo />
            <div className="nav-links">
              <NavLinks isAdmin={isAdmin} />
            </div>
            <div className="nav-right">
              <span className="nav-user" title={profile.email}>{name}</span>
              <ThemeToggle />
              <form action={signOut}>
                <button type="submit" className="icon-btn" aria-label="Se déconnecter" title="Se déconnecter">
                  <IconLogout />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <nav className="nav-mobile" aria-label="Navigation">
        <NavLinks isAdmin={isAdmin} mobile />
      </nav>
    </>
  );
}
