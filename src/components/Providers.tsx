"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";

/** Animations follow «Reduser bevegelse»; registers the service worker for push notifications. (The app-icon badge is set by NavLinks.) */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
