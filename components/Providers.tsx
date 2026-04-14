"use client";

import { AuthProvider } from "./AuthContext";
import CookieBanner from "./CookieBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CookieBanner />
    </AuthProvider>
  );
}
