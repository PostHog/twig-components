import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const reference = readFileSync("docs/components.md", "utf8");

test("every public import has a component reference entry", () => {
  for (const path of Object.keys(packageJson.exports)) {
    assert.ok(reference.includes(`\`/${path.slice(2)}\``), `Document ${path}`);
  }
});

test("local documentation links resolve", () => {
  for (const file of ["README.md", "docs/components.md", "docs/integration.md"]) {
    const content = readFileSync(file, "utf8");
    for (const [, target] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(https?:|#)/.test(target)) continue;
      const path = target.split("#")[0];
      assert.ok(existsSync(join(dirname(file), path)), `${file}: ${target}`);
    }
  }
});
