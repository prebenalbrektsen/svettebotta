"use client";

import { useState, useTransition } from "react";
import { setAvatar } from "@/app/(app)/actions";
import { resizeImage } from "@/lib/resize";
import { Avatar } from "./Avatar";

export function AvatarUpload({ p }: { p: { id: number; name: string; color: string; avatar_v: number | null } }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <label className="relative block cursor-pointer" title="Bytt profilbilde">
      <Avatar p={p} size={64} />
      <span className="absolute -right-1 -bottom-1 grid h-7 w-7 place-items-center rounded-full border-2 border-paper bg-ink text-paper">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
      </span>
      <span className="sr-only">{pending ? "Laster opp" : "Bytt profilbilde"}</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const data = await resizeImage(f);
          start(async () => {
            const r = await setAvatar(data);
            setError(r?.error ?? "");
          });
        }}
      />
      {error && <span className="absolute top-full left-0 mt-1 w-48 text-xs font-semibold text-bad">{error}</span>}
    </label>
  );
}
