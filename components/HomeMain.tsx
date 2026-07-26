"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BookingLink from "@/components/BookingLink";

type SectionTheme = {
  id: "salon" | "team" | "gallerie" | "aveda";
  bg: string;
};

const HOME_SECTIONS: SectionTheme[] = [
  { id: "salon", bg: "#EBEAE7" },
  { id: "team", bg: "#EBEAE7" },
  { id: "gallerie", bg: "#EBEAE7" },
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
      "/gallerie/galerie_bild1_new.png",
      "/gallerie/galerie_bild2_new.png",
      "/gallerie/galerie_bild3_new.png",
      "/gallerie/galerie_bild4_new.png",
      "/gallerie/galerie_bild5_new.png",
      "/gallerie/galerie_bild6_new.png",
      "/gallerie/galerie_bild7_new.png",
      "/gallerie/galerie_bild8_new.png",
      "/gallerie/galerie_bild9_new.png",
    ],
    [],
  );

  // Beispiel für eine dynamische Berechnung der Seitenanzahl:
  const [itemsPerView, setItemsPerView] = useState(1);

  useEffect(() => {
    const updateView = () => {
      if (window.innerWidth >= 1024) setItemsPerView(3);
      else if (window.innerWidth >= 768) setItemsPerView(2);
      else setItemsPerView(1);
    };
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  const galerieSlides = Math.ceil(galerieImages.length / itemsPerView);

  const sectionById = useMemo(() => {
    const map = new Map<string, SectionTheme>();
    for (const s of HOME_SECTIONS) map.set(s.id, s);
    return map;
  }, []);

  const mainLeftImages = useMemo(
    () => [
      "/mehtap_arbeit.png",
      "/main_leftbild1_2.jpg",
      "/main_leftbild-3.png",
      "/main_leftbild1-4.png",
      "/main_leftbild-1-5.png",
    ],
    [],
  );
  const mainLeftSlides = useMemo(
    () => mainLeftImages.length,
    [mainLeftImages.length],
  );
  const blockImageDownloadInteraction = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        dispatch("pm:home:hero", { visible: entry.isIntersecting });
      },
      { threshold: 0.25 },
    );
    heroObserver.observe(heroEl);

    const sectionEls = Object.values(sectionRefs.current).filter(
      Boolean,
    ) as HTMLElement[];
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
          .map((el) => ({
            el,
            distance: Math.abs(el.getBoundingClientRect().top - markerY),
          }))
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
    window.addEventListener("scroll", scheduleActiveSectionSync, {
      passive: true,
    });
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

  const [servicesIndex, setServicesIndex] = useState(0);
  const servicesRef = useRef<HTMLDivElement>(null);
  const servicesSlides = 3;

  return (
    <main className="relative">
      {/* HERO (Viewport 1) */}
      <section
        ref={(el) => {
          heroRef.current = el;
        }}
        className="relative flex min-h-screen flex-col overflow-hidden"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/header_bg.mp4"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/header_bg.mp4" type="video/mp4" />
          Dein Browser unterstützt kein Video.
        </video>

        <div className="absolute inset-0 z-1 bg-black/30" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-28 text-center md:pb-32 md:pt-36">
          <h1 className="text-h1 max-w-3xl text-[#BEA8FF]">
            Deine Haare sind
            <br className="block md:hidden" />
            <br className="hidden md:block" />
            Vertrauenssache.
          </h1>
          <BookingLink className="text-copy mt-6 inline-block rounded-full border border-[#BEA8FF] bg-transparent px-10 py-4 font-medium text-[#BEA8FF] transition hover:bg-[#BEA8FF] hover:text-black">
            Jetzt buchen
          </BookingLink>
        </div>

        {/* Pfeil-Container (Animiert springend) */}
        <div
          aria-hidden="true"
          className="animate-custom-jump absolute bottom-1 left-1 z-10 p-1 md:bottom-16 md:left-17"
        >
          {/* MOBILE PFEIL (sichtbar auf Handy, versteckt auf Desktop) */}
          <span
            className="block h-10 w-10 bg-[#BEA8FF] md:hidden"
            style={{
              transform: "rotate(-90deg)", // <- Rotiert 90 Grad nach links/unten
              WebkitMaskImage: "url('/icons/icon_arrow.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url('/icons/Icon_Arrow.svg')",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat",
            }}
          />

          {/* DESKTOP PFEIL (versteckt auf Handy, sichtbar auf Desktop) */}
          <span
            className="hidden h-12 w-12 bg-[#BEA8FF] md:block"
            style={{
              transform: "rotate(-90deg)", // <- Rotiert 90 Grad nach links/unten
              WebkitMaskImage: "url('/icons/Icon_Arrow_Large.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url('/icons/icon_arrow_larg.svg')",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat",
            }}
          />
        </div>
      </section>

      {/* MAIN (Viewport 2+) — Screenshot 1: Text oben auf Mobile, Bild darunter */}
      <section
        id="salon"
        data-section-id="salon"
        ref={(el) => {
          sectionRefs.current.salon = el;
        }}
        className="pm-home-section bg-[#EBEAE7] px-4 py-5 md:pt-10 md:py-2"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          {/* Slider Bild: Auf Mobile an Position 2 (order-2), auf Desktop links (lg:order-1) */}
          <div className="order-2 w-full shrink-0 lg:order-1 lg:w-[min(48vw,540px)]">
            <div className="relative aspect-square w-full overflow-hidden bg-[#E8E4DF]">
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
                    <div
                      key={src}
                      className="relative h-full w-full flex-none snap-start"
                    >
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

            {/* Indicators + Buttons: Auf Mobile nur Pfeile links, auf Desktop mit Linie */}
            <div className="mt-3 flex items-center justify-start lg:justify-between">
              <div className="hidden items-center gap-2 lg:flex" aria-hidden>
                {mainLeftImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-px w-8 ${i === mainLeftIndex ? "bg-[#1C1612]/60" : "bg-[#1C1612]/20"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Zurück"
                  className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.max(0, mainLeftIndex - 1);
                    el.scrollTo({
                      left: next * el.clientWidth,
                      behavior: "smooth",
                    });
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
                  className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
                  onClick={() => {
                    const el = mainLeftRef.current;
                    if (!el) return;
                    const next = Math.min(
                      mainLeftSlides - 1,
                      mainLeftIndex + 1,
                    );
                    el.scrollTo({
                      left: next * el.clientWidth,
                      behavior: "smooth",
                    });
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

          {/* Intro Text: Auf Mobile ganz oben (order-1), auf Desktop rechts (lg:order-2) */}
          <div className="order-1 shrink-0 lg:order-2 lg:max-w-[min(42vw,32rem)]">
            <p className="text-intro text-[#1C1612]">
              Petite Maison ist ein Salon, in dem man sich Zeit füreinander
              nimmt. Für Gespräche, für Beratung und für eine Arbeit, mit Liebe
              zum Detail, die nicht zwischen Tür und Angel entsteht.
            </p>
          </div>
        </div>
      </section>

      {/* Salon-Story: Bild auf Mobile 50% klein & rechtsbündig VOR dem Text (Screenshot 1) */}
      <section
        id="salon-info"
        className="bg-[#EBEAE7] px-4 pb-24 md:pb-20 md:pt-0"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-14">
          <div className="order-2 shrink-0 lg:order-1 lg:max-w-116">
            <p className="text-copy leading-relaxed text-[#1C1612]">
              Uns ist wichtig, dass du dich bei uns gut aufgehoben fühlst. Wir
              nehmen uns Zeit, stellen Fragen und beraten individuell. Jeder
              Termin ist bewusst so geplant, dass deine Wünsche im Mittelpunkt
              stehen und wir unsere Arbeit mit Ruhe und Sorgfalt ausführen
              können.
            </p>
            <BookingLink className="text-copy mt-8 inline-block font-medium text-[#1C1612] underline underline-offset-2 transition hover:opacity-80">
              Jetzt Termin buchen
            </BookingLink>
          </div>

          {/* Auf Mobile: 50% Breite, rechtsbündig, oberhalb vom Text (order-1). Desktop absolut original! */}
          <div className="order-1 ml-auto aspect-square w-1/2 shrink-0 overflow-hidden bg-[#EBEAE7] lg:order-2 lg:ml-0 lg:w-[min(32vw,26rem)] relative">
            <Image
              src="/main_rightbild.png"
              alt=""
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 32vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Unsere Leistungen — Screenshot 2: Linksbündig auf Mobile */}
      <section
        className="pm-home-section bg-[#EBEAE7]"
        aria-labelledby="home-services-heading"
      >
        <div className="px-4 py-20 text-left md:py-10 lg:py-12 lg:text-center">
          <p className="text-copy-sm font-medium tracking-[0.04em] text-[#1C1612]">
            Unsere Leistungen
          </p>
          <h2
            id="home-services-heading"
            className="text-intro mx-auto mt-6 max-w-140 text-[#1C1612]"
          >
            Wir bieten Haarschnitte, Farb- und Pflegebehandlungen für Frauen und
            Männer an — immer individuell abgestimmt auf dein Haar, deinen Typ
            und deinen Alltag.
          </h2>
          <div className="mt-10 flex items-center justify-start gap-8 text-copy-sm lg:justify-center">
            <BookingLink className="font-medium text-[#1C1612] underline underline-offset-2 transition hover:opacity-80">
              Jetzt buchen
            </BookingLink>
            <Link
              href="/leistungen"
              className="font-medium text-[#1C1612] underline underline-offset-2 transition hover:opacity-80"
            >
              Zur Leistungsübersicht
            </Link>
          </div>
        </div>
      </section>

      {/* LEISTUNGEN KACHELN — Screenshot 2: Auf Mobile eine Galerie mit Pfeilen, Desktop originales 3er Grid! */}
      <section
        className="pm-home-section bg-[#EBEAE7] px-4 py-10 md:py-28"
        aria-labelledby="home-services-cards-heading"
      >
        <h2 id="home-services-cards-heading" className="sr-only">
          Leistungen im Überblick
        </h2>

        {/* 1. DESKTOP VERSION (hidden lg:grid) — 100% UNBERÜHRT */}
        <div className="mx-auto hidden max-w-280 grid-cols-1 gap-6 lg:grid lg:grid-cols-3">
          {[
            {
              icon: "/schere_new.png",
              title: "Haarschnitt & Styling",
              description:
                "Präzise Schnitte für jeden Typ – vom klassischen Look bis zum modernen Statement.",
            },
            {
              icon: "/farbe_new.png",
              title: "Farbe & Highlights",
              description:
                "Natürlich oder ausdrucksstark: Wir finden den Farbton, der wirklich zu dir passt.",
            },
            {
              icon: "/hand_new.png",
              title: "Pflege & individuelle Beratung",
              description:
                "Wir schauen genau hin, was dein Haar braucht und beraten dich ehrlich und ohne Umwege.",
            },
          ].map((card) => (
            <Link
              href="/leistungen"
              key={card.title}
              className="flex h-full flex-col items-center justify-start rounded-[28px] bg-white px-8 pt-12 pb-6 text-center transition-colors duration-300 ease-out hover:bg-[#BEA8FF] md:px-8 md:pt-12 md:pb-8"
            >
              <div className="relative h-28 w-28 shrink-0">
                <Image
                  src={card.icon}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
              <h3 className="text-h3 mt-16 text-[#1C1612]">{card.title}</h3>
              <p className="text-copy-sm mt-3 leading-relaxed text-[#1C1612]">
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        {/* 2. MOBILE VERSION (lg:hidden) — Galerie wie im Screenshot 2 */}
        {/* 2. MOBILE VERSION (lg:hidden) — Alle Kacheln exakt gleich hoch (h-full & items-stretch) */}
        <div className="w-full lg:hidden">
          <div
            id="mobile-services-gallery"
            ref={servicesRef}
            onScroll={() => {
              const el = servicesRef.current;
              if (!el) return;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== servicesIndex) setServicesIndex(idx);
            }}
            /* HIER NEU: items-stretch hinzugefügt */
            className="no-scrollbar flex w-full items-stretch overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4"
          >
            {[
              {
                icon: "/schere_new.png",
                title: "Haarschnitt & Styling",
                description:
                  "Präzise Schnitte für jeden Typ – vom klassischen Look bis zum modernen Statement.",
              },
              {
                icon: "/farbe_new.png",
                title: "Farbe & Highlights",
                description:
                  "Natürlich oder ausdrucksstark: Wir finden den Farbton, der wirklich zu dir passt.",
              },
              {
                icon: "/hand_new.png",
                title: "Pflege & individuelle Beratung",
                description:
                  "Wir schauen genau hin, was dein Haar braucht und beraten dich ehrlich und ohne Umwege.",
              },
            ].map((card) => (
              /* HIER NEU: flex h-auto hinzugefügt */
              <div
                key={card.title}
                className="flex h-auto w-full flex-none snap-start"
              >
                <Link
                  href="/leistungen"
                  /* HIER NEU: h-full w-full hinzugefügt */
                  className="flex h-full w-full flex-col items-center justify-start rounded-[28px] bg-white px-8 pt-12 pb-10 text-center transition-colors duration-300 ease-out active:bg-[#BEA8FF]"
                >
                  <div className="relative h-28 w-28 shrink-0">
                    <Image
                      src={card.icon}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="112px"
                    />
                  </div>
                  <h3 className="text-h3 mt-16 text-[#1C1612]">{card.title}</h3>
                  <p className="text-copy-sm mt-3 leading-relaxed text-[#1C1612]">
                    {card.description}
                  </p>
                </Link>
              </div>
            ))}
          </div>

          {/* Pfeile unter der mobilen Leistungs-Galerie mit exakter Disabled-Logik */}
          <div className="mt-6 flex items-center justify-start gap-3">
            <button
              type="button"
              aria-label="Zurück"
              className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el =
                  servicesRef.current ||
                  document.getElementById("mobile-services-gallery");
                if (!el) return;
                const next = Math.max(0, servicesIndex - 1);
                el.scrollTo({
                  left: next * el.clientWidth,
                  behavior: "smooth",
                });
                setServicesIndex(next);
              }}
              disabled={servicesIndex === 0}
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
              className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el =
                  servicesRef.current ||
                  document.getElementById("mobile-services-gallery");
                if (!el) return;
                const next = Math.min(servicesSlides - 1, servicesIndex + 1);
                el.scrollTo({
                  left: next * el.clientWidth,
                  behavior: "smooth",
                });
                setServicesIndex(next);
              }}
              disabled={servicesIndex >= servicesSlides - 1}
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
      </section>

      {/* Unser Team Intro — Screenshot 2 (unten): Linksbündig auf Mobile */}
      <section className="pm-home-section bg-[#EBEAE7] px-4 py-20 md:py-30">
        <div className="mx-auto max-w-md text-left lg:max-w-130 lg:text-center">
          <p className="text-copy font-medium tracking-[0.04em] text-[#1C1612]">
            Unser Team
          </p>
          <p className="text-intro mt-6 text-[#1C1612]">
            Was uns verbindet, ist die Freude am Handwerk, ein ruhiger
            Arbeitsstil und der Wunsch, eine Atmosphäre zu schaffen, in der man
            sich wohl und ernst genommen fühlt.
          </p>
        </div>
      </section>

      {/* TEAM / Mitarbeiter — Screenshot 3 & 4: Auf Mobile mit zusätzlichem "Jetzt buchen" Link */}
      <section
        id="team"
        data-section-id="team"
        ref={(el) => {
          sectionRefs.current.team = el;
        }}
        className="pm-home-section bg-[#EBEAE7] px-4 pb-28 pt-6 md:pb-10"
        aria-labelledby="home-team-heading"
      >
        <h2 id="home-team-heading" className="sr-only">
          Team
        </h2>

        <div className="flex flex-col gap-24 md:gap-32 lg:gap-10">
          {/* Mehtap — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-16/15 w-full shrink-0 overflow-hidden bg-transparent lg:w-[min(48vw,560px)]">
              <Image
                src="/mehtap_new.png"
                alt="Mehtap"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 48vw, 100vw"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Mehtap</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612] lg:w-147.5">
                Ich bin Mehtap, Friseurmeisterin und Inhaberin von Petite
                Maison. Seit vielen Jahren arbeite ich in diesem Beruf und habe
                früh gemerkt, dass mir der persönliche Umgang mit Menschen
                genauso wichtig ist wie das Handwerk selbst.
              </p>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612] lg:w-147.5">
                Für mich bedeutet Friseurhandwerk, Verantwortung zu übernehmen —
                für Entscheidungen, für Wünsche und für das Vertrauen, das mir
                entgegengebracht wird. Diese Haltung prägt meine tägliche Arbeit
                und den Salon als Ganzes.
              </p>
            </div>
          </article>

          {/* Maria */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/maria.png"
                alt="Maria"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Maria</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Maria ist unsere Schnittspezialistin! Sie ist seit 35 Jahren
                Friseurin mit Leidenschaft und hat 31 Jahre für den Starfriseur
                Jaques Le Coz gearbeitet. Maria isst gerne Tapas und tanzt
                leidenschaftlich Rumba. Seit Anfang 2022 gehört sie zum Team
                dazu.
              </p>
            </div>
          </article>

          {/* Sevim — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/sevim.png"
                alt="Sevim"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Sevim</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Sevim ist unsere Farbspezialistin! Sie liebt es, mit Haaren zu
                experimentieren, einschließlich ihren Haaren. Zwölf Jahre lang
                hat sie beim Starfriseur Jaques Le Coz gearbeitet und ist seit
                Anfang 2022 bei Petite Maison.
              </p>
            </div>
          </article>

          {/* Masoud — rechts */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/masoud.png"
                alt="Masoud"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Masoud</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Masoud ist spezialisiert auf präzise Schnitte und Farbtechniken.
                Geboren im Iran, ausgebildet auf zwei Kontinenten, ist er seit
                über 20 Jahren Friseur und seit Ende 2025 bei Petite Maison. Als
                zertifizierter Aveda-Spezialist schwört er auf natürliche,
                nachhaltige Produkte.
              </p>
            </div>
          </article>

          {/* Sarah — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/sarah.png"
                alt="Sarah"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Sarah</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Sarah ist spezialisiert auf Haarschnitte, Styling und natürliche
                Färbungen. Seit über 15 Jahren arbeitet sie mit Aveda-Produkten,
                2022 hat sie ihren Meister gemacht — unter anderem lebte und
                arbeitete sie in Wien. Seit November 2024 ist sie bei Petite
                Maison. Ihr Hund Cooper gehört im Salon quasi zum Team.
              </p>
            </div>
          </article>

          {/* Kanj — rechts */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-end">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/kanj.png"
                alt="Kanj"
                fill
                className="object-cover grayscale"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Kanj</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Kanj ist spezialisiert auf Strähnen, Balayage und Schnitte. Er
                hat 2016 im Libanon seine Ausbildung gemacht und ist seit August
                2025 fester Bestandteil des Teams. Nebenbei spielt er
                libanesische Flöte, tritt mit seiner eigenen Band bei Festivals
                und Hochzeiten auf und war bereits im libanesischen Fernsehen zu
                sehen.
              </p>
            </div>
          </article>

          {/* Cooper — links */}
          <article className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-start">
            <div className="relative aspect-square w-3/5 self-end shrink-0 overflow-hidden bg-transparent lg:w-70 lg:self-auto">
              <Image
                src="/cooper.png"
                alt="Cooper"
                fill
                className="object-cover"
                sizes="280px"
                draggable={false}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              />
            </div>
            <div className="lg:max-w-85 lg:pt-2">
              <h3 className="text-h2 text-[#1C1612]">Cooper</h3>
              <p className="text-copy-sm mt-4 font-medium leading-relaxed text-[#1C1612]">
                Cooper ist spezialisiert auf gute Laune und ist als Sarahs
                treuer Begleiter fester Bestandteil des Salons.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* GALLERIE */}
      <section
        id="gallerie"
        data-section-id="gallerie"
        ref={(el) => {
          sectionRefs.current.gallerie = el;
        }}
        className="pm-home-section bg-[#EBEAE7] pb-0 pt-6"
        aria-label="Galerie"
      >
        <div className="w-full">
          <div className="flex items-center justify-end gap-3 px-4 pb-4 md:pb-6">
            <button
              type="button"
              aria-label="Zurück"
              className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.max(0, galerieIndex - 1);
                el.scrollTo({
                  left: next * el.clientWidth,
                  behavior: "smooth",
                });
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
              className="grid h-10 w-16 place-items-center text-[#1C1612] transition hover:opacity-70 disabled:opacity-30"
              onClick={() => {
                const el = galerieRef.current;
                if (!el) return;
                const next = Math.min(galerieSlides - 1, galerieIndex + 1);
                el.scrollTo({
                  left: next * el.clientWidth,
                  behavior: "smooth",
                });
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
            className="no-scrollbar flex w-full overflow-x-auto scroll-smooth snap-x snap-mandatory"
            onScroll={() => {
              const el = galerieRef.current;
              if (!el) return;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== galerieIndex) setGalerieIndex(idx);
            }}
          >
            {galerieImages.map((src, index) => (
              <div
                key={src}
                className="relative aspect-3/4 w-full flex-none snap-start md:w-1/2 lg:w-1/3"
                aria-label={`Galerie Bild ${index + 1}`}
                onContextMenu={blockImageDownloadInteraction}
                onDragStart={blockImageDownloadInteraction}
              >
                <Image
                  src={src}
                  alt={`Galerie Bild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  draggable={false}
                  onContextMenu={blockImageDownloadInteraction}
                  onDragStart={blockImageDownloadInteraction}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVEDA SECTION */}
      <section
        id="aveda"
        data-section-id="aveda"
        ref={(el) => {
          sectionRefs.current.aveda = el;
        }}
        className="pm-home-section bg-[#BEA8FF] px-4 pb-20 pt-20 md:pb-4 md:pt-28 lg:pb-4 lg:pt-23"
        aria-labelledby="home-aveda-heading"
      >
        <div className="mx-auto w-full max-w-lg text-left lg:text-center min-[1400px]:max-w-152">
          <p className="text-copy-sm font-bold text-[#1C1612]">Aveda</p>
          <h2
            id="home-aveda-heading"
            className="text-intro mt-0 text-[#1C1612]"
          >
            Als Aveda-Salon arbeiten wir mit
            <br className="hidden lg:inline" />
            Produkten, die nicht nur deinem Haar{" "}
            <br className="hidden lg:inline" />
            guttun, sondern auch der Umwelt.
          </h2>
        </div>

        {/* Mobile / Tablet (lg:hidden - exakt wie Screenshot 5 angeordnet) */}
        <div className="mt-12 flex flex-col gap-6 lg:hidden">
          {/* Bild 1: Volle Breite oben */}
          <div className="relative aspect-square w-full overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild1.png"
              alt=""
              fill
              className="object-cover grayscale"
              sizes="100vw"
            />
          </div>

          {/* Bild 2: 50% Breite & rechtsbündig direkt unter Bild 1 */}
          <div className="relative ml-auto aspect-square w-1/2 overflow-hidden bg-white/30">
            <Image
              src="/aveda_bild2.png"
              alt=""
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>

          {/* Beide Texte zusammen darunter */}
          <div className="flex flex-col gap-6 pt-4">
            <p className="text-aveda leading-relaxed text-[#1C1612]">
              Aveda wurde mit der Vision gegründet, Schönheit und Nachhaltigkeit
              zu verbinden. Die Marke setzt auf pflanzliche Inhaltsstoffe,
              <br />
              recycelbare Verpackungen und einen respektvollen Umgang mit der
              Natur.
            </p>

            <p className="text-copy leading-relaxed text-[#1C1612]">
              Diese Haltung passt zu unserer Arbeit: verantwortungsvoll, achtsam
              und mit echtem Anspruch an Qualität. Wir sind stolz darauf, dir
              Produkte anbieten zu können, die genau das widerspiegeln – und
              freuen uns, diese Werte gemeinsam mit unseren Kunden zu leben.
              Unsere Aveda-Produkte kannst du übrigens nicht nur bei uns
              erleben, sondern auch direkt im Salon erwerben.
            </p>
          </div>
        </div>

        {/* Desktop — 2×2 Grid — 100% UNBERÜHRT */}
        <div className="mt-44 hidden lg:flex lg:flex-col lg:gap-y-40 xl:gap-y-5">
          <div className="flex items-start gap-4 lg:gap-6">
            <figure className="relative aspect-square w-148 shrink-0 overflow-hidden bg-white/30">
              <Image
                src="/aveda_bild1.png"
                alt=""
                fill
                className="object-cover grayscale"
                sizes="20rem"
              />
            </figure>

            <div className="max-w-lg self-start">
              <p className="text-copy leading-relaxed text-[#1C1612]">
                Aveda wurde mit der Vision gegründet, Schönheit und
                Nachhaltigkeit zu verbinden. Die Marke setzt auf pflanzliche
                Inhaltsstoffe, recycelbare Verpackungen und einen respektvollen
                Umgang mit der Natur.
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="max-w-lg">
              <p className="text-copy leading-relaxed text-[#1C1612]">
                Diese Haltung passt zu unserer Arbeit: verantwortungsvoll,
                achtsam und mit <br />
                echtem Anspruch an Qualität. Wir sind stolz darauf, dir Produkte
                anbieten zu <br />
                können, die genau das widerspiegeln – und freuen uns, diese
                Werte <br />
                gemeinsam mit unseren Kunden zu leben. Unsere Aveda-Produkte
                kannst du <br />
                übrigens nicht nur bei uns erleben, sondern auch direkt im Salon
                erwerben.
              </p>
            </div>

            <figure className="relative aspect-square w-[18rem] shrink-0 overflow-hidden bg-white/30">
              <Image
                src="/aveda_bild2.png"
                alt=""
                fill
                className="object-cover"
                sizes="18rem"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* Bildstreifen + 2er-Grid (Screenshot 6 vor Footer) */}
      <section className="bg-[#EBEAE7]" aria-label="Impressionen">
        <div className="relative h-92 w-full overflow-hidden sm:h-80 md:h-115 lg:h-205">
          <Image
            src="/salon.png"
            alt=""
            fill
            className="object-cover grayscale"
            sizes="100vw"
          />
        </div>
      </section>
    </main>
  );
}
