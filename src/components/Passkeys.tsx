"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** A friendly name for the passkey, from the device. */
function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone (Face ID)";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac (Touch ID)";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows Hello";
  return "Passkey";
}

async function post(url: string, body?: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Noe gikk galt");
  return json;
}

const cancelled = (e: unknown) => e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError");

/** On /login: one tap to log in with Face ID / Touch ID / fingerprint. */
export function PasskeyLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="btn w-full"
        disabled={busy}
        onClick={async () => {
          setError("");
          setBusy(true);
          try {
            const start = await post("/api/passkey/login-options");
            const response = await startAuthentication({ optionsJSON: start.options });
            const done = await post("/api/passkey/login", { token: start.token, response });
            window.location.href = done.redirect;
          } catch (e) {
            if (!cancelled(e)) setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Venter på Face ID …" : "Logg inn med Face ID / passkey"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-bad">{error}</p>}
    </div>
  );
}

/** On Meg / Velkommen: turn on passkey login for this device. */
export function AddPasskey({ label = "Slå på Face ID / Touch ID på denne enheten" }: { label?: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn btn-heat w-full"
        disabled={busy}
        onClick={async () => {
          setMsg(null);
          setBusy(true);
          try {
            const start = await post("/api/passkey/register-options");
            const response = await startRegistration({ optionsJSON: start.options });
            await post("/api/passkey/register", { token: start.token, response, name: deviceName() });
            setMsg({ text: "Klart! Neste gang logger du inn med ett trykk.", ok: true });
            router.refresh();
          } catch (e) {
            if ((e as Error).name === "InvalidStateError") setMsg({ text: "Denne enheten er allerede lagt til.", ok: true });
            else if (!cancelled(e)) setMsg({ text: (e as Error).message, ok: false });
          }
          setBusy(false);
        }}
      >
        {busy ? "Venter …" : label}
      </button>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</p>}
    </div>
  );
}
