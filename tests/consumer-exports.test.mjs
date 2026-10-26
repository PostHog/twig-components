import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('shared preview primitives are public without authoring dependencies', async () => {
  const disclosure = await import('@posthog/twig-components/disclosure');
  const inspector = await import('@posthog/twig-components/instrumentation-inspector');
  assert.equal(typeof disclosure.PlaygroundSummary, 'function');
  assert.equal(typeof inspector.InstrumentationInspector, 'function');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(!Object.keys(pkg.exports).some(key => key.includes('author')));
  assert.ok(!Object.keys(pkg.dependencies).some(key => key.startsWith('@tiptap/')));
});
