"use client";

import { useEffect, useState } from "react";

type Platform = "installed" | "inapp" | "ios" | "android" | "other";

// Chrome/Android's install event (not in TypeScript's DOM types yet).
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function detect(): Platform {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (standalone) return "installed";
  // Links from Messenger/Facebook/Instagram open in their own browser, which can't install apps.
  if (/FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-text-bottom" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Del-knappen">
    <path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M5 11v9h14v-9" />
  </svg>
);

/**
 * «Legg appen på hjemskjermen», tailored to the phone: a real install button on Android, step by
 * step on iPhone, and «open in Safari first» inside Messenger's browser. Hidden once installed.
 * `variant="banner"` is the dismissible strip inside the app; "card" is for the onboarding pages.
 */
export function InstallPrompt({ variant = "card" }: { variant?: "card" | "banner" }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setPlatform(detect());
    if (variant === "banner") {
      try {
        const until = Number(localStorage.getItem("sb-install-dismissed") ?? 0);
        if (until > Date.now()) setHidden(true);
      } catch {}
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setPlatform("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, [variant]);

  if (!platform || platform === "installed" || platform === "other" || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem("sb-install-dismissed", String(Date.now() + 7 * 86400000)); } catch {}
  };

  const body =
    platform === "inapp" ? (
      <>
        <p className="font-bold">Åpne i Safari eller Chrome først</p>
        <p className="mt-1 text-sm">Du er i Messenger sin nettleser – der kan ikke appen legges på hjemskjermen. Trykk <strong>⋯</strong> (eller kompasset) og velg <strong>«Åpne i nettleser»</strong>.</p>
      </>
    ) : platform === "android" && deferred ? (
      <>
        <p className="font-bold">Legg Treningsutfordring på hjemskjermen</p>
        <p className="mt-1 text-sm">Da åpnes den som en vanlig app – uten nettleser rundt.</p>
        <button
          type="button"
          className="btn btn-heat mt-3 w-full"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === "accepted") setPlatform("installed");
            setDeferred(null);
          }}
        >
          Installer appen
        </button>
      </>
    ) : platform === "android" ? (
      <>
        <p className="font-bold">Legg Treningsutfordring på hjemskjermen</p>
        <p className="mt-1 text-sm">Trykk <strong>⋮</strong> øverst til høyre i Chrome → <strong>«Legg til på startskjermen»</strong>.</p>
      </>
    ) : (
      <>
        <p className="font-bold">Legg Treningsutfordring på hjemskjermen</p>
        <ol className="mt-2 space-y-1.5 text-sm">
          <li>1. Trykk <ShareIcon /> <strong>Del</strong> nederst i Safari</li>
          <li>2. Bla ned og velg <strong>«Legg til på Hjem-skjerm»</strong></li>
          <li>3. Trykk <strong>Legg til</strong> – så ligger bøtta blant appene dine</li>
        </ol>
      </>
    );

  if (variant === "banner") {
    return (
      <section className="relative rounded-2xl border border-line bg-card p-4 pr-10">
        {body}
        <button type="button" onClick={dismiss} className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full text-muted" aria-label="Skjul">✕</button>
      </section>
    );
  }
  return <section className="rounded-2xl bg-heat-soft p-4 text-ink">{body}</section>;
}
