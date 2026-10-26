import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageName = packageJson.name;

// These are consumer import paths, so resolving package conflicts must retain them.
const consumerExports = {
  "compact": ["CompactTwig", "TwigWordmark", "CompactStayFilters"],
  "playground-panels": ["PlaygroundHome", "PlaygroundOnboarding", "PlaygroundInspectionView", "PlaygroundToolRail", "PlaygroundDock", "LabDirectory", "PlaygroundHelp", "PlaygroundInvitation", "PlaygroundExplorer", "PlaygroundLauncher"],
  "code-block": ["PlaygroundCodeBlock", "codeLanguage", "codeSegments"],
  "tooltip": ["PlaygroundTooltip", "TooltipBubble", "CopyControl", "useClipboardFeedback"],
  "wizard-command": ["WizardCommand"],
  "mcp-composer": ["McpComposer"],
  "status": ["PlaygroundStatus"],
  "ai-evidence": ["PlaygroundTraceExplorer", "PlaygroundGeneration", "PlaygroundEvaluation", "generationMessages", "generationModelLabel"],
  "replay-controls": ["ReplayControls", "RecordingControls", "replayTime"],
  "error-evidence": ["PlaygroundErrorIssue", "PlaygroundStackTrace"],
};

test("Playground and compact consumer imports retain their public components and helpers", async () => {
  for (const [path, names] of Object.entries(consumerExports)) {
    const module = await import(`${packageName}/${path}`);
    for (const name of names) assert.equal(typeof module[name], "function", `${path}: ${name}`);
  }
});

test("every concrete public import resolves to a built file and matching declarations", () => {
  for (const [path, entry] of Object.entries(packageJson.exports)) {
    if (path.includes("*")) continue;
    const target = typeof entry === "string" ? entry : entry.import;
    assert.ok(statSync(fileURLToPath(import.meta.resolve(`${packageName}/${path.slice(2)}`))).isFile(), path);
    assert.ok(statSync(target).isFile(), `${path}: ${target}`);
    if (typeof entry === "object") {
      assert.ok(statSync(entry.types).isFile(), `${path}: declarations`);
      assert.deepEqual(packageJson.typesVersions["*"][path.slice(2)], [entry.types.slice(2)], `${path}: typesVersions`);
    }
  }
});

test("distributed styles resolve every local font and image through the asset export", () => {
  for (const [path, target] of Object.entries(packageJson.exports)) {
    if (!path.endsWith(".css")) continue;
    const css = readFileSync(target, "utf8");
    for (const [, reference] of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      if (/^(data:|https?:|#)/.test(reference)) continue;
      const asset = resolve(dirname(target), reference);
      assert.ok(statSync(asset).isFile(), `${path}: ${reference}`);
      const publicAsset = import.meta.resolve(`${packageName}/${reference.replace(/^\.\//, "")}`);
      assert.equal(fileURLToPath(publicAsset), asset, `${path}: exported ${reference}`);
    }
  }
});

test("workbench image URLs resolve to existing source assets", () => {
  const appUrl = new URL("../workbench/App.tsx", import.meta.url);
  const app = readFileSync(appUrl, "utf8");
  for (const [, reference] of app.matchAll(/new URL\(["']([^"']+)["'],\s*import\.meta\.url\)/g)) {
    assert.ok(statSync(fileURLToPath(new URL(reference, appUrl))).isFile(), `workbench: ${reference}`);
  }
});

// A missing CSS export must fail even if the remaining styles all resolve.
test("compact and full-surface styles remain separately importable", () => {
  for (const path of ["compact.css", "catalog.css", "lab.css"]) {
    const target = import.meta.resolve(`${packageName}/${path}`);
    assert.ok(statSync(fileURLToPath(target)).isFile(), path);
  }
});
