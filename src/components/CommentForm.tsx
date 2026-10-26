"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/(app)/actions";

export function CommentForm({ workoutId }: { workoutId: number }) {
  const [state, action, pending] = useActionState(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok !== undefined) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="flex gap-2">
      <input type="hidden" name="workout_id" value={workoutId} />
      <input name="body" className="field flex-1" placeholder="Skriv en kommentar …" maxLength={1000} autoComplete="off" required />
      <button className="btn btn-heat" disabled={pending}>Send</button>
    </form>
  );
}
