"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/salon", label: "Salon" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/aveda", label: "Aveda" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E4DF]/50 bg-[#F5F2ED]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight text-[#2D2D2D] transition hover:text-[#4A5D4A]"
        >
          Petite Maison
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition hover:text-[#4A5D4A] ${
                pathname === href ? "text-[#4A5D4A]" : "text-[#2D2D2D]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/kontakt?buchung=1"
          className="rounded-full bg-[#4A5D4A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A4A3A]"
        >
          Termin buchen
        </Link>
      </div>
    </header>
  );
}
