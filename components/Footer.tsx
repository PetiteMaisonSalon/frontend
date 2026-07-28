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
    <footer className="bg-[#BEA8FF] text-[#1C1612]">
      <div className="w-full px-4 pb-8 pt-4 md:pt-6">
        {/* CTA oben links */}
        <div className="max-w-136 lg:max-w-152">
          <h2 className="md:text-intro text-[#1C1612] text-intro-mobile">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen.
          </h2>
          <p className="text-copy-sm mt-2 max-w-lg leading-relaxed text-[#1C1612]">
            Deinen Termin kannst du jederzeit online oder telefonisch
            vereinbaren. Du erreichst uns telefonisch unter{" "}
            <a
              href="tel:+4917669150964"
              className="border-b border-[#1C1612] transition hover:opacity-80"
            >
              +49 176 69150964
            </a>
          </p>
          <BookingLink className="inline-block mt-6 rounded-[14px] border-[1.5px] border-[#1C1612] bg-transparent px-5 py-1.5 text-sm font-semibold text-[#1C1612] transition hover:bg-[#1C1612] hover:text-white">
            Jetzt buchen
          </BookingLink>
        </div>

        {/* Unten: Adresse links · Kontakt · Nav · Legal rechts */}
        <div className="mt-24 flex flex-col gap-6 lg:mt-20 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="shrink-0 text-copy-sm leading-relaxed text-[#1C1612]">
            <p className="text-[#1C1612]">Petite Maison</p>
            <address className="not-italic">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="mt-8">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
          </div>

          <div className="grid gap-10 text-copy-sm text-[#1C1612] sm:grid-cols-3 sm:gap-x-12 lg:ml-auto lg:gap-x-10 xl:gap-x-10">
            <div className="space-y-2">
              <a
                href="tel:+4917669150964"
                className="block transition hover:opacity-80"
              >
                +49 176 69150964
              </a>
              <a
                href="mailto:info@petitemaison.hamburg"
                className="block transition hover:opacity-80"
              >
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

            <nav className="flex flex-col gap-1 items-end">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition hover:opacity-80"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <nav className="flex flex-col gap-1 items-end">
              {legalLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition hover:opacity-80"
                >
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
