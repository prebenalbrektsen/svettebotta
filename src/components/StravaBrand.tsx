// Strava's official assets (public/strava, from developers.strava.com/guidelines), used as-is:
// their terms say the connect button must be theirs and Strava data must be credited.

/** The official «Connect with Strava» button (48 px tall, as the guidelines ask). */
export function ConnectWithStrava() {
  return (
    <a href="/api/strava/connect" className="inline-block" aria-label="Connect with Strava">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/strava/connect.svg" alt="Connect with Strava" width={237} height={48} />
    </a>
  );
}

/** «Powered by Strava», shown wherever Strava data appears. */
export function PoweredByStrava({ className = "" }: { className?: string }) {
  return (
    <picture className={className}>
      <source srcSet="/strava/powered-by-white.svg" media="(prefers-color-scheme: dark)" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/strava/powered-by-black.svg" alt="Powered by Strava" style={{ height: 12, width: "auto" }} />
    </picture>
  );
}
