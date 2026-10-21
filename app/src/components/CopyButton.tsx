"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./Icons";

export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // Navigateur sans presse-papiers : la sélection manuelle reste possible.
    }
  };
  return (
    <button type="button" className="copy-btn" onClick={copy} aria-live="polite">
      {done ? <IconCheck /> : <IconCopy />}
      {done ? "Copié" : label}
    </button>
  );
}
