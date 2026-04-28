"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SectionTheme = {
  id: "salon" | "team" | "gallerie"| "aveda" ;
  bg: string;
};

const HOME_SECTIONS: SectionTheme[] = [
  { id: "salon", bg: "#F1EEE9" },
  { id: "team", bg: "#F1EEE9" },
  { id: "gallerie", bg: "#F1EEE9" },
  { id: "aveda", bg: "#BEA8FF" },
];

function dispatch(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function HomeMain() {
  const heroRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const galerieRef = useRef<HTMLDivElement | null>(null);
  const [galerieIndex, setGalerieIndex] = useState(0);
  const mainLeftRef = useRef<HTMLDivElement | null>(null);
  const [mainLeftIndex, setMainLeftIndex] = useState(0);
  const galerieImages = useMemo(
    () => [
      "/gallerie/galerie_bild1.png",
      "/gallerie/galerie_bild2.png",
      "/gallerie/galerie_bild3.png",
      "/gallerie/galerie_bild4.png",
      "/gallerie/galerie_bild5.png",
      "/gallerie/galerie_bild6.png",
      "/gallerie/galerie_bild7.png",
      "/gallerie/galerie_bild8.png",
      "/gallerie/galerie_bild9.png",
      "/gallerie/galerie_bild10.png",
      "/gallerie/galerie_bild11.png",
      "/gallerie/galerie_bild12.png",
    ],
    []
  );
  const galerieSlides = useMemo(() => Math.ceil(galerieImages.length / 3), [galerieImages.length]);

  const sectionById = useMemo(() => {
    const map = new Map<string, SectionTheme>();
    for (const s of HOME_SECTIONS) map.set(s.id, s);
    return map;
  }, []);

  const mainLeftImages = useMemo(
    () => [
      "/main_leftbild1_1.png",
      "/main_leftbild1_2.jpg",
      "/main_leftbild1_3.jpg",
      "/main_leftbild1_4.avif",
    ],
    []
  );
  const mainLeftSlides = useMemo(() => mainLeftImages.length, [mainLeftImages.length]);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        dispatch("pm:home:hero", { visible: entry.isIntersecting });
      },
      { threshold: 0.25 }
    );
    heroObserver.observe(heroEl);

    const sectionEls = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    let rafId = 0;
    const syncActiveSection = () => {
      rafId = 0;
      const markerY = Math.min(180, window.innerHeight * 0.35);
      const current =
        sectionEls.find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top <= markerY && rect.bottom > markerY;
        }) ||
        sectionEls
          .map((el) => ({ el, distance: Math.abs(el.getBoundingClientRect().top - markerY) }))
          .sort((a, b) => a.distance - b.distance)[0]?.el;

      const id = current?.dataset.sectionId;
      if (!id) return;
        const theme = sectionById.get(id);
        if (!theme) return;
        dispatch("pm:home:section", { id: theme.id, bg: theme.bg });
    };
    const scheduleActiveSectionSync = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(syncActiveSection);
    };

    syncActiveSection();
    window.addEventListener("scroll", scheduleActiveSectionSync, { passive: true });
    window.addEventListener("resize", scheduleActiveSectionSync);

    // Initialzustand: Hero sichtbar, damit Header korrekt startet.
    dispatch("pm:home:hero", { visible: true });

    return () => {
      heroObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleActiveSectionSync);
      window.removeEventListener("resize", scheduleActiveSectionSync);
    };
  }, [sectionById]);

  return (
    <main className="relative">
      {/* HERO (Viewport 1) */}
      <section
        ref={(el) => {
          heroRef.current = el;
        }}
        className="relative flex min-h-[100dvh] min-h-screen flex-col"
      >
        <Image
          src="/header_bg.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-28 text-center md:pb-32 md:pt-36">
          <h1 className="text-h1 max-w-3xl text-white">
            Deine Haare sind
            <br className="hidden md:block" />
            Vertrauenssache.
          </h1>
          <Link
            href="/buchung"
            className="text-copy mt-10 inline-block rounded-full border border-white bg-transparent px-10 py-4 font-medium text-white transition hover:bg-white/10"
          >
            Jetzt buchen
          </Link>
        </div>
      </section>

      {/* MAIN (Viewport 2+) — wie Screenshot: viel Weißraum, Bild + Text */}
      <section
        id="salon"
        data-section-id="salon"
        ref={(el) => {
          sectionRefs.current.salon = el;
        }}
        className="pm-home-section bg-[#F1EEE9] px-6 py-20 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-2 md:gap-16 lg:grid-cols-2 lg:gap-2">
          <div className="w-full">
            <div className="relative aspect-[15/12] w-full overflow-hidden bg-[#E8E4DF]">
              <div
                ref={mainLeftRef}
                className="no-scrollbar absolute inset-0 overflow-x-auto scroll-smooth snap-x snap-mandatory"
                onScroll={() => {
                  const el = mainLeftRef.current;
                  if (!el) return;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== mainLeftIndex) setMainLeftIndex(idx);
                }}
              >
                <div className="flex h-full w-full">
                  {mainLeftImages.map((src) => (
                    <div key={src} className="relative h-full w-full flex-none snap-start">
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Indicators + Buttons (unter dem Bild) */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2" aria-hidden>
                {mainLeftImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-px w-8 ${i === mainLeftIndex ? "bg-[#2D2D2D]/60" : "bg-[#2D2D2D]/20"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Zurück"
                  className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.max(0, mainLeftIndex - 1);
                    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                    setMainLeftIndex(next);
                  }}
                  disabled={mainLeftIndex === 0}
                >
                  <svg
                    width="64"
                    height="16"
                    viewBox="0 0 64 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M12 2L2 8l10 6M4 8h58"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Weiter"
                  className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.min(mainLeftSlides - 1, mainLeftIndex + 1);
                    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                    setMainLeftIndex(next);
                  }}
                  disabled={mainLeftIndex >= mainLeftSlides - 1}
                >
                  <svg
                    width="64"
                    height="16"
                    viewBox="0 0 64 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M52 2l10 6-10 6M2 8h58"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="text-h2 text-[#2D2D2D]">
              Petite Maison ist ein Salon, in dem man sich Zeit füreinander nimmt.
              Für Gespräche, für Beratung und für eine Arbeit, mit Liebe zum Detail,
              die nicht zwischen Tür und Angel entsteht.
            </p>
          </div>
        </div>
      </section>

      {/* Zwischen-Section (Teil der Salon-Story, nicht der #team Anchor) */}
      <section id="salon-info" className="bg-[#F1EEE9] px-6 py-24 md:py-28">
        <div className="mx-auto grid max-w-7xl items-end gap-14 md:gap-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-28">
          <div className="max-w-[520px]">
            <p className="text-copy leading-relaxed text-[#2D2D2D]/85">
              Uns ist wichtig, dass du dich bei uns gut aufgehoben fühlst. Wir nehmen
              uns Zeit, stellen Fragen und beraten individuell. Jeder Termin ist bewusst
              so geplant, dass deine Wünsche im Mittelpunkt stehen und wir unsere Arbeit
              mit Ruhe und Sorgfalt ausführen können.
            </p>
            <Link
              href="/buchung"
              className="text-copy mt-8 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Jetzt Termin buchen
            </Link>
          </div>
          <div className="relative aspect-square w-full max-w-[420px] justify-self-end overflow-hidden bg-[#F1EEE9]">
            <Image
              src="/main_rightbild.png"
              alt=""
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      {/* Unsere Leistungen (wie Screenshot: Bild oben + zentrierter Text) */}
      <section className="pm-home-section bg-[#F1EEE9]" aria-labelledby="home-services-heading">
        <div className="px-6 py-32 text-center md:py-40">
          <p className="text-copy-sm font-medium tracking-[0.04em] text-[#2D2D2D]/70">
            Unsere Leistungen
          </p>
          <h2
            id="home-services-heading"
            className="text-h1 mx-auto mt-6 max-w-[760px] text-[#2D2D2D]"
          >
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und Männer an —
            immer individuell abgestimmt auf dein Haar, deinen Typ und deinen Alltag.
          </h2>
          <div className="mt-10 flex items-center justify-center gap-8 text-copy-sm">
            <Link
              href="/buchung"
              className="font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Jetzt buchen
            </Link>
            <Link
              href="/leistungen"
              className="font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
            >
              Zur Leistungsübersicht
            </Link>
          </div>
        </div>
      </section>

      <section
        className="pm-home-section bg-[#F1EEE9] px-6 py-16 md:py-20"
        aria-labelledby="home-services-cards-heading"
      >
        <h2 id="home-services-cards-heading" className="sr-only">
          Leistungen im Überblick
        </h2>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3 md:gap-8">
          {[
            {
              icon: "/schere.png",
              title: "Haarschnitt & Styling",
            },
            {
              icon: "/farbe.png",
              title: "Farbe & Highlights",
            },
            {
              icon: "/hand.png",
              title: "Pflege & individuelle Beratung",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center rounded-[28px] bg-white px-8 py-10 text-center shadow-sm transition-colors duration-300 ease-out hover:bg-[#BEA8FF]"
            >
              <div className="relative h-58 w-28">
                <Image
                  src={card.icon}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
              <h3 className="text-h3 mt-8 text-[#1a1a1a]">
                {card.title}
              </h3>
              <Link
                href="/buchung"
                className="text-copy mt-6 font-medium text-[#1a1a1a] underline underline-offset-4 transition hover:opacity-80"
              >
                Jetzt buchen
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="pm-home-section bg-[#F1EEE9] px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[445px] text-center">
          <p className="text-copy font-medium tracking-[0.04em] text-[#1a1a1a]/85">
            Unser Team
          </p>
          <p className="text-h2 mt-6 text-[#1a1a1a]">
            Was uns verbindet, ist die Freude am Handwerk, ein ruhiger Arbeitsstil und der
            Wunsch, eine Atmosphäre zu schaffen, in der man sich wohl und ernst genommen
            fühlt.
          </p>
        </div>
      </section>

      {/* TEAM / Mitarbeiter (Anchor + Submenu Ziel) — Bilder vorerst Platzhalter */}
      <section
        id="team"
        data-section-id="team"
        ref={(el) => {
          sectionRefs.current.team = el;
        }}
        className="pm-home-section bg-[#F1EEE9] px-6 pb-28 pt-6 md:pb-36"
        aria-labelledby="home-team-heading"
      >
        <h2 id="home-team-heading" className="sr-only">
          Team
        </h2>

        <div className="mx-auto max-w-7xl space-y-24 md:space-y-32 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-28 lg:gap-y-28">
          {/* Mehtap: Bild links, Text rechts (gleiche Zeile, kleinerer Abstand) */}
          <div className="lg:col-span-3 lg:row-start-1 lg:grid lg:grid-cols-[minmax(0,820px)_72px_minmax(0,520px)] lg:items-start">
            <article>
              <div className="relative aspect-[16/15] w-full overflow-hidden bg-transparent">
                <Image src="/mehtap.png" alt="Mehtap" fill className="object-cover" sizes="820px" />
              </div>
            </article>
            <div aria-hidden className="hidden lg:block" />
            <article className="lg:pt-2">
              <h3 className="text-h2 text-[#2D2D2D]">Mehtap</h3>
              <p className="text-copy-sm mt-4 max-w-[340px] font-medium leading-relaxed text-[#2D2D2D]/85">
                Ich bin Mehtap, Friseurmeisterin und Inhaberin von Petite Maison. Seit vielen Jahren arbeite ich
                in diesem Beruf und habe früh gemerkt, dass mir der persönliche Umgang mit Menschen genauso
                wichtig ist wie das Handwerk selbst.
              </p>
              <p className="text-copy-sm mt-5 max-w-[340px] font-medium leading-relaxed text-[#2D2D2D]/85">
                Für mich bedeutet Friseurhandwerk, Verantwortung zu übernehmen — für Entscheidungen, für Wünsche
                und für das Vertrauen, das mir entgegengebracht wird. Diese Haltung prägt meine tägliche Arbeit
                und den Salon als Ganzes.
              </p>
              <Link
                href="/buchung"
                className="text-copy-sm mt-6 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
              >
                Jetzt buchen
              </Link>
            </article>
          </div>

          
          <article className="lg:col-start-3 lg:row-start-2 lg:pt-24">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/maria.png" alt="Maria" fill className="object-cover grayscale" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Maria</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Maria ist unsere Schnittspezialistin! Sie ist seit 35 Jahren Friseurin mit Leidenschaft und hat
                  31 Jahre für den Starfriseur Jaques Le Coz gearbeitet. Maria isst gerne Tapas und tanzt
                  leidenschaftlich Rumba. Seit Anfang 2022 gehört sie zum Team dazu.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>

          {/* Sevim (links) */}
          <article className="lg:col-start-1 lg:row-start-3 lg:pt-24">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/sevim.png" alt="Sevim" fill className="object-cover" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Sevim</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Sevim ist unsere Farbspezialistin! Sie liebt es, mit Haaren zu experimentieren, einschließlich
                  ihren Haaren. Zwölf Jahre lang hat sie beim Starfriseur Jaques Le Coz gearbeitet und ist seit
                  Anfang 2022 bei Petite Maison.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>

          {/* Masoud (rechts) */}
          <article className="lg:col-start-3 lg:row-start-4 lg:pt-20">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/masoud.png" alt="Masoud" fill className="object-cover grayscale" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Masoud</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Masoud ist spezialisiert auf präzise Schnitte und Farbtechniken. Geboren im Iran, ausgebildet
                  auf zwei Kontinenten, ist er seit über 20 Jahren Friseur und seit Ende 2025 bei Petite Maison.
                  Als zertifizierter Aveda-Spezialist schwört er auf natürliche, nachhaltige Produkte.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>

          {/* Sarah (links) */}
          <article className="lg:col-start-1 lg:row-start-5 lg:pt-24">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/sarah.png" alt="Sarah" fill className="object-cover" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Sarah</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Sarah ist spezialisiert auf Haarschnitte, Styling und natürliche Färbungen. Seit über 15 Jahren
                  arbeitet sie mit Aveda-Produkten, 2022 hat sie ihren Meister gemacht — unter anderem lebte und
                  arbeitete sie in Wien. Seit November 2024 ist sie bei Petite Maison. Ihr Hund Cooper gehört im
                  Salon quasi zum Team.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>

          {/* Kanj (rechts) */}
          <article className="lg:col-start-3 lg:row-start-6 lg:pt-20">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/kanj.png" alt="Kanj" fill className="object-cover grayscale" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Kanj</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Kanj ist spezialisiert auf Strähnen, Balayage und Schnitte. Er hat 2016 im Libanon seine
                  Ausbildung gemacht und ist seit August 2025 fester Bestandteil des Teams. Nebenbei spielt er
                  libanesische Flöte, tritt mit seiner eigenen Band bei Festivals und Hochzeiten auf und war
                  bereits im libanesischen Fernsehen zu sehen.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>

          {/* Cooper (links) */}
          <article className="lg:col-start-1 lg:row-start-7 lg:pt-24">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_240px] lg:gap-10">
              <div className="relative aspect-square w-full overflow-hidden bg-transparent lg:w-[280px]">
                <Image src="/cooper.png" alt="Cooper" fill className="object-cover" sizes="280px" />
              </div>
              <div>
                <h3 className="text-h2 text-[#2D2D2D]">Cooper</h3>
                <p className="text-copy-sm mt-4 max-w-[240px] leading-relaxed text-[#2D2D2D]/85">
                  Cooper ist spezialisiert auf gute Laune und ist als Sarahs treuer Begleiter fester Bestandteil
                  des Salons.
                </p>
                <Link
                  href="/buchung"
                  className="text-copy-sm mt-5 inline-block font-medium text-[#2D2D2D] underline underline-offset-2 transition hover:opacity-80"
                >
                  Jetzt buchen
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* GALLERIE (Carousel wie Screenshot) */}
      <section
        id="gallerie"
        data-section-id="gallerie"
        ref={(el) => {
          sectionRefs.current.gallerie = el;
        }}
        className="pm-home-section bg-[#F1EEE9] pb-0 pt-6"
        aria-label="Galerie"
      >
        <div className="w-full">
          <div className="flex items-center justify-end gap-3 px-6 pb-4 md:pb-6">
            <button
              type="button"
              aria-label="Zurück"
              className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.max(0, galerieIndex - 1);
                el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                setGalerieIndex(next);
              }}
              disabled={galerieIndex === 0}
            >
              <svg
                width="64"
                height="16"
                viewBox="0 0 64 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M12 2L2 8l10 6M4 8h58"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Weiter"
              className="grid h-10 w-16 place-items-center text-[#2D2D2D] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.min(galerieSlides - 1, galerieIndex + 1);
                el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
                setGalerieIndex(next);
              }}
              disabled={galerieIndex >= galerieSlides - 1}
            >
              <svg
                width="64"
                height="16"
                viewBox="0 0 64 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M52 2l10 6-10 6M2 8h58"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            ref={galerieRef}
            className="no-scrollbar overflow-x-auto scroll-smooth snap-x snap-mandatory"
            onScroll={() => {
              const el = galerieRef.current;
              if (!el) return;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== galerieIndex) setGalerieIndex(idx);
            }}
          >
            <div className="flex w-full">
              {galerieImages
                .reduce<string[][]>((acc, src, i) => {
                  const groupIndex = Math.floor(i / 3);
                  if (!acc[groupIndex]) acc[groupIndex] = [];
                  acc[groupIndex].push(src);
                  return acc;
                }, [])
                .map((group, groupIdx) => (
                  <div
                    key={group.join("|")}
                    className="w-full flex-none snap-start"
                    aria-label={`Galerie Seite ${groupIdx + 1}`}
                  >
                    <div className="grid gap-4 px-6 md:grid-cols-2 md:gap-6 md:px-6 lg:grid-cols-3 lg:gap-0 lg:px-0">
                      {group.map((src) => (
                        <div
                          key={src}
                          className="relative aspect-[3/4] w-full overflow-hidden bg-[#F1EEE9]"
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                      ))}
                      {/* Fülle auf 3 Slots auf Desktop auf, damit Breiten immer gleich bleiben */}
                      {group.length < 3 &&
                        Array.from({ length: 3 - group.length }).map((_, idx) => (
                          <div
                            key={`empty-${groupIdx}-${idx}`}
                            className="hidden aspect-[3/4] w-full bg-[#F1EEE9] lg:block"
                            aria-hidden
                          />
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* AVEDA (lila) — wie Screenshot */}
      <section
        id="aveda"
        data-section-id="aveda"
        ref={(el) => {
          sectionRefs.current.aveda = el;
        }}
        className="pm-home-section bg-[#BEA8FF] px-6 pb-28 pt-24 md:pb-36 md:pt-28"
        aria-labelledby="home-aveda-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-overline text-[#2D2D2D]/70">Aveda</p>
            <h2
              id="home-aveda-heading"
              className="text-h2 mt-6 text-[#2D2D2D]"
            >
              Als Aveda-Salon arbeiten wir mit Produkten, die nicht nur deinem Haar guttun,
              sondern auch der Umwelt.
            </h2>
          </div>

          <div className="mt-20 grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <div className="relative aspect-square w-full overflow-hidden bg-white/30">
                <Image
                  src="/aveda_bild1.png"
                  alt=""
                  fill
                  className="object-cover grayscale"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="text-overline text-[#2D2D2D]/70">Aveda Philosophie</p>
              <p className="text-h2 mt-4 text-[#2D2D2D]">
                Aveda wurde mit der Vision gegründet, Schönheit und Nachhaltigkeit zu verbinden.
                Die Marke setzt auf pflanzliche Inhaltsstoffe, recycelbare Verpackungen und einen
                respektvollen Umgang mit der Natur.
              </p>
            </div>
          </div>

          <div className="mt-24 grid items-end gap-10 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <p className="text-copy max-w-xl leading-relaxed text-[#2D2D2D]/85">
                Diese Haltung passt zu unserer Arbeit: verantwortungsvoll, achtsam und mit echtem
                Anspruch an Qualität. Wir sind stolz darauf, Produkte anbieten zu können, die genau
                das widerspiegeln — und freuen uns, diese Werte gemeinsam mit unseren Kunden zu
                leben. Unsere Aveda-Produkte kannst du übrigens nicht nur bei uns erleben, sondern
                auch direkt im Salon erwerben.
              </p>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <div className="relative aspect-square w-full overflow-hidden bg-white/30">
                <Image
                  src="/aveda_bild2.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bildstreifen + 2er-Grid (wie Screenshot, vor Footer) */}
      <section className="bg-[#F1EEE9]" aria-label="Impressionen">
        <div className="relative h-92 w-full overflow-hidden sm:h-80 md:h-[460px] lg:h-[820px]">
          <Image
            src="/salon.png"
            alt=""
            fill
            className="object-cover grayscale"
            sizes="100vw"
          />
        </div>
        <div className="bg-[#F1EEE9] p-0">
          <div className="grid w-full grid-cols-2 gap-0">
            <div className="relative aspect-square w-full overflow-hidden bg-[#F1EEE9]">
              <Image
                src="/aveda_bild1.png"
                alt=""
                fill
                className="object-cover grayscale"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="relative aspect-square w-full overflow-hidden bg-[#F1EEE9]">
              <Image
                src="/footer_bild_1.png"
                alt=""
                fill
                className="object-cover grayscale"
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={100}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

