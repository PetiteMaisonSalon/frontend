"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import BookingLink from "./BookingLink";
import { SHOW_CUSTOMER_AUTH } from "@/lib/siteConfig";

/** Hauptnavigation wie Screenshot: nur Leistungen + Kontakt (Salon/Team/Aveda im Submenü auf der Startseite) */
const mainNavItems = [
  { href: "/leistungen", label: "Leistungen" },
  { href: "/kontakt", label: "Kontakt" },
];

const homeSubNavItems = [
  { id: "salon" as const, href: "#salon", label: "Salon" },
  { id: "team" as const, href: "#team", label: "Team" },
  { id: "gallerie" as const, href: "#gallerie", label: "Gallerie" },
  { id: "aveda" as const, href: "#aveda", label: "Aveda" },
];
const homeSubNavBgById: Record<(typeof homeSubNavItems)[number]["id"], string> =
  {
    salon: "#EBEAE7",
    team: "#EBEAE7",
    gallerie: "#EBEAE7",
    aveda: "#BEA8FF",
  };
const OPEN_ADMIN_CREATE_EVENT = "admin:create-appointment";
const ADMIN_PENDING_CREATE_KEY = "pm_admin_pending_create";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isCmsArea = pathname?.startsWith("/admin");
  const isAdminUser = user?.role === "admin";
  /** Admin-eingeloggt: überall reduzierter Header wie im CMS (kein „Petite Maison“, nur Admin-Aktionen). */
  const useAdminLayout = isCmsArea || isAdminUser;
  const isHome = pathname === "/" && !isCmsArea;
  const containerWidthClass = isCmsArea ? "max-w-[1450px]" : "max-w-7xl";
  const containerPaddingClass = isCmsArea ? "px-3 md:px-3" : "px-3";
  const openAdminCreateModal = () => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/admin")) {
      window.dispatchEvent(new CustomEvent(OPEN_ADMIN_CREATE_EVENT));
    } else {
      try {
        sessionStorage.setItem(ADMIN_PENDING_CREATE_KEY, "1");
      } catch {
        /* ignore */
      }
      router.push("/admin");
    }
  };

  /** Mobile: jedes Nav-Ziel schließt das Burger-Menü sofort, auch bei gleicher Route oder Hash-Link. */
  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  /** Startseite: gleiche Route → nach oben scrollen; Hash entfernen; Header zurück in Hero-Zustand. */
  const handleBrandClick = (e: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu();
    if (!isHome) return;

    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
    setHomeHeroVisible(true);
    setHomeSubActiveId("salon");
    setHomeSectionBg(homeSubNavBgById.salon);
  };

  const navItemsToShow = useAdminLayout ? [] : mainNavItems;

  const [homeHeroVisible, setHomeHeroVisible] = useState(true);
  const [homeSectionBg, setHomeSectionBg] = useState<string>("#EBEAE7");
  const [homeSubActiveId, setHomeSubActiveId] = useState<string>("salon");
  const showHomeSubmenu = isHome && !homeHeroVisible && !isAdminUser;

  /** Mobile: Menü nach Routenwechsel schließen (vermeidet setState + Navigation im selben Tap-Handler / pushState-Race). */
  useEffect(() => {
    startTransition(() => {
      setMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    if (!isHome) return;

    const onHero = (e: Event) => {
      const ce = e as CustomEvent<{ visible?: boolean }>;
      setHomeHeroVisible(Boolean(ce.detail?.visible));
    };
    const onSection = (e: Event) => {
      const ce = e as CustomEvent<{ bg?: string; id?: string }>;
      if (ce.detail?.bg) setHomeSectionBg(ce.detail.bg);
      if (ce.detail?.id) setHomeSubActiveId(ce.detail.id);
    };

    window.addEventListener("pm:home:hero", onHero as EventListener);
    window.addEventListener("pm:home:section", onSection as EventListener);
    return () => {
      window.removeEventListener("pm:home:hero", onHero as EventListener);
      window.removeEventListener("pm:home:section", onSection as EventListener);
    };
  }, [isHome]);

  useEffect(() => {
    if (!isHome || typeof window === "undefined") return;
    const syncHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "salon" || h === "team" || h === "gallerie" || h === "aveda") {
        setHomeSubActiveId(h);
        setHomeSectionBg(homeSubNavBgById[h]);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [isHome]);

  const handleHomeSubNavClick = (
    id: (typeof homeSubNavItems)[number]["id"],
  ) => {
    setHomeSubActiveId(id);
    setHomeSectionBg(homeSubNavBgById[id]);
    closeMobileMenu();
  };

  const headerStyle = useMemo(() => {
    if (!isHome) return undefined;
    if (homeHeroVisible) return { backgroundColor: "transparent" };
    return { backgroundColor: homeSectionBg };
  }, [homeHeroVisible, homeSectionBg, isHome]);

  const headerShell = "fixed inset-x-0 top-0 z-50 w-full";

  const headerChromeClass = isHome
    ? homeHeroVisible
      ? "border-0"
      : "border-b border-black/10"
    : "border-b border-[#E8E4DF]/50 bg-[#EBEAE7]/100 backdrop-blur-sm";

  const isHomeHero = isHome && homeHeroVisible;

  /** Hell (Startseite unterhalb Hero + alle anderen Seiten): Sans, dunkel; nur „Petite Maison“ unterstrichen */
  const lightNavText =
    "text-copy font-medium text-[#1C1612] antialiased transition hover:opacity-90";
  const lightBrandUnderline = "border-b border-[#1C1612] pb-px";
  const lightActiveUnderline = "border-b border-[#1C1612] pb-px";

  /** Hero über Bild: #BEA8FF; Petite Maison unterstrichen */
  const heroNavText =
    "text-copy font-medium text-[#BEA8FF] antialiased transition hover:text-[#BEA8FF]/90";
  const heroBrandUnderline = "border-b border-[#BEA8FF] pb-px";
  const heroActiveUnderline = "border-b border-[#BEA8FF] pb-px";

  const outlineBtnHero =
    "rounded-[14px] border-[1.5px] border-[#BEA8FF]] bg-transparent px-5 py-1.5 text-sm font-normal text-[#BEA8FF] transition hover:border-[#BEA8FF]/100 hover:text-black hover:bg-[#BEA8FF]/100";

  const outlineBtnLight =
    "rounded-[14px] border-[1.5px] border-[#1C1612] bg-transparent px-5 py-1.5 text-sm font-semibold text-[#1C1612] transition hover:bg-[#1C1612] hover:text-white";

  const brandClass = isHomeHero
    ? `${heroNavText} ${isHome ? heroBrandUnderline : ""}`
    : `${lightNavText} ${isHome ? lightBrandUnderline : ""}`;
  const mainNavLinkClass = isHomeHero ? heroNavText : lightNavText;

  /** Mobile: Scroll */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const mobileNavItems = [
    { href: "/#salon", label: "Über uns" },
    { href: "/leistungen", label: "Leistungen" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  const isNavActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/leistungen") return pathname.startsWith("/leistungen");
    return pathname === href;
  };

  const isMobileNavActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/#salon") return pathname === "/";
    if (href === "/leistungen") return pathname.startsWith("/leistungen");
    return pathname === href;
  };

  const burgerButton = (
    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:hidden"
      aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
      aria-expanded={menuOpen}
    >
      <span
        className={`block h-8 w-9  transition-colors ${
          isHomeHero ? "bg-[#BEA8FF]" : "bg-[#1C1612]"
        }`}
        style={{
          WebkitMask: menuOpen
            ? "url('/icons/Icon_Close.svg') center/contain no-repeat"
            : "url('/icons/Icon_Burger.svg') center/contain no-repeat",
          mask: menuOpen
            ? "url('/icons/Icon_Close.svg') center/contain no-repeat"
            : "url('/icons/Icon_Burger.svg') center/contain no-repeat",
        }}
      />
    </button>
  );
  const desktopAuthActions = (
    <>
      {SHOW_CUSTOMER_AUTH ? (
        user ? (
          <div className="flex items-center gap-4">
            {!useAdminLayout ? (
              <Link
                href="/konto"
                className={
                  isHomeHero
                    ? `whitespace-nowrap ${outlineBtnHero}`
                    : `whitespace-nowrap ${outlineBtnLight}`
                }
              >
                Dein Profil
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAdminCreateModal}
                  className="whitespace-nowrap rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A4A3A]"
                >
                  Neuen Termin eintragen
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="whitespace-nowrap rounded-full border border-[#D4A5A5] px-4 py-2 text-sm font-semibold text-[#5C4033] transition hover:bg-[#D4A5A5]/20"
                >
                  Abmelden
                </button>
              </>
            )}
            {!useAdminLayout && (
              <BookingLink
                className={
                  isHomeHero
                    ? `whitespace-nowrap ${outlineBtnHero}`
                    : `whitespace-nowrap ${outlineBtnLight}`
                }
              >
                Jetzt buchen
              </BookingLink>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className={
                isHomeHero
                  ? "whitespace-nowrap text-copy font-medium text-[#BEA8FF] transition hover:text-[#BEA8FF]/80"
                  : !isCmsArea
                    ? "whitespace-nowrap text-copy font-medium text-[#1C1612] transition hover:opacity-80"
                    : "whitespace-nowrap rounded-full border-2 border-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A]/10"
              }
            >
              Login
            </Link>
            {!isCmsArea && (
              <BookingLink
                className={
                  isHomeHero
                    ? `whitespace-nowrap ${outlineBtnHero}`
                    : `whitespace-nowrap ${outlineBtnLight}`
                }
              >
                Jetzt buchen
              </BookingLink>
            )}
          </div>
        )
      ) : useAdminLayout && user ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openAdminCreateModal}
            className="whitespace-nowrap rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A4A3A]"
          >
            Neuen Termin eintragen
          </button>
          <button
            type="button"
            onClick={logout}
            className="whitespace-nowrap rounded-full border border-[#D4A5A5] px-4 py-2 text-sm font-semibold text-[#5C4033] transition hover:bg-[#D4A5A5]/20"
          >
            Abmelden
          </button>
        </div>
      ) : !isCmsArea ? (
        <BookingLink
          className={
            isHomeHero
              ? `whitespace-nowrap ${outlineBtnHero}`
              : `whitespace-nowrap ${outlineBtnLight}`
          }
        >
          Jetzt buchen
        </BookingLink>
      ) : null}
    </>
  );

  return (
    <header
      className={`${headerShell} ${headerChromeClass}`}
      style={headerStyle}
    >
      <div
        className={`mx-auto flex w-full items-center justify-between gap-4 ${containerPaddingClass} py-2`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
          {!isAdminUser && (
            <Link
              href="/"
              onClick={handleBrandClick}
              className={`shrink-0 whitespace-nowrap ${brandClass}`}
            >
              Petite Maison
            </Link>
          )}
          {navItemsToShow.length > 0 && (
            <nav className="hidden items-center gap-8 md:flex lg:gap-10">
              {navItemsToShow.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap ${mainNavLinkClass} ${
                    isNavActive(href)
                      ? isHomeHero
                        ? `font-semibold text-[#BEA8FF] ${heroActiveUnderline}`
                        : `font-semibold text-[#1C1612] ${lightActiveUnderline}`
                      : isHomeHero
                        ? "text-[#1C1612]"
                        : "text-[#1C1612]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden md:flex md:items-center">
            {desktopAuthActions}
          </div>
          {burgerButton}
        </div>
      </div>

      {/* Submenü unterhalb der Navbar – nur Startseite, erst nach Hero (zentriert wie Screenshot) */}
      {showHomeSubmenu && (
        <div className="border-t border-black/10">
          <div
            className={`mx-auto flex  ${containerWidthClass} items-center justify-center gap-10 md:gap-14 ${containerPaddingClass} py-3 text-copy`}
          >
            {homeSubNavItems.map(({ id, href, label }) => (
              <a
                key={id}
                href={href}
                onClick={() => handleHomeSubNavClick(id)}
                className={`font-medium transition hover:opacity-80 ${
                  homeSubActiveId === id
                    ? "font-semibold text-[#1C1612]"
                    : "font-semibold text-[#1C1612]"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Mobile — Vollbild-Menü wie Screenshot */}
      {menuOpen && !useAdminLayout && (
        <div className="fixed inset-0 z-100 flex min-h-dvh flex-col bg-[#BEA8FF] md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              href="/"
              onClick={handleBrandClick}
              className="petite-maison-text border-[#1C1612] pb-px font-medium text-[#1C1612]"
            >
              Petite Maison
            </Link>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="flex h-10 w-10 items-center justify-center text-[#1C1612]"
              aria-label="Menü schließen"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 6l16 16M22 6L6 22"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-end justify-end px-4 pb-10 pt-8">
            <nav className="flex flex-col items-end gap-7">
              {mobileNavItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={`font-display text-[64px] leading-[1.1] text-[#1C1612] transition hover:opacity-80 ${
                    isMobileNavActive(href) ? "opacity-100" : "opacity-90"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-4">
              <BookingLink
                onClick={closeMobileMenu}
                className="text-copy text-[#1C1612] underline underline-offset-2 transition hover:opacity-80"
              >
                Jetzt buchen
              </BookingLink>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu — Admin */}
      {menuOpen && useAdminLayout && (
        <div className="border-t border-black/10 bg-[#EBEAE7] px-6 py-6 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                openAdminCreateModal();
                setMenuOpen(false);
              }}
              className="w-full rounded-full bg-[#4A5D4A] px-5 py-3 text-center font-medium text-white hover:bg-[#3A4A3A]"
            >
              Neuen Termin eintragen
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="w-full rounded-full border border-[#D4A5A5] px-5 py-3 text-left text-sm font-semibold text-[#5C4033] hover:bg-[#D4A5A5]/20"
            >
              Abmelden
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
