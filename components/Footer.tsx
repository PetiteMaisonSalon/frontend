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
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 md:pb-20 md:pt-20">
        {/* Top-CTA links */}
        <div className="max-w-[560px]">
          <h2 className="text-h1 text-[#2D2D2D]">
            Wir freuen uns darauf, dich
            <br />
            bei uns begrüßen zu dürfen.
          </h2>
          <p className="text-copy-sm mt-5 max-w-[520px] leading-relaxed text-[#2D2D2D]/90">
            Deinen Termin kannst du jederzeit online oder telefonisch vereinbaren.
            <br />
            Du erreichst uns telefonisch unter{" "}
            <a href="tel:+4917669150964" className="underline underline-offset-2">
              +49 176 69150964
            </a>
          </p>
          <Link
            href="/buchung"
            className="text-copy mt-8 inline-block rounded-full border border-[#2D2D2D]/60 bg-transparent px-10 py-3 font-medium text-[#2D2D2D] transition hover:bg-[#2D2D2D]/5"
          >
            Jetzt buchen
          </Link>
        </div>

        {/* Bottom columns */}
        <div className="mt-28 grid gap-12 md:grid-cols-[1fr_auto] md:items-start md:gap-10">
          <div className="text-copy-sm leading-relaxed text-[#2D2D2D]/90">
            <p className="font-medium text-[#2D2D2D]">Petite Maison</p>
            <address className="mt-4 not-italic">
              <p>Arndtstr. 33</p>
              <p>22085 Hamburg</p>
            </address>
            <div className="mt-10">
              <p>Di – Fr 9–20 Uhr</p>
              <p>Sa 9–14 Uhr</p>
            </div>
          </div>

          {/* Rechts: Kontakt + Navigation + Legal (alles rechts gebündelt) */}
          <div className="grid gap-12 text-copy-sm text-[#2D2D2D]/90 md:ml-auto md:grid-cols-3 md:gap-x-16 md:gap-y-0">
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
