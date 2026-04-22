import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Für Hero-/Gallery-Bilder nutzen wir punktuell quality=100.
    qualities: [75, 100],
  },
};

export default nextConfig;
