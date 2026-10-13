import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { errorTrackingReducer, initialErrorTrackingState } from "@posthog/twig-components/error-tracking-lab";
import { ErrorTrackingLabProvider, ErrorTrackingLab } from "@posthog/twig-components/error-tracking-lab-ui";
import { BookedStaysView, TripDetailsView } from "@posthog/twig-components/account";
import { playgroundPage } from "@posthog/twig-components/playground";
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
  const reviewHtml = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: retry, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 7, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(reviewHtml, /Before the change/);
  assert.match(reviewHtml, /this retry added no new error/);
  assert.match(reviewHtml, /does not prove a fix has been shipped/);
  assert.match(reviewHtml, /Finish lab/);
  assert.doesNotMatch(reviewHtml, /Mark resolved|Resolve this example/);
  assert.equal(errorTrackingReducer(retry, { type: "resolve" }).resolved, true);
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

test("the lab starts on a stay, remains available on booked stays, and discloses its simulation", () => {
  assert.ok(playgroundPage("/stays/stay-01", stays).touchpoints.some((point) => point.id === "errors"));
  assert.deepEqual(playgroundPage("/profile/bookings", stays).touchpoints.map((point) => point.id), ["errors"]);
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true }, h(ErrorTrackingLab, { stage: 0, onStage: () => {}, location: "stay", onFocusBooking: () => {}, onFocusDetails: () => {} })));
  assert.match(html, /Error Tracking lab/);
  assert.match(html, /How this simulation works/);
  assert.match(html, /not sent to PostHog/);
});

test("the trip error has its own brief lesson screen", () => {
  const booked = errorTrackingReducer(initialErrorTrackingState, {
    type: "book", booking: { id: "trip-1", stayId: stays[0].id, stayTitle: stays[0].title },
  });
  const failed = errorTrackingReducer(booked, {
    type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: stays[0].id,
  });
  const html = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: failed, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 2, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(html, /Twig showed an error when you opened the details\./);
  assert.match(html, /Inspect the error/);
  assert.doesNotMatch(html, /Your .* booking is saved|Twig couldn’t show|Open your trip/);
  const inspection = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true, state: failed, onAction: () => {} }, h(ErrorTrackingLab, {
    stage: 3, onStage: () => {}, location: "bookings", onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(inspection, /In PostHog Error Tracking, an <strong>exception<\/strong> is an event for one software failure/);
  assert.match(inspection, /Exception type/);
  assert.match(inspection, /Error message/);
  assert.match(inspection, /stay ID that identifies your booking/);
  assert.match(inspection, /<strong>stack trace<\/strong> lists the functions Twig was running/);
  assert.match(inspection, /<mark>undefined<\/mark>/);
  assert.match(inspection, /<mark>name<\/mark>/);
  assert.match(inspection, /at <mark>readTripHost<\/mark>/);
  assert.match(inspection, /The highlighted clues tell the story/);
  assert.match(inspection, /See how errors are grouped/);
  assert.doesNotMatch(inspection, /Which part of the trip details failed\?|type="radio"|Woody’s name/);
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
  assert.match(html, /Book a stay on Twig/);
  assert.match(html, /Find a stay/);
  assert.doesNotMatch(html, /Use an existing booking|Use this booking|<select/);
  const stayHtml = renderToStaticMarkup(h(ErrorTrackingLabProvider, { active: true }, h(ErrorTrackingLab, {
    stage: 1, onStage: () => {}, location: "stay",
    onFocusBooking: () => {}, onFocusDetails: () => {},
  })));
  assert.match(stayHtml, /Book stay/);
  assert.doesNotMatch(stayHtml, /Log in to book|Log in with/);
});
