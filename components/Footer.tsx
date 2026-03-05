import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/salon", label: "Salon" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/aveda", label: "Aveda" },
  { href: "/kontakt", label: "Kontakt" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

export default function Footer() {
  return (
    <footer className="bg-[#2D2D2D] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Salonname & Adresse */}
          <div className="space-y-6">
            <h3 className="font-display text-3xl font-medium tracking-tight">
              Petite Maison
            </h3>
            <address className="not-italic text-[#E8E4DF]/90">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
          </div>

          {/* Öffnungszeiten */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-[#E8E4DF]/70">
              Öffnungszeiten
            </h4>
            <p className="text-[#E8E4DF]/90">Di – Fr: 9 – 20 Uhr</p>
            <p className="text-[#E8E4DF]/90">Sa: 9 – 14 Uhr</p>
          </div>

          {/* Kontakt */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-[#E8E4DF]/70">
              Kontakt
            </h4>
            <a
              href="tel:+4917669150964"
              className="block text-[#E8E4DF]/90 transition hover:text-white"
            >
              +49 176 69150964
            </a>
            <a
              href="mailto:info@petitemaison.hamburg"
              className="block text-[#E8E4DF]/90 transition hover:text-white"
            >
              info@petitemaison.hamburg
            </a>
            <div className="flex gap-4 pt-2">
              <a
                href="https://wa.me/4917669150964"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E8E4DF]/90 transition hover:text-white"
                aria-label="WhatsApp"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/petite_maison_hamburg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E8E4DF]/90 transition hover:text-white"
                aria-label="Instagram"
              >
                Instagram
              </a>
              
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-[#E8E4DF]/70">
              Navigation
            </h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[#E8E4DF]/90 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {legalLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[#E8E4DF]/70 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
