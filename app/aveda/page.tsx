import Link from "next/link";

export const metadata = {
  title: "Aveda | Petite Maison",
  description:
    "Wir sind ein Aveda-Salon. Nachhaltige Haarpflege und bewusster Umgang mit Ressourcen – das ist unsere Haltung.",
};

export default function AvedaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#D4CFC8]">
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-h1 text-[#B8A898]">
                  Aveda
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-h1 text-[#2D2D2D]">
                Aveda
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
                AVEDA steht für nachhaltige Haarpflege und einen bewussten
                Umgang mit Ressourcen. Diese Haltung passt zu unserer Arbeit –
                verantwortungsvoll, achtsam und mit Anspruch an Qualität.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
                Als Aveda-Salon arbeiten wir mit Produkten, die nicht nur
                deinem Haar guttun, sondern auch der Umwelt. Von der Wurzel bis
                zur Spitze – das ist die Philosophie, die wir teilen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophie */}
      <section className="bg-[#EBEAE7] py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-h2 font-medium tracking-tight text-[#2D2D2D]">
            Die Aveda-Philosophie
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-[#2D2D2D]/85">
            <p>
              Aveda wurde mit der Vision gegründet, Schönheit und Nachhaltigkeit
              zu verbinden. Die Marke setzt auf pflanzliche Inhaltsstoffe,
              recycelbare Verpackungen und einen respektvollen Umgang mit der
              Natur.
            </p>
            <p>
              Für uns bedeutet die Partnerschaft mit Aveda: Wir können dir
              Produkte anbieten, die zu unserem Anspruch an Qualität und
              Verantwortung passen. Unsere Kund:innen schätzen den bewussten
              Umgang – und wir sind stolz darauf, diese Werte zu teilen.
            </p>
          </div>
        </div>
      </section>

      {/* Aktuelle Produkte */}
      <section className="border-t border-[#E8E4DF] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-h2 font-medium tracking-tight text-[#2D2D2D]">
            Unsere Produkte
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir arbeiten mit ausgewählten Aveda-Produkten für Farbe, Pflege und
            Styling. Im Salon kannst du sie auch zum Mitnehmen erwerben – für
            zu Hause und unterwegs.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] overflow-hidden rounded-lg bg-[#E8E4DF]"
              >
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-h3 text-[#D4CFC8]">
                    Produkt {i}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#E8E4DF] py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-h2 font-medium tracking-tight text-[#2D2D2D]">
            Entdecke unsere Arbeit
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen – mit Aveda
            und allem, was dazu gehört.
          </p>
          <Link
            href="/kontakt?buchung=1"
            className="mt-10 inline-block rounded-full bg-[#2D2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#4A5D4A]"
          >
            Termin buchen
          </Link>
        </div>
      </section>
    </main>
  );
}
