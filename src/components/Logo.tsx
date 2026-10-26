/** The Svettebøtta wordmark: the light version, swapped for the dark one when the phone is in dark mode. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const height = size === "lg" ? 64 : 34;
  return (
    <picture>
      <source srcSet="/logo-dark.png" media="(prefers-color-scheme: dark)" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-light.png" alt="Svettebøtta" style={{ height, width: "auto" }} />
    </picture>
  );
}
