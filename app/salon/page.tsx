import Link from "next/link";

export const metadata = {
  title: "Salon | Petite Maison",
  description:
    "Unser Salon auf der Uhlenhorst – ruhig gelegen, individuelle Betreuung, Zeit und Aufmerksamkeit im Mittelpunkt.",
};

const team = [
  {
    name: "Mehtap",
    role: "Friseurmeisterin & Inhaberin",
    description:
      "Mehtap ist Friseurmeisterin und Inhaberin von Petite Maison. Ihr liegt der persönliche Umgang mit Menschen am Herzen – sie übernimmt Verantwortung in ihrem Handwerk und schafft eine Atmosphäre, in der man sich wohl fühlt.",
    imagePos: "left",
  },
  {
    name: "Sevim",
    role: "Farbspezialistin",
    description:
      "Sevim ist unsere Farbspezialistin. Sie liebt es, mit Haaren zu experimentieren und bringt langjährige Erfahrung von einem Starfriseur mit. Bei Petite Maison setzt sie ihren Anspruch an Ästhetik und Nachhaltigkeit um.",
    imagePos: "right",
  },
  {
    name: "Maria",
    role: "Schnittspezialistin",
    description:
      "Maria ist unsere Schnittspezialistin. Mit jahrelanger Erfahrung und Leidenschaft für das Handwerk – ebenfalls geprägt von einem Starfriseur – bringt sie Präzision und eine persönliche Note in jeden Schnitt. Neben der Arbeit liebt sie Tapas und leidenschaftlichen Rumbatanz.",
    imagePos: "left",
  },
];

const leistungen = [
  "Haarschnitt & Styling",
  "Farbe & Highlights",
  "Pflege & individuelle Beratung",
];

export default function SalonPage() {
  return (
    <main>
      {/* Unser Salon – Salonseite 1 */}
      <section className="border-b border-[#E8E4DF]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D]">
                Unser Salon
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
                Unser Salon liegt im Innenhof auf der Uhlenhorst – ruhig gelegen
                und etwas zurückgezogen. Ein Ort, an dem man ankommen kann und
                in dem Zeit, Aufmerksamkeit und sorgfältige Arbeit im
                Mittelpunkt stehen.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
                Er soll sich wie ein Ort anfühlen, an dem man durchatmen kann.
                Hier stehen Begegnungen, Aufmerksamkeit und gutes Handwerk im
                Vordergrund.
              </p>
            </div>
            <div className="order-1 aspect-[4/3] overflow-hidden rounded-lg bg-[#E8E4DF] lg:order-2">
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-3xl text-[#D4CFC8]">
                  Salonbild
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unsere Leistungen – Salonseite 1 */}
      <section className="bg-[#F5F2ED] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D]">
            Unsere Leistungen
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und
            Männer an – immer individuell abgestimmt auf dein Haar, deinen Typ
            und deinen Alltag.
          </p>
          <h3 className="mt-10 font-display text-xl font-medium text-[#2D2D2D]">
            Leistungsbereiche
          </h3>
          <ul className="mt-4 space-y-2">
            {leistungen.map((l) => (
              <li key={l} className="text-lg text-[#2D2D2D]/85">
                • {l}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#2D2D2D]/85">
            Unsere Leistungen folgen einer zeitlichen Planung, die Qualität
            ermöglicht. Nicht alles braucht gleich viel Zeit – aber alles die
            Aufmerksamkeit, die es verdient.
          </p>
          <Link
            href="/leistungen"
            className="mt-10 inline-block border-2 border-[#2D2D2D] px-8 py-3 font-medium text-[#2D2D2D] transition hover:bg-[#2D2D2D] hover:text-white"
          >
            Zur Leistungsübersicht
          </Link>
        </div>
      </section>

      {/* Unser Team – Salonseite 2 */}
      <section className="border-t border-[#E8E4DF] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D]">
              Unser Team
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
              Petite Maison ist ein Ort, an dem Erfahrung und Persönlichkeit
              zusammenkommen. Wir arbeiten als kleines Team und teilen den
              Anspruch, jede Kundin und jeden Kunden individuell zu betreuen.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
              Was uns verbindet, ist die Freude am Handwerk, ein ruhiger
              Arbeitsstil und der Wunsch, eine Atmosphäre zu schaffen, in der man
              sich wohl und ernst genommen fühlt.
            </p>
          </div>

          <div className="mt-16 space-y-24">
            {team.map((member) => (
              <div
                key={member.name}
                className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
              >
                <div
                  className={
                    member.imagePos === "right" ? "lg:order-2" : "lg:order-1"
                  }
                >
                  <div className="aspect-square max-w-md overflow-hidden rounded-lg bg-[#E8E4DF]">
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl text-[#D4CFC8]">
                        {member.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={
                    member.imagePos === "right" ? "lg:order-1" : "lg:order-2"
                  }
                >
                  <h3 className="font-display text-2xl font-medium text-[#2D2D2D]">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm uppercase tracking-wider text-[#4A5D4A]">
                    {member.role}
                  </p>
                  <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aveda – Salonseite 3 */}
      <section className="bg-[#E8E4DF] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#D4CFC8]">
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-3xl text-[#D4CFC8]">
                  Aveda
                </span>
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D]">
                Aveda
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
                AVEDA steht für nachhaltige Haarpflege und einen bewussten Umgang
                mit Ressourcen. Diese Haltung passt zu unserer Arbeit –
                verantwortungsvoll, achtsam und mit Anspruch an Qualität.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#2D2D2D]/85">
                Als Aveda-Salon setzen wir bewusst auf Produkte, die nicht nur
                gut für dein Haar sind, sondern auch für die Umwelt. Wir arbeiten
                mit der Aveda-Philosophie – von der Wurzel bis zur Spitze.
              </p>
              <Link
                href="/aveda"
                className="mt-8 inline-block font-medium text-[#4A5D4A] transition hover:underline"
              >
                Mehr über Aveda erfahren →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Termine – Salonseite 3 */}
      <section className="border-t border-[#E8E4DF] bg-[#F5F2ED] py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[#2D2D2D] md:text-4xl">
            Termine
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#2D2D2D]/85">
            Wir freuen uns darauf, dich bei uns begrüßen zu dürfen. Deinen
            Termin kannst du jederzeit online oder telefonisch vereinbaren. Wenn
            du uns anrufen möchtest, erreichst du uns direkt über die
            Kontaktseite.
          </p>
          <Link
            href="/kontakt?buchung=1"
            className="mt-10 inline-block rounded-full bg-[#2D2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#4A5D4A]"
          >
            Jetzt Termin buchen
          </Link>
        </div>
      </section>
    </main>
  );
}
