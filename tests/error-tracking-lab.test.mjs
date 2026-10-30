import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { errorTrackingReducer, initialErrorTrackingState, isErrorTrackingLabComplete } from "@posthog/twig-components/error-tracking-lab";
import { ErrorTrackingLabProvider, ErrorTrackingLab } from "@posthog/twig-components/error-tracking-lab-ui";
import { BookedStaysView, TripDetailsView } from "@posthog/twig-components/account";
import { labsOnOtherPages, playgroundPage } from "@posthog/twig-components/playground";
import { stays } from "@posthog/twig-components/catalog";

const booking = { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title };
const uncaught = { outcome: "local", type: "TypeError", handled: false, mechanism: "onerror", frames: ["a", "readTripHost"], sources: ["/_next/static/chunks/app.js@1:48213", "/_next/static/chunks/app.js@1:61877"], distinctId: "guest-1", sessionId: "session-1" };
const handled = { ...uncaught, handled: true, mechanism: "generic", surface: "trip_details", stayId: stays[0].id, host: "woodrow-sparks" };
const grouped = { ...handled, type: "HostNotFoundError", fingerprint: "host-not-found:woodrow-sparks" };
const noise = { outcome: "dropped", type: "Error", value: "ResizeObserver loop completed with undelivered notifications.", handled: false, mechanism: "onerror", frames: [] };
const apply = (state, ...actions) => actions.reduce(errorTrackingReducer, state);
const renderLab = (state, stage, location = "bookings") => renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state, onAction: () => {} }, h(ErrorTrackingLab, {
  stage, location, onStage: () => {}, onFocusBooking: () => {}, onFocusDetails: () => {}, onBookNew: () => {},
})));
const textOf = (html) => new JSDOM(html).window.document.body.textContent;

test("each lab step unlocks only after the one before it, and reset starts over", () => {
  assert.equal(errorTrackingReducer(initialErrorTrackingState, { type: "capture", exception: uncaught }).occurrences.length, 0);
  const booked = apply(initialErrorTrackingState, { type: "book", booking });
  assert.equal(booked.booking.id, "trip-1");
  assert.equal(errorTrackingReducer(booked, { type: "catch" }).caught, false);
  const failed = apply(booked, { type: "capture", exception: uncaught });
  assert.equal(failed.occurrences[0].id, 1);
  assert.equal(errorTrackingReducer(failed, { type: "fingerprint" }).fingerprinted, false);
  const caught = apply(failed, { type: "catch" });
  assert.equal(caught.caught, true);
  assert.equal(errorTrackingReducer(caught, { type: "repair" }).repaired, false);
  assert.equal(errorTrackingReducer(caught, { type: "fingerprint" }).fingerprinted, false);
  const mapped = apply(caught, { type: "upload-source-maps" });
  assert.equal(mapped.sourceMapped, true);
  assert.equal(errorTrackingReducer(mapped, { type: "filter-noise" }).noiseFiltered, false);
  const fingerprinted = apply(mapped, { type: "fingerprint" });
  assert.equal(fingerprinted.fingerprinted, true);
  assert.equal(errorTrackingReducer(fingerprinted, { type: "verify" }).verified, false);
  const repaired = apply(fingerprinted, { type: "repair" });
  assert.equal(errorTrackingReducer(repaired, { type: "resolve" }).resolved, false);
  const verified = apply(repaired, { type: "verify" });
  assert.equal(verified.verified, true);
  assert.equal(verified.resolved, false);
  const resolved = apply(verified, { type: "resolve" });
  assert.equal(resolved.resolved, true);
  const reset = errorTrackingReducer(resolved, { type: "reset" });
  assert.deepEqual({ ...reset, revision: 0 }, initialErrorTrackingState);
  assert.equal(reset.revision, resolved.revision + 1);
});

test("a catch needs an exception Twig did not handle", () => {
  const onlyHandled = apply(initialErrorTrackingState, { type: "book", booking }, { type: "capture", exception: handled });
  assert.equal(errorTrackingReducer(onlyHandled, { type: "catch" }).caught, false);
});

test("captures keep accumulating, stop after the repair, and cap at 50", () => {
  let state = apply(initialErrorTrackingState, { type: "book", booking });
  for (let i = 0; i < 60; i++) state = errorTrackingReducer(state, { type: "capture", exception: uncaught });
  assert.equal(state.occurrences.length, 50);
  assert.deepEqual(state.occurrences.slice(0, 3).map((occurrence) => occurrence.id), [1, 2, 3]);
  const repaired = apply(initialErrorTrackingState, { type: "book", booking }, { type: "capture", exception: uncaught }, { type: "catch" }, { type: "upload-source-maps" }, { type: "fingerprint" }, { type: "repair" });
  assert.equal(errorTrackingReducer(repaired, { type: "capture", exception: grouped }).occurrences.length, 1);
});

test("the lab starts on stay listings and has no entry on booked stays", () => {
  for (const stay of stays) assert.ok(playgroundPage(`/stays/${stay.id}`, stays).touchpoints.some((point) => point.id === "errors"));
  const bookingsPage = playgroundPage("/profile/bookings", stays);
  assert.deepEqual(bookingsPage.touchpoints, []);
  assert.ok(!labsOnOtherPages(bookingsPage).some((item) => item.id === "errors"));
  const html = renderLab(initialErrorTrackingState, 0, "stay");
  assert.match(html, /Exceptions and issue resolution/);
  assert.match(html, /How this lab works/);
  assert.match(html, /in this browser rather than sending it to PostHog/);
});

test("opening the trip is the first failure, and stage 3 shows the autocaptured event in Activity", () => {
  const booked = apply(initialErrorTrackingState, { type: "book", booking });
  const open = renderLab(booked, 2);
  assert.match(open, /aria-label="Open your trip"[\s\S]*?Click <strong>Trip details<\/strong>/);
  assert.doesNotMatch(open, /PostHog Activity preview/);
  const failed = apply(booked, { type: "capture", exception: uncaught });
  const reopened = renderLab(failed, 2);
  assert.match(reopened, /Trip details already threw an exception/);
  assert.doesNotMatch(reopened, /Click <strong>Trip details<\/strong>/);

  const doc = new JSDOM(renderLab(failed, 3)).window.document;
  assert.deepEqual([...doc.querySelectorAll('[aria-label="Recorded events"] code')].map((cell) => cell.textContent), ["$exception"]);
  const properties = Object.fromEntries([...doc.querySelectorAll('[aria-label="Event properties"] tbody tr')].map((row) => [row.cells[0].textContent, row.cells[1].textContent]));
  assert.equal(properties.$exception_handled, "false");
  assert.equal(properties.distinct_id, "guest-1");
  assert.equal(properties.$session_id, "session-1");
  assert.equal("stay_id" in properties, false);
  assert.match(doc.querySelector('[role="status"]').textContent, /caught by the PostHog Web SDK’s auto-capture/);
  assert.equal(doc.querySelector('[aria-label="Issue: TypeError"]'), null);
  assert.doesNotMatch(renderLab(booked, 3), /PostHog Activity preview/);
});

test("browser noise is never shown as Twig's exception, and the retry steps wait for their capture", () => {
  const failed = apply(initialErrorTrackingState, { type: "book", booking }, { type: "capture", exception: noise }, { type: "noise", at: "2026-10-30T20:00:00.000Z" });
  assert.equal(failed.occurrences.length, 0);
  assert.doesNotMatch(renderLab(failed, 3), /PostHog Activity preview/);

  const retried = apply(failed, { type: "capture", exception: uncaught });
  assert.match(renderLab(retried, 4), /Apply to Twig for this lab/);
  const caught = apply(retried, { type: "catch" });
  const waiting = renderLab(caught, 4);
  assert.match(waiting, /aria-label="Capture the retry"[\s\S]*?Click <strong>Try again<\/strong>/);
  assert.doesNotMatch(waiting, /Apply to Twig for this lab|Every Try again adds/);

  const once = apply(caught, { type: "capture", exception: handled });
  const doc = new JSDOM(renderLab(once, 4)).window.document;
  assert.equal(doc.querySelectorAll('[aria-label="Recorded events"] tbody tr').length, 2);
  const properties = Object.fromEntries([...doc.querySelectorAll('[aria-label="Event properties"] tbody tr')].map((row) => [row.cells[0].textContent, row.cells[1].textContent]));
  assert.equal(properties.stay_id, "stay-01");
  assert.equal(properties.surface, "trip_details");
  assert.equal(properties.$exception_handled, "true");
  assert.equal(doc.querySelector('[aria-label="Issue: TypeError"]'), null);
  const twice = textOf(renderLab(apply(once, { type: "capture", exception: handled }), 4));
  assert.match(twice, /Each Try again sends another exception\. You’ve sent 3\./);
  assert.match(twice, /See the issue/);
  const issueStep = new JSDOM(renderLab(apply(once, { type: "capture", exception: handled }), 5)).window.document;
  assert.deepEqual([...issueStep.querySelectorAll(".vac-builder > p")].map((p) => p.textContent), ["To help you review them, PostHog groups similar exceptions into issues. In PostHog, you triage and resolve exceptions by issue."]);
  const issue = issueStep.querySelector('[aria-label="Issue: TypeError"]');
  assert.match(issue.querySelector("dl").textContent, /3Occurrences1Sessions1Users/);
  assert.equal(issue.querySelectorAll('[aria-label="Exceptions"] li').length, 3);
  assert.match(issueStep.body.textContent, /Drop browser noise/);
});

test("stack trace, source maps, grouping, and noise steps each show what PostHog would", () => {
  const state = apply(initialErrorTrackingState, { type: "book", booking },
    { type: "capture", exception: uncaught }, { type: "catch" }, { type: "capture", exception: handled });

  const bundle = new JSDOM(renderLab(state, 9)).window.document;
  assert.deepEqual([...bundle.querySelectorAll('[aria-label="Stack trace"] li')].map((frame) => frame.textContent),
    ["a/_next/static/chunks/app.js@1:48213⚠", "readTripHost/_next/static/chunks/app.js@1:61877⚠"]);
  assert.ok([...bundle.querySelectorAll('[aria-label="Stack trace"] li > button')].every((button) => button.disabled));
  assert.match(bundle.body.textContent, /Upload Twig’s source maps/);
  assert.doesNotMatch(bundle.body.textContent, /See what led up to it/);
  const mapped = apply(state, { type: "upload-source-maps" });
  const resolved = new JSDOM(renderLab(mapped, 9)).window.document;
  assert.deepEqual([...resolved.querySelectorAll('[aria-label="Stack trace"] li > button > code')].map((frame) => frame.textContent).slice(0, 2), ["readTripHost", "openTripDetails"]);
  assert.match(resolved.querySelector('[aria-label="readTripHost source"]').textContent, /return host\.name;/);
  assert.ok(resolved.querySelector('[aria-label="Vendor frame"]'));

  assert.match(renderLab(mapped, 10), /Apply to Twig for this lab/);
  const grouping = apply(mapped, { type: "fingerprint" });
  assert.match(renderLab(grouping, 10), /aria-label="Capture the retry"/);
  const groupedState = apply(grouping, { type: "capture", exception: grouped });
  const issues = new JSDOM(renderLab(groupedState, 10)).window.document;
  assert.deepEqual([...issues.querySelectorAll('[aria-label="Issues"] li')].map((issue) => [issue.getAttribute("aria-label"), issue.querySelector(".vac-et-issue-count").textContent]),
    [["Issue: TypeError", "2"], ["Issue: HostNotFoundError", "1"]]);
  assert.match(issues.body.textContent, /readTripHost in src\/lib\/vacation\/trip-details\.ts/);

  const quiet = new JSDOM(renderLab(groupedState, 6)).window.document;
  assert.doesNotMatch(quiet.body.textContent, /Drop them with before_send|Every one became an exception/);
  const noisy = apply(groupedState, ...Array.from({ length: 3 }, (_, index) => ({ type: "noise", at: `2026-10-30T20:00:0${index}.000Z` })));
  const noisyDoc = new JSDOM(renderLab(noisy, 6)).window.document;
  assert.equal(noisyDoc.querySelectorAll('[aria-label="Recorded events"] tbody tr').length, 6);
  const wall = apply(noisy, ...Array.from({ length: 20 }, (_, index) => ({ type: "noise", at: `2026-10-30T20:01:${String(index).padStart(2, "0")}.000Z` })));
  const wallRows = new JSDOM(renderLab(wall, 6)).window.document.querySelectorAll('[aria-label="Recorded events"] tbody tr');
  assert.equal(wallRows.length, 8);
  assert.match(wallRows[0].textContent, /\$exception/);
  assert.match(noisyDoc.body.textContent, /Every one became an exception in PostHog/);
  assert.match(noisyDoc.body.textContent, /Drop them with before_send/);
  assert.match(renderLab(noisy, 7), /Add before_send to Twig/);
  const dropped = apply(noisy, { type: "filter-noise" }, { type: "noise", at: "2026-10-30T20:00:05.000Z" }, { type: "noise", at: "2026-10-30T20:00:06.000Z" });
  const droppedDoc = new JSDOM(renderLab(dropped, 7)).window.document;
  assert.match(droppedDoc.body.textContent, /dropped all 2, so none of them reached PostHog/);
  const controls = new JSDOM(renderLab(dropped, 8)).window.document;
  assert.deepEqual([...controls.querySelectorAll('.vac-et-issue-parts a')].map((link) => link.getAttribute("href").split("#")[1]),
    ["skip-local-development-with-production-builds", "stop-looping-browsers-with-burst-protection", "drop-extension-errors-with-a-suppression-rule", "cap-outages-with-rate-limits"]);
  assert.equal(noisyDoc.querySelector('.vac-et-issue-parts'), null);
  assert.match(droppedDoc.body.textContent, /Other noise controls/);
  assert.match(controls.body.textContent, /Read the stack trace/);
});

test("the fix is verified by a clean trip load, then resolved to finish the lab", () => {
  let state = apply(initialErrorTrackingState, { type: "book", booking },
    { type: "capture", exception: uncaught }, { type: "catch" }, { type: "upload-source-maps" }, { type: "fingerprint" }, { type: "capture", exception: grouped });
  const before = renderLab(state, 11);
  assert.match(before, /Apply the Twig fix/);
  assert.doesNotMatch(before, /Resolve the issue|Check the fix/);
  state = apply(state, { type: "repair" });
  assert.match(renderLab(state, 11), /aria-label="Check the fix"[\s\S]*?data-state="current"/);
  assert.doesNotMatch(renderLab(state, 11), /Resolve the issue|no new exception/i);
  assert.equal(isErrorTrackingLabComplete(12, state), false);
  state = apply(state, { type: "verify" });
  assert.match(renderLab(state, 11), /Trip details opened with no new exception/);
  assert.match(renderLab(state, 11), /Resolve the issues/);
  assert.equal(isErrorTrackingLabComplete(12, state), false);
  state = apply(state, { type: "resolve" });
  assert.match(renderLab(state, 11), /Finish lab/);
  assert.equal(isErrorTrackingLabComplete(11, state), false);
  assert.equal(isErrorTrackingLabComplete(12, state), true);
  assert.equal(state.occurrences.length, 2);
  assert.match(renderLab(state, 12), /autocapture and <code>captureException<\/code>/);
});

test("booked stays expose usable trip details, a retry, and a lab marker beside the details button", () => {
  const booking = { id: "one", stay: stays[0], dateLabel: "Oct 20 – 23", guestsLabel: "2 guests", statusLabel: "Upcoming", status: "confirmed" };
  const html = renderToStaticMarkup(h(BookedStaysView, {
    bookings: [booking], renderImage: () => null, stayHref: () => "/stays/stay-01",
    onViewDetails: () => {}, onCancelBooking: () => {}, selectedBookingId: booking.id,
    detailsAccessory: (item) => h("span", { className: "lab-marker" }, `marker-${item.id}`),
    renderDetails: () => h(TripDetailsView, { booking, errorMessage: "Try to load details again.", onRetry: () => {} }),
  }));
  assert.match(html, /Trip details/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Try to load details again\./);
  assert.match(html, /Try again/);
  assert.match(html, /Ooopsie :\( something went wrong/);
  assert.match(html, /disabled="" aria-label="Contact support, coming soon">Contact support/);
  assert.match(html, /Cancel stay/);
  assert.match(html, /Trip details<\/button><span class="lab-marker">marker-one<\/span>/);
  assert.ok(html.indexOf('class="twig-booking-actions"') < html.indexOf('class="twig-trip-error"'));
  assert.doesNotMatch(html.slice(html.indexOf('class="twig-trip-error"')), /Cancel stay|Your trip|class="twig-trip-facts"|This trip is saved/);
  const highlighted = renderToStaticMarkup(h(BookedStaysView, {
    bookings: [booking], renderImage: () => null, stayHref: () => "/stays/stay-01",
    selectedBookingId: booking.id, highlightedTripDetailsBookingId: booking.id,
    onViewDetails: () => {}, renderDetails: () => h(TripDetailsView, { booking, hostName: "Woody" }),
  }));
  assert.match(highlighted, /class="twig-trip-details" data-highlight-host="true"[^>]*>[^]*?class="twig-trip-host"><dt>Host<\/dt><dd>Woody<\/dd>/);
  assert.doesNotMatch(highlighted, /class="twig-trip-details vac-lab-target"/);
  const loaded = renderToStaticMarkup(h(TripDetailsView, { booking, hostName: "Woody" }));
  assert.match(loaded, /Your trip/);
  assert.match(loaded, /Woody/);
  const canceled = renderToStaticMarkup(h(TripDetailsView, { booking: { ...booking, status: "canceled" } }));
  assert.match(canceled, /Stay canceled/);
  assert.doesNotMatch(canceled, /Cancel stay/);
  const canceledCard = renderToStaticMarkup(h(BookedStaysView, {
    bookings: [{ ...booking, status: "canceled", statusLabel: "Canceled" }],
    renderImage: () => null, stayHref: () => "/stays/stay-01",
    onViewDetails: () => {}, onCancelBooking: () => {},
  }));
  assert.doesNotMatch(canceledCard, /Cancel stay/);
});

test("the lab asks for a new booking without offering an existing trip", () => {
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true }, h(ErrorTrackingLab, {
    stage: 1, onStage: () => {}, location: "bookings",
    onFocusBooking: () => {}, onFocusDetails: () => {}, onBookNew: () => {},
  })));
  assert.match(html, /First, book a stay on Twig/);
  assert.match(html, /aria-label="Book a stay"[\s\S]*?aria-label="Next">1[\s\S]*?aria-label="Upcoming">2/);
  assert.match(html, /Find a stay/);
  assert.doesNotMatch(html, /Use an existing booking|Use this booking|<select/);
  const stayHtml = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true }, h(ErrorTrackingLab, {
    stage: 1, onStage: () => {}, location: "stay",
    onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(stayHtml, /Book stay/);
  assert.doesNotMatch(stayHtml, /Log in to book|Log in with/);
});

test("every Twig action in the error lab uses single or numbered directions", () => {
  const booked = apply(initialErrorTrackingState, { type: "book", booking });
  const failed = apply(booked, { type: "capture", exception: uncaught });
  const caught = apply(failed, { type: "catch" });
  const fingerprinted = apply(caught, { type: "upload-source-maps" }, { type: "fingerprint" });
  const repaired = apply(fingerprinted, { type: "repair" });
  const verified = apply(repaired, { type: "verify" });
  for (const [stage, state, location, label, steps] of [
    [1, initialErrorTrackingState, "stay", "Book a stay", 1],
    [1, initialErrorTrackingState, "other", "Book a stay", 2],
    [2, booked, "bookings", "Open your trip", 1],
    [2, booked, "stay", "Open your trip", 2],
    [4, caught, "bookings", "Capture the retry", 1],
    [10, fingerprinted, "bookings", "Capture the retry", 1],
    [6, fingerprinted, "bookings", "Make some noise", 1],
    [11, repaired, "bookings", "Check the fix", 1],
  ]) {
    const html = renderLab(state, stage, location);
    const checklist = html.match(new RegExp(`<ol class="vac-booking-checklist" aria-label="${label}">([\\s\\S]*?)<\\/ol>`))?.[1] ?? "";
    assert.equal((checklist.match(/<li /g) ?? []).length, steps, `${label} at stage ${stage}`);
    assert.equal((checklist.match(/class="vac-check-status"/g) ?? []).length, steps === 1 ? 0 : steps);
  }
  assert.match(renderLab(verified, 11), /aria-label="Check the fix"[\s\S]*data-state="done"/);
});
