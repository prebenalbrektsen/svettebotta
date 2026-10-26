"use client";

import { useTransition } from "react";
import { claimPaid } from "@/app/(app)/actions";

export function ClaimPaid({ weeks }: { weeks: string[] }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn w-full bg-paper text-ink" disabled={pending} onClick={() => start(() => claimPaid(weeks))}>
      {pending ? "Sender …" : "Jeg har betalt med Vipps"}
    </button>
  );
}
