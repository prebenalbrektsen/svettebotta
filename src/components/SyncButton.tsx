"use client";

import { useActionState } from "react";
import { syncNow } from "@/app/(app)/actions";

export function SyncButton() {
  const [state, action, pending] = useActionState(syncNow, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button className="btn btn-sm" disabled={pending}>{pending ? "Henter …" : "Hent nye økter nå"}</button>
      {state?.ok && <span className="text-sm font-semibold text-ok">{state.ok}</span>}
      {state?.error && <span className="text-sm font-semibold text-bad">{state.error}</span>}
    </form>
  );
}
