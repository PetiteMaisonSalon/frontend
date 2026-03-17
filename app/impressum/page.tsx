export const metadata = {
  title: "Impressum | Petite Maison",
  description: "Impressum von Petite Maison Hamburg gemäß §5 TMG.",
};

export default function ImpressumPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D]">
            Impressum
          </h1>

          <div className="mt-8 space-y-8 text-lg leading-relaxed text-[#2D2D2D]/85">
            <section>
              <h2 className="font-display text-2xl text-[#2D2D2D]">Angaben gemäß §5 TMG</h2>
              <div className="mt-4 rounded-xl border border-[#E8E4DF] bg-[#F9F7F3] p-4">
                <p className="font-medium text-[#2D2D2D]">Petite Maison Hamburg</p>
                <p>Arndtstraße 33</p>
                <p>22085 Hamburg</p>
              </div>
            </section>

            <section>
              <p>
                <span className="font-medium text-[#2D2D2D]">Geschäftsführerin:</span> Mehtap
                Küçük
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-[#2D2D2D]">Kontakt</h2>
              <p className="mt-2">
                E-Mail:{" "}
                <a
                  href="mailto:info@petitemaison.hamburg"
                  className="text-[#4A5D4A] hover:underline"
                >
                  info@petitemaison.hamburg
                </a>
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-[#2D2D2D]">Umsatzsteuer-ID</h2>
              <p className="mt-2">
                Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: DE
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-[#2D2D2D]">Inhaltlich Verantwortliche</h2>
              <p className="mt-2">Mehtap Küçük</p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-[#2D2D2D]">
                Hinweis auf EU-Streitschlichtung
              </h2>
              <p className="mt-2">
                Die europäische Kommission stellt eine Plattform zur Online-Streitbeteiligung (OS)
                bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4A5D4A] hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </section>

            <section>
              <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
