import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import BookingLink from "@/components/BookingLink";

export const metadata: Metadata = {
  title: "Kontakt | Petite Maison",
  description:
    "Petite Maison Hamburg – Adresse, Öffnungszeiten, Kontakt. Termin online oder telefonisch vereinbaren.",
};

export default function KontaktPage() {
  return (
    <main className="bg-[#F2F0EB]">
      <section className="w-full px-4 pb-24 pt-8 sm:pt-12 lg:min-h-[calc(100svh-4.75rem)] lg:pb-12 lg:pt-12 lg:mt-40">
        {/* Obere Zeile: Text links · Kontakt rechts */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="font-display shrink-0 text-[#2D2D2D] lg:max-w-[48rem]">
            <p className="text-[clamp(2.5rem,3.2vw,2.5rem)] leading-[1.12] tracking-[-0.02em]">
              Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen Termin kannst du jederzeit online
              oder telefonisch vereinbaren.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-12 gap-y-2 text-[0.875rem] [font-family:var(--font-public-sans)] sm:mt-10">
              <BookingLink className="underline decoration-[#2D2D2D]/30 underline-offset-[6px] transition hover:decoration-[#2D2D2D]/60">
                Online buchen
              </BookingLink>
              <a
                href="tel:+4917669150964"
                className="underline decoration-[#2D2D2D]/30 underline-offset-[6px] transition hover:decoration-[#2D2D2D]/60"
              >
                Anrufen
              </a>
            </div>
          </div>

          <div className="mt-12 shrink-0 text-copy-sm space-y-7 text-[#2D2D2D]/90 lg:mt-80 lg:w-[13.5rem]">
            <address className="not-italic leading-[1.65]">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="space-y-1 leading-[1.65]">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
            <div className="space-y-2 leading-[1.65]">
              <a href="tel:+4917669150964" className="block transition hover:opacity-70">
                +49 176 69150964
              </a>
              <a href="mailto:info@petitemaison.hamburg" className="block break-words transition hover:opacity-70">
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

        {/* Bilder: links · rechts */}
        <div className="mt-16 flex flex-col lg:mt-20 lg:flex-row lg:items-start lg:justify-between">
          <figure className="relative aspect-[3/4] w-[min(100%,17.5rem)] shrink-0 overflow-hidden bg-[#E6E3DE] lg:w-[min(22vw,18rem)]">
            <Image
              src="/kontakt/kontakt_bild1.png"
              alt="Salon Interior Petite Maison – Arbeitsplätze mit Spiegeln"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 70vw, 22vw"
              priority
            />
          </figure>

          <figure className="relative mt-12 w-full shrink-0 overflow-hidden bg-[#E6E3DE] lg:mt-140 lg:w-[min(42vw,42rem)]">
            <div className="relative h-[min(68vh,46rem)] w-full min-h-[19rem]">
              <Image
                src="/kontakt/kontakt_bild2.png"
                alt="Waschbereich und Aveda-Bereich im Salon Petite Maison"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </figure>
        </div>
      </section>
    </main>
  );
}
