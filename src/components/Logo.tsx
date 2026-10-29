import { Icon } from "./Icon";

/** The wordmark: the runner on an orange tile next to the name in the display font. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid place-items-center rounded-xl bg-heat text-white ${lg ? "h-12 w-12" : "h-8 w-8"}`}>
        <Icon name="runner" className={lg ? "h-7 w-7" : "h-5 w-5"} />
      </span>
      <span className={`display ${lg ? "text-3xl" : "text-xl"}`}>Treningsutfordring</span>
    </span>
  );
}
