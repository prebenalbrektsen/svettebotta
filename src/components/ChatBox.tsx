"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/(app)/actions";

/** Message input pinned above the tab bar, plus a quiet refresh so new messages appear by themselves. */
export function ChatBox() {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok !== undefined) form.current?.reset();
    window.scrollTo({ top: document.body.scrollHeight });
  }, [state]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 8000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <form
      ref={form}
      action={action}
      className="chat-input fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-3xl gap-2 border-t border-line bg-paper/95 px-4 py-2 backdrop-blur sm:bottom-0"
    >
      <textarea
        name="body"
        rows={1}
        className="field max-h-32 flex-1 resize-none"
        placeholder="Skriv til gjengen …"
        // While typing, the tab bar hides so the keyboard + input don't eat the whole screen.
        onFocus={() => document.documentElement.setAttribute("data-typing", "")}
        onBlur={() => document.documentElement.removeAttribute("data-typing")}
        maxLength={2000}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        required
      />
      <button className="btn btn-heat" disabled={pending}>Send</button>
    </form>
  );
}

export function ScrollToEnd() {
  useEffect(() => { window.scrollTo({ top: document.body.scrollHeight }); }, []);
  return null;
}
