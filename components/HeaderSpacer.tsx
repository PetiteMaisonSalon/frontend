"use client";

import { usePathname } from "next/navigation";

export default function HeaderSpacer() {
  const pathname = usePathname();

  // Auf der Startseite soll der Header über dem Hero liegen (kein Spacer).
  if (pathname === "/") return null;

  const spacerBg = "#EBEAE7";

  return (
    <div
      className="h-19 md:h-21"
      style={{ backgroundColor: spacerBg }}
      aria-hidden
    />
  );
}
