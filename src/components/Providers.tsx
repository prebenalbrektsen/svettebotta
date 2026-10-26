"use client";

import { MotionConfig } from "motion/react";

/** Animations follow the phone's «Reduser bevegelse» setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
