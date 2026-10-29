"use client";

import { useEffect, useState, useTransition } from "react";
import { sendTestPush, setNotify } from "@/app/(app)/actions";

type State = "loading" | "unsupported" | "install-first" | "denied" | "off" | "on";

const urlBase64ToUint8Array = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

function standalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** «Slå på varsler» for this device, plus which kinds of notifications the person wants. */
export function PushSettings({ categories, prefs, compact }: { categories: Record<string, string>; prefs: Record<string, boolean>; compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const [on, setOn] = useState(prefs);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (ios && !standalone()) return setState("install-first");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const { publicKey } = await (await fetch("/api/push/key")).json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
      setState("on");
      setMsg("Varsler er på! 🎉");
    } catch {
      setMsg("Det gikk ikke å slå på varsler. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
    setMsg("");
  };

  const status =
    state === "loading" ? null :
    state === "install-first" ? <p className="text-sm text-muted">På iPhone kommer varsler bare når appen er lagt på hjemskjermen. Legg den til (se veiledningen på forsiden), åpne den derfra og kom tilbake hit.</p> :
    state === "unsupported" ? <p className="text-sm text-muted">Denne nettleseren støtter ikke varsler. Prøv fra appen på hjemskjermen.</p> :
    state === "denied" ? <p className="text-sm text-muted">Varsler er blokkert for Treningsutfordring. Slå dem på i telefonens Innstillinger → Varslinger → Treningsutfordring.</p> :
    state === "off" ? <button type="button" className="btn btn-heat w-full" disabled={busy} onClick={enable}>{busy ? "Venter …" : "Slå på varsler"}</button> :
    (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ok">✓ Varsler er på på denne enheten</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => start(async () => { await sendTestPush(); setMsg("Testvarsel sendt – sjekk telefonen."); })}>Send testvarsel</button>
        <button type="button" className="text-xs text-muted underline" onClick={disable}>Slå av her</button>
      </div>
    );

  return (
    <div className="space-y-3">
      {status}
      {msg && <p className="text-sm font-semibold text-ok">{msg}</p>}
      {!compact && state !== "unsupported" && (
        <ul className="divide-y divide-line">
          {Object.entries(categories).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on[key] !== false}
                aria-label={label}
                onClick={() => {
                  const next = on[key] === false;
                  setOn({ ...on, [key]: next });
                  start(() => setNotify(key, next));
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on[key] !== false ? "bg-ok" : "bg-line"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on[key] !== false ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
