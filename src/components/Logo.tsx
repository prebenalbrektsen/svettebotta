export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`display inline-flex items-center gap-2 ${size === "lg" ? "text-5xl" : "text-2xl"}`}>
      <svg viewBox="0 0 64 64" className={size === "lg" ? "h-12 w-12" : "h-7 w-7"} aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--color-ink)" />
        <path d="M18 22h28l-3 28a4 4 0 0 1-4 3.6H25a4 4 0 0 1-4-3.6z" fill="#ff4d1c" />
        <path d="M14 22h36" stroke="var(--color-paper)" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 8c4 5 6 8 6 10.5a6 6 0 0 1-12 0C26 16 28 13 32 8z" fill="var(--color-paper)" />
      </svg>
      Svettebøtta
    </span>
  );
}
