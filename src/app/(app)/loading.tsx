/** Shown instantly on every tap between screens while the server renders the next one. */
export default function Loading() {
  const bar = "animate-pulse rounded-xl bg-line/70";
  return (
    <div className="space-y-4 pt-2" aria-busy="true" aria-label="Laster">
      <div className={`${bar} h-4 w-32`} />
      <div className={`${bar} h-14 w-48`} />
      <div className={`${bar} h-32 w-full rounded-2xl`} />
      <div className={`${bar} h-56 w-full rounded-2xl`} />
    </div>
  );
}
