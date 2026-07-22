import Image from "next/image";
import type { Metadata } from "next";
import BookingLink from "@/components/BookingLink";

export const metadata: Metadata = {
  title: "Kontakt | Petite Maison",
  description:
    "Petite Maison Hamburg – Adresse, Öffnungszeiten, Kontakt. Termin online oder telefonisch vereinbaren.",
};

export default function KontaktPage() {
  return (
    <main className="bg-[#EBEAE7]">
      <section className="w-full px-4 pb-14 pt-8 sm:pt-12 lg:min-h-[calc(100svh-120.75rem)] lg:pb-12 lg:pt-30">
        {/* Obere Zeile: Text links · Kontakt rechts */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="font-display shrink-0 text-[#1C1612] lg:max-w-[44rem]">
            <p className="text-[clamp(2.5rem,3.2vw,2.5rem)] leading-[1.12] tracking-[-0.02em]">
              Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen
              Termin kannst du jederzeit online oder telefonisch vereinbaren.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-12 gap-y-2 text-[0.875rem] [font-family:var(--font-public-sans)]">
              <BookingLink className="underline decoration-[#1C1612]/30 underline-offset-[6px] transition hover:decoration-[#1C1612]/60">
                Online buchen
              </BookingLink>
              <a
                href="tel:+4917669150964"
                className="underline decoration-[#1C1612]/30 underline-offset-[6px] transition hover:decoration-[#1C1612]/60"
              >
                Anrufen
              </a>
            </div>
          </div>

          <div className="mt-12 shrink-0 text-copy-sm space-y-7 text-[#1C1612]/90 lg:mt-60 lg:w-54">
            <address className="not-italic leading-[1.65]">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="space-y-1 leading-[1.65]">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
            <div className="space-y-2 leading-[1.65]">
              <a
                href="tel:+4917669150964"
                className="block transition hover:opacity-70"
              >
                +49 176 69150964
              </a>
              <a
                href="mailto:info@petitemaison.hamburg"
                className="block break-words transition hover:opacity-70"
              >
                info@petitemaison.hamburg
              </a>
            </div>
            <div className="flex flex-col gap-2 leading-[1.65]">
              <a
                href="https://wa.me/4917669150964"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:opacity-70"
              >
                Whatsapp
              </a>
              <a
                href="https://www.instagram.com/petite_maison_hamburg"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:opacity-70"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[28%_30%_42%] gap-x-0 content-center max-md:grid-cols-1 max-md:gap-y-7.5 max-md:p-5 grid-rows-[auto_auto]">
        <div className="w-full col-start-1 col-end-2 row-start-1 row-end-2 max-md:col-span-full max-md:row-start-1 max-md:row-end-2 p-2">
          <Image
            src="/kontakt/kontakt_bild1.png"
            alt="Friseursalon Spiegel"
            width={300}
            height={300}
            priority
            className="block aspect-square object-cover"
          />
        </div>

        <div className="w-full col-start-3 col-end-4 row-start-2 row-end-3 max-md:col-span-full max-md:row-start-2 max-md:row-end-3 p-2 mb-1">
          <Image
            src="/kontakt/kontakt_bild2.png"
            alt="Waschbecken Bereich"
            width={1200}
            height={750}
            priority
            className="w-full h-auto block aspect-16/10 object-cover"
          />
        </div>
      </section>
    </main>
  );
}
