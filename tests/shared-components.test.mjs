import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StayFilters, staySettings } from "@posthog/twig-components/filters";
import { BrowseStaysPreview } from "@posthog/twig-components/browse-stays-preview";
import { FilterLabExercise } from "@posthog/twig-components/filter-lab-exercise";
import {
  filterLabReducer,
  initialLabState,
} from "@posthog/twig-components/filter-lab";

test("shared filters render outside Next.js with accessible state and replay targets", () => {
  for (const setting of staySettings) {
    const html = renderToStaticMarkup(
      createElement(StayFilters, {
        value: setting,
        onChange: () => {},
      })
    );
    assert.match(html, /<legend>Filter by destination type<\/legend>/);
    assert.equal((html.match(/<button /g) ?? []).length, 4);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.ok(
      html.includes(
        `data-replay-label="Filter: ${setting}" type="button" aria-pressed="true"`
      )
    );
  }
});

test("read-only Browse stays preview labels the chosen view without buttons", () => {
  const html = renderToStaticMarkup(
    createElement(BrowseStaysPreview, { selected: "Coast" })
  );
  assert.match(html, /data-twig-filter="Coast" data-selected="true"/);
  assert.match(html, /data-twig-stay="Coast">Coast stay/);
  assert.match(html, /role="img"/);
  assert.doesNotMatch(html, /<button/);
});

test("shared lesson preserves the actual click separately from a misconfigured event", () => {
  let state = filterLabReducer(initialLabState, { type: "example" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  assert.deepEqual(state.events[0], {
    id: 1,
    event: "stay_filter_selected",
    clicked: "Coast",
    properties: { destination_type: "Forest" },
  });
  state = filterLabReducer(state, { type: "repair" });
  state = filterLabReducer(state, {
    type: "edit",
    config: { source: "clicked" },
  });
  state = filterLabReducer(state, { type: "apply" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  assert.equal(state.events[0].properties.destination_type, "Coast");
  assert.equal(state.before[0].properties.destination_type, "Forest");
});

test("portable filter exercise renders both the code step and event comparison", () => {
  const props = {
    dispatch: () => {},
    setStage: () => {},
    onFocusFilters: () => {},
    onContinue: () => {},
    filterHref: "#my-filter-controls",
  };
  const starting = renderToStaticMarkup(
    createElement(FilterLabExercise, {
      ...props,
      state: initialLabState,
      stage: 1,
    })
  );
  assert.match(starting, /From a filter click to an event/);
  assert.match(starting, /posthog\.capture/);

  let state = filterLabReducer(initialLabState, { type: "example" });
  state = filterLabReducer(state, { type: "filter", setting: "Forest" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  const inspecting = renderToStaticMarkup(
    createElement(FilterLabExercise, { ...props, state, stage: 2 })
  );
  assert.match(inspecting, /Event #2/);
  assert.match(inspecting, /Mismatch: the event describes a different filter/);
  assert.match(inspecting, /aria-controls="[^"]+"/);
  assert.doesNotMatch(inspecting, /posthog\.com/);
});

test("shared catalog keeps filter results and stay cards consistent", async () => {
  const { filterStays, stays } = await import(
    "@posthog/twig-components/catalog"
  );
  const { StayCardContent } = await import(
    "@posthog/twig-components/stay-card"
  );
  assert.equal(filterStays("All").length, 3);
  assert.equal(filterStays("Forest").length, 1);
  assert.equal(filterStays("Coast").length, 1);
  assert.equal(filterStays("City").length, 1);
  assert.equal(filterStays("City")[0].hostId, "colette");
  assert.equal(filterStays("All", "Paris")[0].id, "stay-03");
  assert.equal(filterStays("All", "Adiron")[0].id, "stay-01");
  assert.equal(filterStays("Coast", "Adiron").length, 0);
  const html = renderToStaticMarkup(
    createElement(StayCardContent, { stay: stays[0], image: null })
  );
  assert.match(html, /Adiron-shack/);
  assert.match(html, /\$355/);
  assert.match(html, /4 guests/);
  assert.doesNotMatch(html, /<a |↗/);
  const studio = renderToStaticMarkup(
    createElement(StayCardContent, { stay: filterStays("City")[0], image: null })
  );
  assert.match(studio, /2 guests · 1 bath/);
  assert.doesNotMatch(studio, /0 bedrooms|1 baths/);
});
