"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "@/app/(app)/actions";

/** Message input pinned above the tab bar. New messages arrive through <LiveRefresh what="prat" />. */
export function ChatBox() {
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok !== undefined) form.current?.reset();
    window.scrollTo({ top: document.body.scrollHeight });
  }, [state]);
  return (
    <form
      ref={form}
      action={action}
      className="chat-input glass fixed inset-x-3 bottom-[calc(98px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-md items-end gap-2 rounded-[26px] p-1.5 sm:bottom-6 sm:max-w-2xl"
    >
      <textarea
        name="body"
        rows={1}
        className="max-h-32 min-h-11 flex-1 resize-none rounded-[20px] bg-transparent px-3.5 py-2.5 text-base outline-none placeholder:text-muted"
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
      <button className="btn btn-heat h-11 rounded-full px-5" disabled={pending}>Send</button>
    </form>
  );
}

/** Jumps to the newest message on open, and follows new ones if you were already near the bottom. */
export function ScrollToEnd({ count }: { count: number }) {
  const first = useRef(true);
  useEffect(() => {
    const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 400;
    if (first.current || nearBottom) window.scrollTo({ top: document.body.scrollHeight, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [count]);
  return null;
}
