export const experienceAssets: Record<string,string> = {
  "/twig/posthog-logomark.svg": new URL("../assets/experience/posthog-logomark.svg", import.meta.url).href,
  "/twig/heart-hoggie.svg": new URL("../assets/experience/heart-hoggie.svg", import.meta.url).href,
  "/twig/stays/adiron-shack/patio.jpg": new URL("../assets/experience/stays/adiron-shack/patio.jpg", import.meta.url).href,
  "/twig/stays/adiron-shack/cabin.jpg": new URL("../assets/experience/stays/adiron-shack/cabin.jpg", import.meta.url).href,
  "/twig/stays/paris-studio/paris-facade-editorial.jpg": new URL("../assets/experience/stays/paris-studio/paris-facade-editorial.jpg", import.meta.url).href,
  "/twig/stays/paris-studio/studio-editorial.jpg": new URL("../assets/experience/stays/paris-studio/studio-editorial.jpg", import.meta.url).href,
  "/twig/stays/gold-coast-condo/pastel-buildings.jpg": new URL("../assets/experience/stays/gold-coast-condo/pastel-buildings.jpg", import.meta.url).href,
  "/twig/stays/gold-coast-condo/gold-coast-beach-pastel.jpg": new URL("../assets/experience/stays/gold-coast-condo/gold-coast-beach-pastel.jpg", import.meta.url).href,
  "/twig/fonts/RoundHog-Medium.woff2": new URL("../assets/experience/fonts/RoundHog-Medium.woff2", import.meta.url).href,
  "/twig/fonts/RoundHog.woff2": new URL("../assets/experience/fonts/RoundHog.woff2", import.meta.url).href,
  "/twig/fonts/RoundHog-SemiBold.woff2": new URL("../assets/experience/fonts/RoundHog-SemiBold.woff2", import.meta.url).href,
};

export function twigExperienceAsset(path: string) { return experienceAssets[path] ?? path; }
