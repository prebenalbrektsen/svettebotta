"use client";

import { useActionState, useEffect, useRef } from "react";
import { addParticipant } from "@/app/(app)/actions";
import { CopyLink } from "./ActionForm";

/** Add someone, then hand over their invite link right away – that's the next thing you do. */
export function AddParticipantForm({ appUrl }: { appUrl: string }) {
  const [state, action, pending] = useActionState(addParticipant, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.link) form.current?.reset(); }, [state]);
  return (
    <div className="space-y-3">
      <form ref={form} action={action} className="flex items-end gap-2">
        <label className="block min-w-0 flex-1"><span className="label">Legg til deltaker</span><input name="name" className="field" placeholder="Navn, f.eks. Mamma" required /></label>
        <button className="btn" disabled={pending}>{pending ? "…" : "Legg til"}</button>
      </form>
      {state?.error && <p className="text-sm font-semibold text-bad">{state.error}</p>}
      {state?.link && (
        <div className="rounded-xl bg-ok-soft p-3">
          <p className="font-semibold text-ok">{state.ok} er lagt til. Send invitasjonen:</p>
          <p className="my-2 truncate text-xs text-muted">{state.link || appUrl}</p>
          <CopyLink url={state.link} big />
        </div>
      )}
    </div>
  );
}
