/**
 * Öffnet die Google-Bewertungsmaske (Kurzlink aus dem Unternehmensprofil:
 * Bewertungen teilen → Link endet oft mit `/review`).
 */
const fallback =
  "https://g.page/r/CXXf5DCXrN0sEAI/review";

export const googleReviewWriteUrl =
  (typeof process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL === "string" &&
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL.trim()) ||
  fallback;
