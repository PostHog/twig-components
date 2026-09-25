import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { playgroundPage } from "@posthog/twig-components/playground";
import { characters, stays } from "@posthog/twig-components/catalog";
import { AiLabProvider, AiLab } from "@posthog/twig-components/ai-lab-ui";
import { BookingLabProvider, BookingLab } from "@posthog/twig-components/booking-lab-ui";
import { StayLabProvider, StayLab } from "@posthog/twig-components/stay-lab-ui";
import { ReplayLab } from "@posthog/twig-components/replay-lab-ui";
import { ReplayProvider } from "@posthog/twig-components/replay-recorder";
import {
  LabDirectory,
  PlaygroundDock,
  PlaygroundMarker,
  PlaygroundInvitation,
} from "@posthog/twig-components/playground-panels";

const render = (node) => renderToStaticMarkup(node);
const noop = () => {};

test("Woody's shared host profile uses his chosen name", () => {
  assert.equal(characters.find(({ id }) => id === "woodrow-sparks")?.name, "Woody");
});

test("the playground invitation matches the dock's PostHog name and branding", () => {
  const props = { onDismiss: noop, onOpen: noop, toggleRef: { current: null } };
  const invitation = render(h(PlaygroundInvitation, { ...props, dismissed: false }));
  assert.match(invitation, /vac-playground-invite vac-developer-theme/);
  assert.match(invitation, /posthog-logomark\.svg/);
  assert.match(invitation, /PostHog Playground/);
  assert.doesNotMatch(invitation, /Interactive playground/);
  assert.match(invitation, /Open playground/);

  const compact = render(h(PlaygroundInvitation, { ...props, dismissed: true }));
  assert.match(compact, /Explore PostHog/);
  assert.doesNotMatch(compact, /Want to explore/);
});

test("all portable lab entry screens render without a site router", () => {
  const ai = render(h(AiLabProvider, { active: true }, h(AiLab, { stage: 1, onStage: noop, onFocusPlanner: noop })));
  const booking = render(h(BookingLabProvider, { active: true }, h(BookingLab, { stage: 0, onStage: noop, onFocusBooking: noop })));
  const stay = render(h(StayLabProvider, null, h(StayLab, { stage: 0, onStage: noop, pathname: "/stays/stay-01", renderStayLink: () => null })));
  const replay = render(h(ReplayProvider, { open: false, pathname: "/" }, h(ReplayLab, {
    stage: 0,
    onStage: noop,
    pathname: "/",
    replay: {
      exercise: "ghost", recording: [], starting: false, frames: [], mode: null,
      masked: true, capturedMasked: true, message: "", setMasked: noop,
      start: noop, stop: noop, clear: noop, setExercise: noop,
    },
    returnHome: null,
    sessionPlayer: null,
  })));
  assert.match(ai, /From Twig to an event/);
  assert.match(booking, /booking/i);
  assert.match(stay, /Which stay did they view/);
  assert.match(replay, /What happened between the clicks/);
});

test("playground directory and dock preserve accessible navigation", () => {
  const page = playgroundPage("/", stays);
  assert.deepEqual(page.touchpoints.map(({ id }) => id), ["discovery", "catalog", "replay"]);
  const directory = render(h(LabDirectory, { page, choose: noop, showMarker: noop }));
  assert.equal((directory.match(/>Show me where<\/button>/g) ?? []).length, page.touchpoints.length);
  assert.match(directory, /Choose a lab/);
  assert.match(directory, /AI trip discovery/);

  const marker = render(h(PlaygroundMarker, {
    touchpoint: page.touchpoints[0], highlighted: false, onHighlight: noop, onChoose: noop,
  }));
  assert.match(marker, /aria-controls="twig-playground-detail"/);

  const dock = render(h(PlaygroundDock, {
    embedded: false, onClose: noop, headingRef: { current: null }, logo: null,
    navigation: h("span", null, "Navigation"), recordingBar: null,
    pageKey: page.key, guide: h("span", null, "Guide"),
  }));
  assert.match(dock, /aria-label="Twig playground"/);
  assert.match(dock, /PostHog Playground/);
  assert.match(dock, /aria-label="Instrumentation touchpoints and details"/);
});
