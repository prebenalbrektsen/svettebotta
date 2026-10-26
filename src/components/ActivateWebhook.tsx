"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(app)/actions";

export function ActivateWebhook({ action }: { action: (state: ActionState) => Promise<ActionState> }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-2">
      <button className="btn btn-heat btn-sm" disabled={pending}>{pending ? "Kobler til …" : "Slå på sanntids-synk"}</button>
      {state?.ok && <p className="text-sm font-semibold text-ok">{state.ok}</p>}
      {state?.error && <p className="text-sm font-semibold text-bad">{state.error}</p>}
    </form>
  );
}
