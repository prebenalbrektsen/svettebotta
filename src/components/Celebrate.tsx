"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// Celebrations: a card spins in with confetti when you earn a joker or a badge. Each one is shown
// once (remembered in this browser); several queue up one after another.

const COLORS = ["#ff4d1c", "#ffb59c", "#f4f1ea", "#43b871", "#14130f"];

function burst() {
  confetti({ particleCount: 110, spread: 85, startVelocity: 38, origin: { y: 0.42 }, colors: COLORS, disableForReducedMotion: true, zIndex: 70 });
  setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.35 }, colors: COLORS, disableForReducedMotion: true, zIndex: 70 }), 250);
}

/** The joker as a playing card. */
export function JokerCard({ small }: { small?: boolean }) {
  const size = small ? "h-40 w-28 rounded-xl p-2" : "h-80 w-56 rounded-[22px] p-3";
  return (
    <div className={`relative ${size} border-4 border-white bg-gradient-to-br from-[#ff7a4d] via-[#ff4d1c] to-[#c2410c] text-white shadow-2xl`}>
      <span className={`absolute ${small ? "top-1.5 left-2 text-sm" : "top-2.5 left-3.5 text-2xl"} display leading-none`}>J<br /><span className="text-[0.7em]">🃏</span></span>
      <span className={`absolute ${small ? "right-2 bottom-1.5 text-sm" : "right-3.5 bottom-2.5 text-2xl"} display rotate-180 leading-none`}>J<br /><span className="text-[0.7em]">🃏</span></span>
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-512.png" alt="" className={`${small ? "h-12 w-12 rounded-lg" : "h-24 w-24 rounded-2xl"} shadow-lg ring-4 ring-white/80`} />
        <span className={`display ${small ? "text-xl" : "text-4xl"} tracking-wide`}>Joker</span>
      </div>
    </div>
  );
}

function BadgeMedal({ emoji }: { emoji: string }) {
  return (
    <div className="grid h-52 w-52 place-items-center rounded-full border-[6px] border-white bg-gradient-to-br from-[#ffd36b] via-[#ffb03b] to-[#ff7a1f] shadow-2xl">
      <div className="grid h-40 w-40 place-items-center rounded-full bg-white/25 text-7xl ring-2 ring-white/60">{emoji}</div>
    </div>
  );
}

function JokerRules({ held, max, every }: { held: number; max: number; every: number }) {
  return (
    <ul className="space-y-1.5 text-left text-sm">
      <li>✅ {every === 1 ? "Hver økt" : `Hver ${every}. økt`} utover ukas krav blir spart som en joker.</li>
      <li>🃏 En joker fyller én økt du mangler i en uke som ikke gikk helt.</li>
      <li>👆 Du bruker den selv fra bøtefeltet når uka er over – da er uka i boks.</li>
      <li>🎒 Du kan ha maks {max} på lur. Ekstra økter utover det spares ikke.</li>
      <li>📝 Ukeskravet (f.eks. «økt i vann») kan ikke dekkes av en joker.</li>
      <li className="pt-1 font-bold">Du har nå {held} av {max}.</li>
    </ul>
  );
}

type Item =
  | { kind: "joker"; count: number }
  | { kind: "badge"; id: string; title: string; emoji: string; how: string };

function Dialog({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5 py-6" onClick={(e) => e.stopPropagation()}>{children}</div>
    </motion.div>
  );
}

/** Spins a card in: from edge-on and small to facing you, with a springy settle. */
function Spin({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        initial={{ rotateY: -540, scale: 0.3, opacity: 0, y: 40 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 55, damping: 11, mass: 1 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Shows new jokers and badges since last time, one at a time. The first visit only remembers the
 * current state (so nobody gets a pile of old badges at once).
 */
export function Celebrations({ userId, challengeId, jokers, badges }: {
  userId: number;
  challengeId: number;
  jokers: { earnedTotal: number; held: number; max: number; every: number; enabled: boolean };
  badges: { id: string; title: string; emoji: string; how: string }[];
}) {
  const [queue, setQueue] = useState<Item[]>([]);
  useEffect(() => {
    const key = `sb-celebrated-${userId}-${challengeId}`;
    let seen: { jokers: number; badges: string[] } | null = null;
    try { seen = JSON.parse(localStorage.getItem(key) ?? "null"); } catch {}
    const now = { jokers: jokers.earnedTotal, badges: badges.map((b) => b.id) };
    try { localStorage.setItem(key, JSON.stringify(now)); } catch {}
    if (!seen) return;
    const items: Item[] = [];
    if (jokers.enabled && jokers.earnedTotal > seen.jokers) items.push({ kind: "joker", count: jokers.earnedTotal - seen.jokers });
    for (const b of badges) if (!seen.badges.includes(b.id)) items.push({ kind: "badge", ...b });
    if (items.length) setQueue(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, challengeId, jokers.earnedTotal, badges.map((b) => b.id).join(",")]);

  const current = queue[0];
  useEffect(() => { if (current) burst(); }, [current]);
  const next = () => setQueue((q) => q.slice(1));

  return (
    <AnimatePresence>
      {current && (
        <Dialog key={current.kind === "joker" ? "joker" : current.id} onClose={next} label={current.kind === "joker" ? "Du sparte en joker" : `Nytt merke: ${current.title}`}>
          {current.kind === "joker" ? (
            <>
              <Spin><JokerCard /></Spin>
              <div className="card w-full p-5 text-center">
                <p className="display text-3xl">Du sparte {current.count === 1 ? "1 joker" : `${current.count} jokere`}!</p>
                <p className="mt-1 mb-4 text-sm text-muted">Du gjorde mer enn ukas krav. Sterkt! 💪</p>
                <JokerRules held={jokers.held} max={jokers.max} every={jokers.every} />
                <button type="button" autoFocus onClick={next} className="btn btn-heat mt-5 w-full">Nice!</button>
              </div>
            </>
          ) : (
            <>
              <Spin><BadgeMedal emoji={current.emoji} /></Spin>
              <div className="card w-full p-5 text-center">
                <p className="text-xs font-bold tracking-wider text-heat uppercase">Nytt merke</p>
                <p className="display mt-1 text-4xl">{current.title}</p>
                <p className="mt-2 text-muted">{current.how}</p>
                <button type="button" autoFocus onClick={next} className="btn btn-heat mt-5 w-full">Sterkt! 💪</button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </AnimatePresence>
  );
}

/** Tap the joker counter anywhere to see the card and the rules. */
export function JokerInfo({ held, max, every, children }: { held: number; max: number; every: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left">{children}</button>
      <AnimatePresence>
        {open && (
          <Dialog onClose={() => setOpen(false)} label="Slik funker jokere">
            <Spin><JokerCard /></Spin>
            <div className="card w-full p-5">
              <p className="display mb-3 text-center text-3xl">Slik funker jokere</p>
              <JokerRules held={held} max={max} every={every} />
              <button type="button" autoFocus onClick={() => setOpen(false)} className="btn mt-5 w-full">Skjønner!</button>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
