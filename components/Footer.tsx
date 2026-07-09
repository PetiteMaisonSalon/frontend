import Link from "next/link";
import BookingLink from "@/components/BookingLink";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#salon", label: "Salon" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/#aveda", label: "Aveda" },
  { href: "/kontakt", label: "Kontakt" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

export default function Footer() {
  return (
    <footer className="bg-[#BEA8FF] text-[#2D2D2D]">
      <div className="w-full px-4 pb-16 pt-16 md:pb-20 md:pt-20">
        {/* CTA oben links */}
        <div className="max-w-[34rem] lg:max-w-[38rem]">
          <h2 className="text-intro text-[#2D2D2D]">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen.
          </h2>
          <p className="text-copy-sm mt-5 max-w-[32rem] leading-relaxed text-[#2D2D2D]/90">
            Deinen Termin kannst du jederzeit online oder telefonisch vereinbaren. Du erreichst uns
            telefonisch unter{" "}
            <a href="tel:+4917669150964" className="transition hover:opacity-80">
              +49 176 69150964
            </a>
          </p>
          <BookingLink className="text-copy mt-8 inline-block rounded-full border border-[#2D2D2D]/60 bg-transparent px-10 py-3 font-medium text-[#2D2D2D] transition hover:bg-[#2D2D2D]/5">
            Jetzt buchen
          </BookingLink>
        </div>

        {/* Unten: Adresse links · Kontakt · Nav · Legal rechts */}
        <div className="mt-24 flex flex-col gap-12 lg:mt-28 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="shrink-0 text-copy-sm leading-relaxed text-[#2D2D2D]/90">
            <p className="font-medium text-[#2D2D2D]">Petite Maison</p>
            <address className="mt-4 not-italic">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="mt-8">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
          </div>

          <div className="grid gap-10 text-copy-sm text-[#2D2D2D]/90 sm:grid-cols-3 sm:gap-x-12 lg:ml-auto lg:gap-x-16 xl:gap-x-20">
            <div className="space-y-2">
              <a href="tel:+4917669150964" className="block transition hover:opacity-80">
                +49 176 69150964
              </a>
              <a href="mailto:info@petitemaison.hamburg" className="block transition hover:opacity-80">
                info@petitemaison.hamburg
              </a>
              <a
                href="https://wa.me/4917669150964"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition hover:opacity-80"
              >
                Whatsapp
              </a>
              <a
                href="https://www.instagram.com/petite_maison_hamburg"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition hover:opacity-80"
              >
                Instagram
              </a>
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="transition hover:opacity-80">
                  {label}
                </Link>
              ))}
            </nav>

            <nav className="flex flex-col gap-2">
              {legalLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="transition hover:opacity-80">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
