"use client";

import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";

/** A number that counts up from 0 the first time it scrolls into view (Norwegian formatting). */
export function Count({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  return (
    <span className="tabular-nums">
      <CountingNumber number={value} decimalPlaces={decimals} decimalSeparator="," thousandSeparator=" " inView inViewOnce transition={{ stiffness: 90, damping: 30 }} />
      {suffix}
    </span>
  );
}
