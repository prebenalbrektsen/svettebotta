"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(app)/actions";

export function ActionForm({
  action,
  submit,
  children,
  className = "space-y-3",
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  submit: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-sm" disabled={pending}>{pending ? "Lagrer …" : submit}</button>
        {state?.ok && <span className="text-sm font-semibold text-ok">{state.ok}</span>}
        {state?.error && <span className="text-sm font-semibold text-bad">{state.error}</span>}
      </div>
    </form>
  );
}

export function CopyLink({ url, big }: { url: string; big?: boolean }) {
  return (
    <button
      type="button"
      className={big ? "btn btn-heat w-full" : "btn btn-ghost btn-sm"}
      onClick={async (e) => {
        const btn = e.currentTarget;
        if (navigator.share) {
          await navigator.share({ title: "Bli med i Svettebøtta", url }).catch(() => {});
          return;
        }
        await navigator.clipboard.writeText(url);
        btn.textContent = "Kopiert ✓";
      }}
    >
      Del invitasjon
    </button>
  );
}
