"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "pm-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== "accepted" && stored !== "rejected") {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const reject = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "rejected");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] max-w-[min(100vw-2.5rem,26rem)] rounded-[18px] bg-[#BEA8FF] px-6 py-5 shadow-lg"
      role="dialog"
      aria-label="Cookie Einstellungen"
    >
      <h2 className="text-h3 text-[#2D2D2D]">
        Cookie Einstellungen
      </h2>
      <p className="text-copy mt-3 leading-relaxed text-[#2D2D2D]/90">
        Wir verwenden Cookies, damit unsere Website reibungslos läuft. Weitere
        Informationen finden Sie in unserer{" "}
        <Link
          href="/datenschutz"
          className="underline underline-offset-2 transition hover:text-[#2D2D2D]"
        >
          Datenschutzerklärung
        </Link>
        .
      </p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={reject}
          className="text-copy font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
        >
          Ablehnen
        </button>
        <button
          type="button"
          onClick={accept}
          className="text-copy rounded-full border border-[#2D2D2D] bg-transparent px-6 py-2.5 font-medium text-[#2D2D2D] transition hover:bg-[#2D2D2D]/5"
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
