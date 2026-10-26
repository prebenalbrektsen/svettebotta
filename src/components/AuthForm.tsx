"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/auth-actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; defaultValue?: string };

export function AuthForm({
  action,
  fields,
  submit,
  hidden,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={formAction} className="space-y-4">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="label">{f.label}</span>
          {f.type === "password" ? (
            <span className="relative block">
              <input className="field pr-16" name={f.name} type={show ? "text" : "password"} autoComplete={f.autoComplete} required />
              <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-2 h-9 -translate-y-1/2 rounded-lg px-2 text-sm font-semibold text-muted">
                {show ? "Skjul" : "Vis"}
              </button>
            </span>
          ) : (
            <input className="field" name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} defaultValue={f.defaultValue} required />
          )}
        </label>
      ))}
      {state?.error && <p className="text-sm font-medium text-bad">{state.error}</p>}
      <button className="btn btn-heat w-full" disabled={pending}>{pending ? "Et øyeblikk …" : submit}</button>
    </form>
  );
}
