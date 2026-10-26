import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h, act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { CompactTwig } from "@posthog/twig-components/compact";
import { StayCardContent } from "@posthog/twig-components/stay-card";
import { SavedStaysView } from "@posthog/twig-components/account";
import { stays } from "@posthog/twig-components/catalog";

test("compact cards preserve their concise facts while default cards retain brand host details", () => {
  const compact = renderToStaticMarkup(h(CompactTwig, null,
    h(StayCardContent, { stay: stays[0], compact: true, linked: true, image: null })));
  assert.match(compact, /twig-compact-stay-info/);
  assert.match(compact, /Adiron-shack/);
  assert.match(compact, /\$355/);
  assert.doesNotMatch(compact, /Hosted by|Pileated woodpecker|guests|bedrooms|vac-card-body/);
  const normal = renderToStaticMarkup(h(StayCardContent, { stay: stays[0], linked: true, image: null }));
  assert.match(normal, /vac-card-price/);
  assert.match(normal, /Hosted by Woody/);
  assert.match(normal, /Pileated woodpecker/);
  assert.match(normal, /4 guests/);
  assert.match(normal, /class="vac-sr-only">View stay/);
  assert.doesNotMatch(normal, /twig-compact-stay-info/);
});

test("compact and default saved stays preserve navigation and remove callbacks", async t => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  for (const compact of [true, false]) {
    const navigated = [], removed = [];
    await act(() => root.render(h(SavedStaysView, {
      compact, stays: [stays[0]], renderImage: () => null, stayHref: stay => `/stays/${stay.id}`,
      onNavigate: href => navigated.push(href), onRemoveStay: stay => removed.push(stay.id),
    })));
    const link = document.querySelector('a[href="/stays/stay-01"]');
    assert.equal(link.classList.contains("twig-compact-stay"), compact);
    assert.equal(!!link.querySelector(".vac-card-host"), !compact);
    await act(() => link.click());
    await act(() => document.querySelector('button[aria-label="Remove Adiron-shack from saved stays"]').click());
    assert.deepEqual(navigated, ["/stays/stay-01"]);
    assert.deepEqual(removed, ["stay-01"]);
  }
});
