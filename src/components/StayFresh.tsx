"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Home-screen apps keep running in the background, so after a while they show old data and old
 * code. When the app comes back after more than a minute: refresh the data, and if a new version
 * has been deployed, offer a one-tap update (never reload on its own – it could eat a half-typed message).
 */
export function StayFresh({ version }: { version: string }) {
  const router = useRouter();
  const hiddenAt = useRef<number | null>(null);
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    const onChange = async () => {
      if (document.visibilityState === "hidden") { hiddenAt.current = Date.now(); return; }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      if (away < 60_000) return;
      router.refresh();
      try {
        const res = await fetch("/api/versjon", { cache: "no-store" });
        const { version: live } = (await res.json()) as { version: string };
        if (live && live !== version) setOutdated(true);
      } catch {}
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [router, version]);

  return (
    <AnimatePresence>
      {outdated && (
        <motion.button
          type="button"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          onClick={() => window.location.reload()}
          className="glass fixed inset-x-3 top-[calc(10px+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full px-4 py-3 text-left text-sm font-semibold"
        >
          <span>✨ Ny versjon av Treningsutfordring</span>
          <span className="rounded-full bg-heat px-3 py-1 text-white">Oppdater</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
