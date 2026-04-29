"use client";

import { usePathname } from "next/navigation";

export default function HeaderSpacer() {
  const pathname = usePathname();

  // Auf der Startseite soll der Header über dem Hero liegen (kein Spacer).
  if (pathname === "/") return null;

  const spacerBg = (() => {
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname?.startsWith("/auth/")
    ) {
      return "#E4E1DC";
    }
    if (pathname?.startsWith("/leistungen") || pathname?.startsWith("/buchung")) {
      return "#F1EEE9";
    }
    if (pathname === "/kontakt" || pathname?.startsWith("/konto")) {
      return "#F2F0EB";
    }
    if (pathname === "/impressum" || pathname === "/datenschutz") {
      return "#FFFFFF";
    }
    return "#F5F2ED";
  })();

  return (
    <div
      className="h-[76px] md:h-[84px]"
      style={{ backgroundColor: spacerBg }}
      aria-hidden
    />
  );
}

