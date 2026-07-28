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
      className="fixed bottom-5 right-5 z-60 max-w-[min(100vw-2.5rem,26rem)] rounded-[18px] bg-[#BEA8FF] p-6 shadow-lg"
      role="dialog"
      aria-label="Cookie Einstellungen"
    >
      <h2 className="text-h3 text-[#1C1612]">Cookie Einstellungen</h2>
      <p className="text-copy mt-3 leading-relaxed text-[#1C1612]">
        Wir verwenden Cookies, damit unsere Website reibungslos läuft. Weitere
        Informationen finden Sie in unserer{" "}
        <Link
          href="/datenschutz"
          className="underline underline-offset-2 transition hover:text-[#1C1612]"
        >
          Datenschutzerklärung
        </Link>
        .
      </p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={reject}
          className="text-copy font-medium text-[#1C1612] underline underline-offset-2 transition hover:opacity-80"
        >
          Ablehnen
        </button>
        <button
          type="button"
          onClick={accept}
          className="text-copy rounded-full border border-[#1C1612] bg-transparent px-6 py-2.5 font-medium text-[#1C1612] transition hover:bg-[#1C1612]/5"
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
