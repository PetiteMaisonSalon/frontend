"use client";

import { usePathname } from "next/navigation";

export default function HeaderSpacer() {
  const pathname = usePathname();

  // Auf der Startseite soll der Header über dem Hero liegen (kein Spacer).
  if (pathname === "/") return null;

  const spacerBg = "#EBEAE7";

  return (
    <div
      className="h-[76px] md:h-[84px]"
      style={{ backgroundColor: spacerBg }}
      aria-hidden
    />
  );
}

