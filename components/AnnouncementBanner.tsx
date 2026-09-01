"use client";

import { useState, useEffect } from "react";
import BookingLink from "@/components/BookingLink";

export default function AnnouncementBanner() {
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Sobald die Komponente im Client geladen ist, prüfen wir die Bildschirmbreite
    if (window.innerWidth < 768) {
      // Auf Mobile: Direkt das Modal (Overlay) öffnen
      setIsModalOpen(true);
    }
  }, []);

  // Blockiert das Scrollen der Seite, solange das Overlay geöffnet ist
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Verhindert Flackern (Hydration Mismatch) beim initialen Laden
  if (!isMounted) return null;

  return (
    <>
      {/* 
        BANNER LEISTE (Nur auf Desktop)
        "relative w-full" drückt die Navigation sauber nach unten und überlagert sie NICHT.
        Auf Mobile durch "hidden md:flex" komplett unsichtbar.
      */}
      {isBannerVisible && (
        <div className="relative z-50 hidden w-full items-center justify-center bg-[#BEA8FF] px-2 py-1.5 text-center md:flex">
          <p className="font-extrabold text-[#1C1612]">
            Neu ab 01.09.2026: Neue Preise & Buchung über Salonkee{" "}
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-2 font-semibold underline underline-offset-2 transition hover:opacity-70"
            >
              Mehr Infos
            </button>
          </p>

          {/* Banner Schließen Button */}
          <button
            onClick={() => setIsBannerVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#1C1612] transition hover:opacity-70"
            aria-label="Banner schließen"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* 
        OVERLAY / MODAL (Mobile & Desktop)
        "fixed inset-0" legt sich über die GESAMTE Seite, blockiert alle Klicks dahinter.
      */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
          <div
            className="relative max-h-[90vh] w-full max-w-140 overflow-y-auto rounded-3xl bg-[#BEA8FF] px-6 py-10 text-[#1C1612] md:px-12 md:py-12"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Schließen X */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 transition hover:opacity-70 md:right-6 md:top-6"
              aria-label="Modal schließen"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <h2 className="mb-2 font-serif text-4xl font-bold text-[#1C1612] md:text-[40px]">
              Liebe Gäste
            </h2>

            <div className="space-y-4 font-semibold leading-relaxed md:text-[15px]">
              <p>
                zunächst möchten wir uns herzlich für eure Treue und euer
                Vertrauen bedanken. Eure Unterstützung motiviert uns jeden Tag,
                euch die bestmögliche Qualität zu bieten.
              </p>

              <div>
                <h3 className="mb-2 font-semibold uppercase tracking-wider underline underline-offset-4">
                  Preisanpassung
                </h3>
                <p>
                  Damit wir weiterhin mit hochwertigen Produkten arbeiten und
                  unser Team regelmäßig weiterbilden können, passen wir unsere
                  Preise ab dem 01.09.2026 an. Diese Anpassung haben wir bewusst
                  so moderat wie möglich gehalten.
                </p>
                <p className="mt-4">
                  Die aktuellen Preise findet ihr ab diesem Datum hier auf der
                  Website sowie im Buchungssystem.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold uppercase tracking-wider underline underline-offset-4">
                  Buchungen
                </h3>
                <p>
                  Ab dem 01.09.2026 sind wir über{" "}
                  <a
                    href="#"
                    className="underline underline-offset-2 transition hover:opacity-70"
                  >
                    Salonkee
                  </a>{" "}
                  online buchbar und verabschieden uns von Treatwell. Eure
                  Termine könnt ihr jederzeit bequem online buchen, verwalten
                  oder verschieben.
                </p>
              </div>

              <p>
                Vielen Dank für euer Verständnis und euer Vertrauen. Wir freuen
                uns darauf, euch weiterhin bei uns zu verwöhnen.
              </p>

              <p>
                Liebste Grüße
                <br />
                Euer Team von Petite Maison
              </p>
            </div>

            {/* Buttons unten */}
            <div className="mt-8 flex items-center gap-6">
              <BookingLink className="rounded-[14px] border-[1.5px] border-[#1C1612] bg-transparent px-5 py-1.5 text-sm font-semibold text-[#1C1612] transition hover:bg-[#1C1612] hover:text-white">
                Jetzt buchen
              </BookingLink>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm font-semibold underline underline-offset-4 transition hover:opacity-70"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
