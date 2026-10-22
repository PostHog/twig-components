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

test("repeated trip errors form one issue and a successful retry adds no exception", () => {
  const capture = { type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: stays[0].id };
  assert.equal(errorTrackingReducer(initialErrorTrackingState, capture).occurrences.length, 0);
  const booked = errorTrackingReducer(initialErrorTrackingState, { type: "book", booking: { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title } });
  assert.equal(booked.booking.id, "trip-1");
  const first = errorTrackingReducer(booked, capture);
  const second = errorTrackingReducer(first, capture);
  assert.equal(second.occurrences.length, 2);
  assert.equal(second.occurrences[0].fingerprint, second.occurrences[1].fingerprint);
  assert.equal(errorTrackingReducer(first, { type: "fix" }).fixed, false);
  const fixed = errorTrackingReducer(second, { type: "fix" });
  const retry = errorTrackingReducer(fixed, { type: "retry-success" });
  assert.equal(retry.successfulRetry, true);
  assert.equal(retry.occurrences.length, 2);
  assert.equal(errorTrackingReducer(retry, { type: "resolve" }).resolved, false);
  assert.equal(errorTrackingReducer(retry, { type: "reset" }).occurrences.length, 0);
  assert.equal(errorTrackingReducer(retry, { type: "reset" }).booking, null);
});

test("several rapid retries keep adding occurrences to the same issue", () => {
  const capture = { type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: stays[0].id };
  let state = errorTrackingReducer(initialErrorTrackingState, {
    type: "book", booking: { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title },
  });
  for (let i = 0; i < 10; i++) state = errorTrackingReducer(state, capture);
  assert.equal(state.occurrences.length, 10);
  assert.equal(new Set(state.occurrences.map((occurrence) => occurrence.fingerprint)).size, 1);
});

test("the lab starts on stay listings and has no entry on booked stays", () => {
  for (const stay of stays) assert.ok(playgroundPage(`/stays/${stay.id}`, stays).touchpoints.some((point) => point.id === "errors"));
  const bookingsPage = playgroundPage("/profile/bookings", stays);
  assert.deepEqual(bookingsPage.touchpoints, []);
  assert.ok(!labsOnOtherPages(bookingsPage).some((item) => item.id === "errors"));
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true }, h(ErrorTrackingLab, { stage: 0, onStage: () => {}, location: "stay", onFocusBooking: () => {}, onFocusDetails: () => {} })));
  assert.match(html, /Exceptions and issue resolution/);
  assert.match(html, /How this simulation works/);
  assert.match(html, /not sent to PostHog/);
});

test("the trip error explanation has no extra inspection screen", () => {
  const booked = errorTrackingReducer(initialErrorTrackingState, {
    type: "book", booking: { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title },
  });
  const failed = errorTrackingReducer(booked, {
    type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: stays[0].id,
  });
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: booked, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 2, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(html, /aria-label="Open your trip"[\s\S]*?Click <strong>Trip details<\/strong>/);
  assert.doesNotMatch(html, /Inspect the error|Twig showed an error when you opened the details/);
  const inspection = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: failed, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 3, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(inspection, /PostHog Error Tracking helps pinpoint why: it records the failure as an <strong>exception<\/strong>/);
  assert.doesNotMatch(inspection, /Inspect the error|Twig showed an error when you opened the details/);
  assert.match(inspection, /Example PostHog exception properties/);
  assert.match(inspection, /Example PostHog stack trace/);
  assert.doesNotMatch(inspection, /Error Tracking \/ Issue/);
  assert.match(inspection, /Selected exception/);
  assert.match(inspection, /TypeError/);
  assert.match(inspection, /Cannot read properties of <mark>undefined<\/mark>/);
  assert.match(inspection, /The stay ID links the event to your booking/);
  assert.match(inspection, /<strong>issue<\/strong>, a group of similar errors/);
  assert.match(inspection, /<strong>stack trace<\/strong> lists the functions Twig was running/);
  assert.match(inspection, /aria-label="Example PostHog stack trace"[\s\S]*?aria-label="Selected exception"[\s\S]*?TypeError[\s\S]*?Stack Trace[\s\S]*?aria-label="Stack frames"/);
  const propertiesVisual = inspection.match(/aria-label="Example PostHog exception properties"([\s\S]*?)<\/section>/)?.[1] ?? "";
  assert.doesNotMatch(propertiesVisual, /<mark>/);
  const stackVisual = inspection.match(/aria-label="Example PostHog stack trace"([\s\S]*?)<\/section>/)?.[1] ?? "";
  assert.equal((stackVisual.match(/<strong>TypeError<\/strong>/g) ?? []).length, 1);
  assert.match(stackVisual, /<mark>undefined<\/mark>/);
  const stackDocument = new JSDOM(`<section ${stackVisual}</section>`).window.document;
  assert.match(stackDocument.querySelector('pre[aria-label="Stack frames"]').textContent, /at readTripHost \(trip-details\.ts\)/);
  assert.match(stackDocument.querySelector('[data-highlighted="true"]').textContent, /readTripHost/);
  assert.match(inspection, /Selected exception properties/);
  assert.match(inspection, /stay_id/);
  assert.match(inspection, /<mark>undefined<\/mark>/);
  assert.match(inspection, /To read a stack trace, start at the top|See how errors are grouped/);
  assert.doesNotMatch(inspection, /aria-pressed=|role="group" aria-label="Exception details"/);
  assert.doesNotMatch(inspection, /Which part of the trip details failed\?|type="radio"|Woody’s name/);
  const grouping = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: failed, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 4, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(grouping, /Rage click <strong>Try again<\/strong> in Twig&#x27;s trip details, and watch the count climb/);
  const retried = errorTrackingReducer(failed, {
    type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: stays[0].id,
  });
  const afterRetry = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: retried, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 4, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.doesNotMatch(afterRetry, /Rage click <strong>Try again<\/strong>/);
  assert.match(afterRetry, /Find the fix/);
});

test("returning to the trip step after applying the fallback can reopen the exception", () => {
  const booking = { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title };
  let state = errorTrackingReducer(initialErrorTrackingState, { type: "book", booking });
  for (let i = 0; i < 2; i++) state = errorTrackingReducer(state, {
    type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: booking.stayId,
  });
  state = errorTrackingReducer(errorTrackingReducer(state, { type: "fix" }), { type: "retry-success" });
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 2, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(html, /Trip details already produced an exception/);
  assert.match(html, /Review the exception/);
  assert.doesNotMatch(html, /Click <strong>Trip details<\/strong>/);
});

test("the error lab distinguishes the fallback from repairing missing host data", () => {
  const booking = { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title };
  let state = errorTrackingReducer(initialErrorTrackingState, { type: "book", booking });
  for (let i = 0; i < 2; i++) state = errorTrackingReducer(state, {
    type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: booking.stayId,
  });
  state = errorTrackingReducer(errorTrackingReducer(state, { type: "fix" }), { type: "retry-success" });
  const renderStage = (stage) => renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state, onAction: () => {} }, h(ErrorTrackingLab, {
    stage, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  const beforeFallback = renderStage(5);
  assert.match(beforeFallback, /Twig keeps a host record for each stay, saving details about the host/);
  assert.doesNotMatch(beforeFallback, /Woody.s name and bio/);
  assert.match(beforeFallback, /generic error message seen on Twig:<\/p><div class="vac-code-block/);
  assert.match(new JSDOM(beforeFallback).window.document.body.textContent, /return host\.name;/);
  assert.match(new JSDOM(beforeFallback).window.document.body.textContent, /return host\?\.name \?\?/);
  assert.match(beforeFallback, /Apply the Twig code fix/);
  assert.doesNotMatch(beforeFallback, /\/\/ Before|\/\/ After/);
  const retry = renderStage(6);
  assert.doesNotMatch(retry, /<pre|return host\.name;|host\?\.name/);
  assert.match(retry, /fallback stopped the crash, but the host/);
  assert.match(retry, /This retry added no new exception/);
  assert.doesNotMatch(retry, /Trip details opened with the fallback host name|Check the fix/);

  const issueView = renderStage(7);
  assert.match(issueView, /Example PostHog stack trace/);
  assert.match(issueView, /Example PostHog exception properties/);
  assert.doesNotMatch(issueView, /Error Tracking \/ Issue/);
  assert.match(issueView, /Selected exception/);
  assert.match(issueView, /Stack Trace/);
  assert.match(issueView, /Properties/);
  const propertiesVisual = issueView.match(/aria-label="Example PostHog exception properties"([\s\S]*?)<\/section>/)?.[1] ?? "";
  assert.match(propertiesVisual, /<code><mark>stay-01<\/mark><\/code>/);
  assert.doesNotMatch(propertiesVisual, /<mark>undefined<\/mark>/);
  assert.match(issueView, /The stay ID in PostHog points to this booking in Twig/);
  assert.match(issueView, /Apply the Twig repair/);
  assert.match(issueView, /readTripHost/);
  assert.match(issueView, /woodrow-sparks|Repair the host lookup/);
  assert.doesNotMatch(issueView, /Host record returned by trip details|aria-pressed=/);
  state = errorTrackingReducer(state, { type: "repair-host-lookup" });
  assert.equal(state.hostLookupRepaired, true);
  assert.equal(isErrorTrackingLabComplete(8, state), false);
  assert.equal(isErrorTrackingLabComplete(10, state), false);
  assert.match(renderStage(8), /repair is applied to Twig&#x27;s trip-details lookup/);
  assert.match(renderStage(8), /aria-label="Check the host repair"[\s\S]*?Click <strong>Trip details<\/strong> in Twig to reload this booking/);
  assert.equal(errorTrackingReducer(state, { type: "review-issue" }).issueReviewed, false);
  assert.equal(errorTrackingReducer(state, { type: "resolve" }).resolved, false);
  state = errorTrackingReducer(state, { type: "verify-host" });
  assert.match(renderStage(8), /After reloading trip details, Twig now shows <strong>Woody<\/strong>/);
  assert.match(renderStage(8), /Occurrences<\/dt><dd>2<\/dd>/);
  assert.match(renderStage(8), /Resolve the issue/);
  assert.doesNotMatch(renderStage(8), /Check another trip load|Inspect the issue|Click <strong>Trip details<\/strong>/);
  assert.equal(isErrorTrackingLabComplete(10, state), false);
  state = errorTrackingReducer(state, { type: "resolve" });
  assert.equal(state.resolved, true);
  assert.equal(isErrorTrackingLabComplete(9, state), false);
  assert.equal(isErrorTrackingLabComplete(10, state), true);
  assert.equal(state.occurrences.length, 2);
  assert.match(renderStage(9), /Resolved/);
  assert.match(renderStage(9), /Finish lab/);
  assert.doesNotMatch(renderStage(9), /Click <strong>Trip details<\/strong>/);
  assert.match(renderStage(10), /The exception, stack trace, and stay ID pointed to the broken host lookup/);
});

test("booked stays expose usable trip details and a recoverable fallback", () => {
  const booking = { id: "one", stay: stays[0], dateLabel: "Oct 20 – 23", guestsLabel: "2 guests", statusLabel: "Upcoming", status: "confirmed" };
  const html = renderToStaticMarkup(h(BookedStaysView, {
    bookings: [booking], renderImage: () => null, stayHref: () => "/stays/stay-01",
    onViewDetails: () => {}, onCancelBooking: () => {}, selectedBookingId: booking.id,
    renderDetails: () => h(TripDetailsView, { booking, errorMessage: "Try to load details again.", onRetry: () => {} }),
  }));
  assert.match(html, /Trip details/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Try to load details again\./);
  assert.match(html, /Try again/);
  assert.match(html, /Ooopsie :\( something went wrong/);
  assert.match(html, /disabled="" aria-label="Contact support, coming soon">Contact support/);
  assert.match(html, /Cancel stay/);
  assert.ok(html.indexOf('class="twig-booking-actions"') < html.indexOf('class="twig-trip-error"'));
  assert.doesNotMatch(html.slice(html.indexOf('class="twig-trip-error"')), /Cancel stay|Your trip|class="twig-trip-facts"|This trip is saved/);
  const fallback = renderToStaticMarkup(h(BookedStaysView, {
    bookings: [booking], renderImage: () => null, stayHref: () => "/stays/stay-01",
    selectedBookingId: booking.id, highlightedTripDetailsBookingId: booking.id,
    onViewDetails: () => {}, renderDetails: () => h(TripDetailsView, { booking, hostName: "Host information unavailable" }),
  }));
  assert.match(fallback, /class="twig-trip-details" data-highlight-host="true"[^>]*>[^]*?class="twig-trip-host"><dt>Host<\/dt><dd>Host information unavailable<\/dd>/);
  assert.doesNotMatch(fallback, /class="twig-trip-details vac-lab-target"/);
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
  assert.match(html, /First, save a booking on Twig/);
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
  const booking = { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title };
  const booked = errorTrackingReducer(initialErrorTrackingState, { type: "book", booking });
  const failed = errorTrackingReducer(booked, { type: "capture", message: "host is undefined", stayId: booking.stayId });
  const failedTwice = errorTrackingReducer(failed, { type: "capture", message: "host is undefined", stayId: booking.stayId });
  const fixed = errorTrackingReducer(failedTwice, { type: "fix" });
  const retried = errorTrackingReducer(fixed, { type: "retry-success" });
  const repaired = errorTrackingReducer(retried, { type: "repair-host-lookup" });
  const verified = errorTrackingReducer(repaired, { type: "verify-host" });
  const render = (stage, state, location) => renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state, onAction: () => {} }, h(ErrorTrackingLab, {
    stage, location, onStage: () => {}, onFocusBooking: () => {}, onFocusDetails: () => {}, onBookNew: () => {},
  })));
  for (const [stage, state, location, label, steps] of [
    [1, initialErrorTrackingState, "stay", "Book a stay", 1],
    [1, initialErrorTrackingState, "other", "Book a stay", 2],
    [2, booked, "bookings", "Open your trip", 1],
    [2, booked, "stay", "Open your trip", 2],
    [4, failed, "bookings", "Retry trip details", 1],
    [6, fixed, "bookings", "Check the fallback", 1],
    [8, repaired, "bookings", "Check the host repair", 1],
  ]) {
    const html = render(stage, state, location);
    const checklist = html.match(new RegExp(`<ol class="vac-booking-checklist" aria-label="${label}">([\\s\\S]*?)<\\/ol>`))?.[1] ?? "";
    assert.equal((checklist.match(/<li /g) ?? []).length, steps, `${label} at stage ${stage}`);
    assert.equal((checklist.match(/class="vac-check-status"/g) ?? []).length, steps === 1 ? 0 : steps);
  }
  assert.match(render(9, verified, "bookings"), /aria-label="Resolve the issue"/);
});
