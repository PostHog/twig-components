import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StayFilters, staySettings } from "@posthog/twig-components/filters";
import { BrowseStaysPreview } from "@posthog/twig-components/browse-stays-preview";
import { BrowseStays } from "@posthog/twig-components/browse-stays";
import { StayDetails } from "@posthog/twig-components/stay-details";
import { SavedStay } from "@posthog/twig-components/saved-stay";
import { HostWorkspace } from "@posthog/twig-components/host-workspace";
import { stays } from "@posthog/twig-components/catalog";
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

test("Browse stays uses the shared catalog and keeps search and filters accessible", () => {
  const html = renderToStaticMarkup(createElement(BrowseStays, {
    id: "test-browse",
    setting: "Coast",
    search: "",
    onSettingChange: () => {},
    onSearchChange: () => {},
    renderStay: (stay) => createElement("article", { key: stay.id }, stay.id),
  }));
  assert.match(html, /<label for="test-browse-search">Search stays<\/label>/);
  assert.match(html, /aria-pressed="true"[^>]*>Coast<\/button>/);
  assert.match(html, /role="status">1 stay<\/p>/);
  assert.match(html, /stay-02/);
  assert.doesNotMatch(html, /stay-01|stay-03/);
});

test("Stay details renders the same catalog facts as Twig", () => {
  const html = renderToStaticMarkup(createElement(StayDetails, { stay: stays[0] }));
  assert.match(html, /About this stay/);
  assert.match(html, /Where you’ll sleep/);
  assert.match(html, /What’s here/);
  assert.match(html, /<dt>Guests<\/dt>/);
});

test("account and host views expose state without owning identity or capture", () => {
  const account = renderToStaticMarkup(createElement(SavedStay, {
    stay: stays[0], accountId: "account-42", saved: true,
    onSignIn: () => {}, onSignOut: () => {}, onToggleSave: () => {},
  }));
  assert.match(account, /Signed in as <strong>account-42<\/strong>/);
  assert.match(account, /aria-pressed="true">Saved to your stays/);
  const host = renderToStaticMarkup(createElement(HostWorkspace, {
    stay: stays[0], hostId: "nest-17", personId: "teammate-1",
    available: false, onAvailabilityChange: () => {},
  }));
  assert.match(host, /<dd>nest-17<\/dd>/);
  assert.match(host, /<dd>teammate-1<\/dd>/);
  assert.match(host, /aria-pressed="false">Unavailable/);
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
