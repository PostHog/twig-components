import { copyFile, mkdir } from "node:fs/promises";
await mkdir(new URL("./dist/assets/", import.meta.url), { recursive: true });
for (const [source, target] of [
  ["./src/catalog.css", "catalog.css"],
  ["./src/lab.css", "lab.css"],
  ["./assets/playground-copy.svg", "assets/playground-copy.svg"],
  ["./assets/DMSans.ttf", "assets/DMSans.ttf"],
  ["./assets/Fraunces.ttf", "assets/Fraunces.ttf"],
  ["./assets/Fraunces-Italic.ttf", "assets/Fraunces-Italic.ttf"],
  ["./assets/BricolageGrotesque.ttf", "assets/BricolageGrotesque.ttf"],
  ["./assets/dmsans-OFL.txt", "assets/dmsans-OFL.txt"],
  ["./assets/fraunces-OFL.txt", "assets/fraunces-OFL.txt"],
  ["./assets/bricolagegrotesque-OFL.txt", "assets/bricolagegrotesque-OFL.txt"],
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
