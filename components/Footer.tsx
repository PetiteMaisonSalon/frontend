import Link from "next/link";

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
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-14 md:pb-20 md:pt-16">
        <div className="max-w-xl">
          <h2 className="text-h2 text-[#2D2D2D]">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen.
          </h2>
          <p className="text-copy mt-5 leading-relaxed text-[#2D2D2D]/90">
            Deinen Termin kannst du jederzeit online oder telefonisch vereinbaren. Du erreichst
            uns telefonisch unter{" "}
            <a href="tel:+4917669150964" className="underline underline-offset-2">
              +49 176 69150964
            </a>
          </p>
          <Link
            href="/buchung"
            className="text-copy mt-8 inline-block rounded-full border border-[#2D2D2D] bg-transparent px-8 py-3 font-medium text-[#2D2D2D] transition hover:bg-[#2D2D2D]/5"
          >
            Jetzt buchen
          </Link>
        </div>

        <div className="mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="text-copy space-y-6 leading-relaxed">
            <p className="text-h3 text-[#2D2D2D]">Petite Maison</p>
            <address className="not-italic">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="pt-2">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
          </div>

          <div className="text-copy space-y-4">
            <a href="tel:+4917669150964" className="block transition hover:opacity-80">
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

          <nav className="text-copy flex flex-col gap-3">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="transition hover:opacity-80">
                {label}
              </Link>
            ))}
          </nav>

          <nav className="text-copy flex flex-col gap-3">
            {legalLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="transition hover:opacity-80">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
