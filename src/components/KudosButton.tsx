"use client";

import { Particles, ParticlesEffect } from "@animate-ui/react/primitives/effects/particles";
import { motion } from "motion/react";
import { useOptimistic, useState, useTransition } from "react";
import { toggleKudos } from "@/app/(app)/actions";
import { Icon } from "./Icon";

/**
 * 🔥 kudos with instant feedback: the count changes right away (no page reload), the flame
 * bounces, and a little burst of sparks flies when you give one.
 */
export function KudosButton({ workoutId, given, count, own, big }: { workoutId: number; given: boolean; count: number; own: boolean; big?: boolean }) {
  const [state, setOptimistic] = useOptimistic({ given, count });
  const [, start] = useTransition();
  const [burst, setBurst] = useState(0);
  const onClick = () => {
    if (own) return;
    const next = { given: !state.given, count: state.count + (state.given ? -1 : 1) };
    if (next.given) setBurst((b) => b + 1);
    start(async () => {
      setOptimistic(next);
      await toggleKudos(workoutId);
    });
  };
  const size = big ? "h-11 px-4 text-base" : "h-8 px-2.5 text-sm";
  return (
    <Particles animate={burst > 0} key={burst} className="relative inline-flex">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={own}
        whileTap={own ? undefined : { scale: 0.85 }}
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${size} ${state.given ? "bg-heat text-white" : "bg-line/60 text-muted"}`}
        aria-label={own ? `${state.count} kudos` : state.given ? "Ta tilbake kudos" : "Gi kudos"}
      >
        <motion.span key={`${state.given}`} initial={{ scale: state.given ? 0.4 : 1, rotate: state.given ? -20 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}>
          <Icon name="flame" className={big ? "h-5 w-5" : "h-4 w-4"} />
        </motion.span>
        {big ? `${state.count} kudos` : state.count || ""}
      </motion.button>
      {burst > 0 && <ParticlesEffect count={8} radius={26} spread={360} duration={0.7} className="h-1.5 w-1.5 rounded-full bg-heat" />}
    </Particles>
  );
}
