import Link from "next/link";

export const metadata = {
  title: "Leistungen | Petite Maison",
  description:
    "Haarschnitte, Farbe, Highlights, Pflege – individuell für dich. Transparente Preise und Zeiten.",
};

const leistungsbereiche = [
  {
    title: "Haarschnitt & Styling",
    description:
      "Individuell abgestimmt auf deinen Typ, deinen Alltag und deine Wünsche. Wir nehmen uns Zeit für Beratung und einen Schnitt, der zu dir passt.",
    highlight: false,
  },
  {
    title: "Farbe & Highlights",
    description:
      "Stännen und Highlights sind unsere Bestseller. Mit nachhaltigen Produkten von Aveda und individueller Beratung erzielen wir Ergebnisse, die natürlich wirken und bestand haben.",
    highlight: true,
  },
  {
    title: "Pflege & individuelle Beratung",
    description:
      "Jedes Haar braucht etwas anderes. Wir beraten dich zu Pflege und Styling – damit dein Ergebnis auch zu Hause hält.",
    highlight: false,
  },
];

const weitereLeistungen = [
  "Kosmetik",
  "Wimpern und Augenbrauenfärben",
  "Dauerwelle",
  "Bart",
];

export default function LeistungenPage() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#2D2D2D] md:text-5xl">
            Unsere Leistungen
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und
            Männer an – immer individuell abgestimmt auf dein Haar, deinen Typ
            und deinen Alltag. Transparenz bei Preisen und Dauer ist uns wichtig.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Unsere Leistungen folgen einer zeitlichen Planung, die Qualität
            ermöglicht. Nicht alles braucht gleich viel Zeit – aber alles die
            Aufmerksamkeit, die es verdient.
          </p>
        </div>
      </section>

      {/* Leistungsbereiche */}
      <section className="bg-[#F5F2ED] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D]">
            Leistungsbereiche
          </h2>
          <div className="mt-12 space-y-16">
            {leistungsbereiche.map((leistung) => (
              <div
                key={leistung.title}
                className="border-b border-[#E8E4DF] pb-16 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-display text-xl font-medium text-[#2D2D2D]">
                    {leistung.title}
                  </h3>
                  {leistung.highlight && (
                    <span className="rounded-full bg-[#D4A5A5]/30 px-3 py-1 text-sm text-[#5C4033]">
                      Bestseller
                    </span>
                  )}
                </div>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
                  {leistung.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weitere Leistungen */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D]">
            Weitere Leistungen
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Auf Anfrage bieten wir auch Kosmetik, Wimpern- und
            Augenbrauenfärben, Dauerwelle und Bartpflege an. Sprich uns gerne
            darauf an.
          </p>
          <ul className="mt-6 flex flex-wrap gap-4">
            {weitereLeistungen.map((l) => (
              <li
                key={l}
                className="rounded-lg border border-[#E8E4DF] bg-white px-4 py-2 text-[#2D2D2D]"
              >
                {l}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#E8E4DF] py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D]">
            Individuelle Beratung
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir planen jeden Termin bewusst, damit Qualität und Zeit für dich
            stimmen. Für eine erste Einschätzung oder Buchung erreichst du uns
            online oder telefonisch.
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
