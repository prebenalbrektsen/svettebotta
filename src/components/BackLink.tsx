"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

/** Goes back to wherever you came from (Prat, a person, Meg …), or to Uka on a direct link. */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-muted"
    >
      <Icon name="back" className="h-4 w-4" />Tilbake
    </button>
  );
}
