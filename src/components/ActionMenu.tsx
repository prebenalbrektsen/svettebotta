"use client";

import { Menu } from "@animate-ui/react/primitives/base-ui/menu";
import { useTransition } from "react";
import { Icon } from "./Icon";

type MenuAction = { label: string; action: () => Promise<void>; danger?: boolean };

/** The ⋯ menu: an animated popup (Animate UI on Base UI) that closes on outside tap and Escape. */
export function ActionMenu({ items, label = "Flere valg", small }: { items: MenuAction[]; label?: string; small?: boolean }) {
  const [pending, start] = useTransition();
  if (!items.length) return null;
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={label}
        className={`inline-grid cursor-pointer place-items-center rounded-full bg-line/60 text-muted data-[popup-open]:bg-ink data-[popup-open]:text-paper ${small ? "h-6 w-6" : "h-8 w-8"} ${pending ? "opacity-50" : ""}`}
      >
        <Icon name="more" className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className="min-w-52 origin-[var(--transform-origin)] rounded-xl border border-line bg-card p-1 shadow-xl outline-none">
            {items.map((it) => (
              <Menu.Item
                key={it.label}
                onClick={() => start(() => it.action())}
                className={`flex w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm outline-none select-none data-[highlighted]:bg-line/60 ${it.danger ? "text-bad" : ""}`}
              >
                {it.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
