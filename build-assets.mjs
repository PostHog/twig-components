import { copyFile, mkdir } from "node:fs/promises";
await mkdir(new URL("./dist/assets/", import.meta.url), { recursive: true });
for (const [source, target] of [
  ["./src/catalog.css", "catalog.css"],
  ["./src/lab.css", "lab.css"],
  ["./assets/Halfre.ttf", "assets/Halfre.ttf"],
  ["./assets/DMSans.ttf", "assets/DMSans.ttf"],
  ["./assets/dmsans-OFL.txt", "assets/dmsans-OFL.txt"],
  ["./src/compact.css", "compact.css"],
  ["./assets/logo.svg", "assets/logo.svg"],
  ["./assets/cliff.png", "assets/cliff.png"],
  ["./assets/cabin.jpg", "assets/cabin.jpg"],
  ["./assets/coast.jpg", "assets/coast.jpg"],
  ["./assets/city.jpg", "assets/city.jpg"],
  ["./assets/RoundHog.woff2", "assets/RoundHog.woff2"],
  ["./assets/RoundHog-Medium.woff2", "assets/RoundHog-Medium.woff2"],
  ["./assets/RoundHog-SemiBold.woff2", "assets/RoundHog-SemiBold.woff2"],
  ["./src/assets/posthog-logomark.svg", "assets/posthog-logomark.svg"],
  ["./src/assets/posthog-product-analytics.svg", "assets/posthog-product-analytics.svg"],
  ["./src/assets/posthog-ai-observability.svg", "assets/posthog-ai-observability.svg"],
  ["./src/assets/posthog-error-tracking.svg", "assets/posthog-error-tracking.svg"],
  ["./src/assets/posthog-session-replay.svg", "assets/posthog-session-replay.svg"],
  ["./assets/hoggie-chart.png", "assets/hoggie-chart.png"],
  ["./assets/hoggie-robot.png", "assets/hoggie-robot.png"],
]) {
  await copyFile(
    new URL(source, import.meta.url),
    new URL(`./dist/${target}`, import.meta.url)
  );
}
