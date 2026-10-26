"use client";

import { useEffect } from "react";

/**
 * The ⋯ menus are <details data-menu>. Browsers keep them open until you tap the button again;
 * this closes them on a tap anywhere else, on Escape, and when another menu opens.
 */
export function MenuCloser() {
  useEffect(() => {
    const closeAll = (except?: Element | null) => {
      document.querySelectorAll("details[data-menu][open]").forEach((d) => { if (d !== except) d.removeAttribute("open"); });
    };
    const onPointer = (e: PointerEvent) => {
      const inside = (e.target as Element | null)?.closest("details[data-menu]");
      closeAll(inside);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, []);
  return null;
}
