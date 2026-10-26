import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompactTwig, CompactStayFilters } from '../dist/Compact.js';
import { StayCardContent } from '../dist/StayCard.js';
import { SavedStaysView } from '../dist/Account.js';
import { stays } from '../dist/catalog.js';

test('compact figure exposes selected filters and replay targets without a result count', () => {
  const html = renderToStaticMarkup(createElement(CompactTwig, null,
    createElement(CompactStayFilters, { value: 'Coast', onChange() {} }),
    createElement(StayCardContent, { stay: stays[0], compact: true, image: null })));
  assert.match(html, />twig<\/span>/);
  assert.match(html, /data-replay-label="Filter: Coast" aria-pressed="true"/);
  assert.doesNotMatch(html, /All locations|1 stay|bedrooms|guests/);
  assert.match(html, /Adiron-shack/);
  assert.match(html, /night USD/);
});

test('compact is opt-in and saved stays preserve their host navigation target', () => {
  const normal = renderToStaticMarkup(createElement(StayCardContent, { stay: stays[0], image: null }));
  assert.match(normal, /bedrooms/);
  const saved = renderToStaticMarkup(createElement(SavedStaysView, {
    compact: true, stays: [stays[0]], renderImage: () => null, stayHref: () => '#saved-stay'
  }));
  assert.match(saved, /class="twig-compact-stay" href="#saved-stay"/);
  assert.doesNotMatch(saved, /bedrooms/);
});
