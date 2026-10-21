"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"} title={theme === "dark" ? "Mode clair" : "Mode sombre"}>
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
