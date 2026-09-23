import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowseStaysPreview } from "@posthog/twig-components/browse-stays-preview";
import { FilterLabExercise } from "@posthog/twig-components/filter-lab-exercise";
import { filterLabReducer, initialLabState } from "@posthog/twig-components/filter-lab";

const output = new URL("./output/", import.meta.url);
await mkdir(new URL("./assets/", output), { recursive: true });
await copyFile(new URL("../dist/catalog.css", import.meta.url), new URL("./catalog.css", output));
await copyFile(new URL("../dist/lab.css", import.meta.url), new URL("./lab.css", output));
for (const name of ["Halfre.ttf", "logo.svg", "cliff.png", "cabin.jpg", "RoundHog.woff2", "RoundHog-Medium.woff2", "RoundHog-SemiBold.woff2"]) {
  await copyFile(new URL(`../dist/assets/${name}`, import.meta.url), new URL(`./assets/${name}`, output));
}

const examples = ["Forest", "Coast", "Mountain"]
  .map((selected) => `<section><h2>${selected}</h2>${renderToStaticMarkup(createElement(BrowseStaysPreview, { selected }))}</section>`)
  .join("\n");

let inspectedState = filterLabReducer(initialLabState, { type: "example" });
inspectedState = filterLabReducer(inspectedState, { type: "filter", setting: "Forest" });
inspectedState = filterLabReducer(inspectedState, { type: "filter", setting: "Coast" });
const labExamples = [
  { title: "Filter Lab · code", state: initialLabState, stage: 1 },
  { title: "Filter Lab · events", state: inspectedState, stage: 2 },
].map(({ title, state, stage }) => `<section class="vac-app"><div class="vac-developer-theme lab-preview"><h2>${title}</h2>${renderToStaticMarkup(createElement(FilterLabExercise, { state, stage, dispatch: () => {}, setStage: () => {}, onFocusFilters: () => {}, onContinue: () => {}, filterHref: "#gallery-filter-controls" }))}</div></section>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Twig components gallery</title>
  <link rel="stylesheet" href="./catalog.css" />
  <link rel="stylesheet" href="./lab.css" />
  <style>
    body { margin: 0; background: #f5f3ee; color: #282726; font: 16px/1.5 Arial, sans-serif; }
    main { max-width: 1050px; margin: 0 auto; padding: 36px 20px 80px; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    p { margin: 0 0 36px; color: #5f5d59; }
    section { margin: 0 0 40px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    .lab-preview { padding: 24px; }
  </style>
</head>
<body><main><h1>Twig component gallery</h1><p>Actual package output · Twig views and Filter Lab states</p>${examples}${labExamples}</main></body>
</html>`;

await writeFile(new URL("./index.html", output), html);
console.log(new URL("./index.html", output).pathname);
