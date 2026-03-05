export default function KontaktPage() {

  return (
    <main>
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D] md:text-5xl">
            Kontakt
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Du erreichst uns telefonisch, oder über unsere Social Media Kanal. Für
            Terminbuchungen nutze gerne unseren Online Buchungsbereich oder rufe
            uns an.
          </p>
        </div>
      </section>

      <section className="bg-[#F5F2ED] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            {/* Kontaktdaten */}
            <div className="space-y-10">
              <div>
                <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
                  Adresse
                </h2>
                <address className="mt-4 not-italic text-lg text-[#2D2D2D]/85">
                  Petite Maison
                  <br />
                  Arndtstr. 33
                  <br />
                  22085 Hamburg
                </address>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
                  Öffnungszeiten
                </h2>
                <p className="mt-4 text-lg text-[#2D2D2D]/85">
                  Di – Fr: 9 – 20 Uhr
                  <br />
                  Sa: 9 – 14 Uhr
                </p>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
                  Kontakt
                </h2>
                <div className="mt-4 space-y-2 text-lg">
                  <a
                    href="tel:+4917669150964"
                    className="block text-[#4A5D4A] transition hover:underline"
                  >
                    +49 176 69150964
                  </a>
                  <a
                    href="mailto:info@petitemaison.hamburg"
                    className="block text-[#4A5D4A] transition hover:underline"
                  >
                    info@petitemaison.hamburg
                  </a>
                </div>
                <div className="mt-4 flex gap-6">
                  <a
                    href="https://wa.me/4917669150964"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5D4A] transition hover:underline"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="https://www.instagram.com/petite_maison_hamburg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5D4A] transition hover:underline"
                  >
                    Instagram
                  </a>
              
                </div>
              </div>
            </div>

            {/* Buchungshinweis */}
            <div className="rounded-2xl border border-[#E8E4DF] bg-white p-8 md:p-10">
              <h2 className="font-display text-2xl font-medium text-[#2D2D2D]">
                Termin buchen
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
                Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen
                Termin kannst du jederzeit online oder telefonisch vereinbaren.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
                Buche bequem online – oder rufe uns an unter{" "}
                <a
                  href="tel:+4917669150964"
                  className="font-medium text-[#4A5D4A] hover:underline"
                >
                  +49 176 69150964
                </a>{" "}
                
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/buchung"
                  className="inline-block rounded-full bg-[#4A5D4A] px-6 py-3 font-medium text-white transition hover:bg-[#3A4A3A]"
                >
                  Online buchen
                </a>
                <a
                  href="tel:+4917669150964"
                  className="inline-block rounded-full border-2 border-[#4A5D4A] px-6 py-3 font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A] hover:text-white"
                >
                  Jetzt anrufen
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
