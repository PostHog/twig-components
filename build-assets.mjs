import { copyFile, mkdir } from "node:fs/promises";
await mkdir(new URL("./dist/assets/", import.meta.url), { recursive: true });
for (const [source, target] of [
  ["./src/catalog.css", "catalog.css"],
  ["./src/lab.css", "lab.css"],
  ["./assets/Halfre.ttf", "assets/Halfre.ttf"],
  ["./assets/logo.svg", "assets/logo.svg"],
  ["./assets/cliff.png", "assets/cliff.png"],
  ["./assets/cabin.jpg", "assets/cabin.jpg"],
  ["./assets/RoundHog.woff2", "assets/RoundHog.woff2"],
  ["./assets/RoundHog-Medium.woff2", "assets/RoundHog-Medium.woff2"],
  ["./assets/RoundHog-SemiBold.woff2", "assets/RoundHog-SemiBold.woff2"],
]) {
  await copyFile(
    new URL(source, import.meta.url),
    new URL(`./dist/${target}`, import.meta.url)
  );
}
