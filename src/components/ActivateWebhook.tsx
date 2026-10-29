"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(app)/actions";

export function ActivateWebhook({ action, label = "Slå på sanntids-synk" }: { action: (state: ActionState) => Promise<ActionState>; label?: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-2">
      <button className="btn btn-heat btn-sm" disabled={pending}>{pending ? "Kobler til …" : label}</button>
      {state?.ok && <p className="text-sm font-semibold text-ok">{state.ok}</p>}
      {state?.error && <p className="text-sm font-semibold text-bad">{state.error}</p>}
    </form>
  );
}
