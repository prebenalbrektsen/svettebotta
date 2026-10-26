"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Keeps a screen current without reloading it on a timer: asks /api/endringer for a tiny
 * fingerprint and only re-renders when it changed. Polls quickly while things are happening,
 * backs off to 45 s when quiet, and stops while the app is in the background.
 */
export function LiveRefresh({ what }: { what: "prat" | "godkjent" }) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let delay = 4000;
    let stopped = false;
    const check = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/endringer?hva=${what}`, { cache: "no-store" });
          if (res.ok) {
            const { tag } = (await res.json()) as { tag: string };
            if (last.current !== null && tag !== last.current) {
              router.refresh();
              delay = 4000; // something happened: stay quick for a while
            } else {
              delay = Math.min(delay * 1.5, 45000); // quiet: slow down
            }
            last.current = tag;
          }
        } catch {}
      }
      timer = setTimeout(check, delay);
    };
    check();
    // Coming back to the app: check right away instead of waiting out the delay.
    const onVisible = () => { if (document.visibilityState === "visible") { clearTimeout(timer); delay = 4000; check(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [router, what]);
  return null;
}
