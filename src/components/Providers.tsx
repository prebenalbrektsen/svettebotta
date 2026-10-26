"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";

/** Animations follow «Reduser bevegelse»; registers the service worker for push notifications. */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    // Opening the app clears the red number on the home-screen icon.
    (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {});
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
