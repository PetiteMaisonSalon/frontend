import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt | Petite Maison",
  description:
    "Petite Maison Hamburg – Adresse, Öffnungszeiten, Kontakt. Termin online oder telefonisch vereinbaren.",
};

export default function KontaktPage() {
  return (
    <main className="bg-[#F2F0EB]">
      <section className="mx-auto max-w-[min(100%,2000px)] px-6 pb-32 pt-12 sm:px-10 sm:pt-16 md:px-16 md:pb-40 lg:px-20 lg:pb-48 lg:pt-20 xl:px-28 xl:pt-24">
        {/* ~1/3 Text links · Kontakt weit rechts, mit Abstand von oben (Mitte des linken Textes) */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="font-display text-[#2D2D2D] lg:col-span-4 xl:max-w-[28rem]">
            <p className="text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[1.12] tracking-[-0.02em]">
              Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen Termin kannst du jederzeit online
              oder telefonisch vereinbaren.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-12 gap-y-2 text-[0.875rem] [font-family:var(--font-public-sans)] sm:mt-10">
              <Link
                href="/buchung"
                className="underline decoration-[#2D2D2D]/30 underline-offset-[6px] transition hover:decoration-[#2D2D2D]/60"
              >
                Online buchen
              </Link>
              <a
                href="tel:+4917669150964"
                className="underline decoration-[#2D2D2D]/30 underline-offset-[6px] transition hover:decoration-[#2D2D2D]/60"
              >
                Anrufen
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 lg:col-start-10 lg:pt-16 lg:text-left xl:pt-20">
            <div className="ml-auto w-full max-w-[13.5rem] text-copy-sm space-y-7 text-[#2D2D2D]/90">
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
        </div>

        {/* Viel Leerraum; Bilder: links klein (≈25% Raster) · rechts groß, klar tiefer, an rechter Kante */}
        <div className="mt-28 min-h-0 sm:mt-36 lg:mt-48 xl:mt-56">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-0">
            <figure className="relative aspect-[3/4] w-full max-w-md overflow-hidden bg-[#E6E3DE] sm:max-w-lg lg:col-span-3 lg:max-h-[min(60vh,26rem)] lg:max-w-none">
              <Image
                src="/kontakt/kontakt_bild1.png"
                alt="Salon Interior Petite Maison – Arbeitsplätze mit Spiegeln"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 26vw"
                priority
              />
            </figure>

            <figure
              className="relative w-full max-w-3xl overflow-hidden bg-[#E6E3DE] sm:ml-auto sm:mt-4 lg:col-span-5 lg:col-start-8 lg:mt-32 lg:ml-0 lg:min-h-0 lg:max-w-none xl:mt-40"
            >
              <div className="relative h-[min(68vh,46rem)] w-full min-h-[19rem]">
                <Image
                  src="/kontakt/kontakt_bild2.png"
                  alt="Waschbereich und Aveda-Bereich im Salon Petite Maison"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>
    </main>
  );
}
