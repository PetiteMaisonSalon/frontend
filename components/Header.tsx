"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

const navItems = [
  { href: "/salon", label: "Salon" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/aveda", label: "Aveda" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isCmsArea = pathname?.startsWith("/admin");

  const defaultNavWithAdmin =
    user?.role === "admin" || user?.role === "staff"
      ? [...navItems, { href: "/admin", label: "CMS" }]
      : navItems;
  const navWithAdmin = isCmsArea ? [{ href: "/admin", label: "CMS" }] : defaultNavWithAdmin;

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E4DF]/50 bg-[#F5F2ED]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 md:flex-nowrap">
        {/* Logo – links */}
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D] transition hover:text-[#4A5D4A]"
        >
          <Image src="/petite-maison.png" alt="Petite Maison" width={200} height={100} />
        </Link>

        {/* Burger Button – nur Mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E8E4DF] bg-white/80 md:hidden"
          aria-label="Menü öffnen"
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-[#2D2D2D] transition-all ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[#2D2D2D] transition-all ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[#2D2D2D] transition-all ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>

        {/* Nav + Actions – rechts, Desktop/Tablet */}
        <div className="hidden items-center justify-end gap-6 md:flex">
          <nav className="flex items-center gap-8 lg:gap-10">
            {navWithAdmin.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap text-sm font-medium transition hover:text-[#4A5D4A] ${
                  pathname === href ? "text-[#4A5D4A]" : "text-[#2D2D2D]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-4">
              {!isCmsArea && (
                <Link
                  href="/konto/termine"
                  className="whitespace-nowrap text-sm font-medium text-[#2D2D2D] transition hover:text-[#4A5D4A]"
                >
                  Meine Termine
                </Link>
              )}
              <button
                onClick={logout}
                className="whitespace-nowrap rounded-full border border-[#D4A5A5] px-4 py-2 text-sm font-semibold text-[#5C4033] transition hover:bg-[#D4A5A5]/20"
              >
                Abmelden
              </button>
              {!isCmsArea && (
                <Link
                  href="/buchung"
                  className="whitespace-nowrap rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A4A3A]"
                >
                  Termin buchen
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full border-2 border-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-[#4A5D4A] transition hover:bg-[#4A5D4A]/10"
              >
                Anmelden
              </Link>
              {!isCmsArea && (
                <Link
                  href="/buchung"
                  className="whitespace-nowrap rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A4A3A]"
                >
                  Termin buchen
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu – Dropdown */}
      {menuOpen && (
        <div className="border-t border-[#E8E4DF] bg-white/95 px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navWithAdmin.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`text-base font-medium transition hover:text-[#4A5D4A] ${
                  pathname === href ? "text-[#4A5D4A]" : "text-[#2D2D2D]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E8E4DF] pt-6">
            {user ? (
              <>
                {!isCmsArea && (
                  <Link
                    href="/konto/termine"
                    onClick={() => setMenuOpen(false)}
                    className="w-full rounded-full border border-[#E8E4DF] px-5 py-3 text-center font-medium text-[#2D2D2D]"
                  >
                    Meine Termine
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-full border border-[#D4A5A5] px-5 py-3 text-left text-sm font-semibold text-[#5C4033] hover:bg-[#D4A5A5]/20"
                >
                  Abmelden
                </button>
                {!isCmsArea && (
                  <Link
                    href="/buchung"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-[#4A5D4A] px-5 py-3 text-center font-medium text-white hover:bg-[#3A4A3A]"
                  >
                    Termin buchen
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border-[3px] border-[#4A5D4A] px-5 py-3 text-center font-medium text-[#4A5D4A] hover:bg-[#4A5D4A]/10"
                >
                  Anmelden
                </Link>
                {!isCmsArea && (
                  <Link
                    href="/buchung"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-[#4A5D4A] px-5 py-3 text-center font-medium text-white hover:bg-[#3A4A3A]"
                  >
                    Termin buchen
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
