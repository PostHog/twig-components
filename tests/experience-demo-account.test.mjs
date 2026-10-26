import test from "node:test";
import assert from "node:assert/strict";
import {
  demoAccountReducer,
  demoLoginEmail,
  demoTravelerProfile,
  initialDemoAccountState,
  parseDemoAccountState,
} from "../dist/experience/lib/vacation/demo-account.js";
import {
  loginHref,
  safeAccountRedirect,
} from "../dist/experience/lib/vacation/account-links.js";

const booking = {
  id: "stay-01-2026-10-10-2026-10-12",
  stayId: "stay-01",
  checkIn: "2026-10-10",
  checkOut: "2026-10-12",
  guests: 2,
  status: "confirmed",
};

test("the demo account starts signed out with empty saved and booked stays", () => {
  assert.equal(initialDemoAccountState.signedIn, false);
  assert.deepEqual(initialDemoAccountState.savedStayIds, []);
  assert.deepEqual(initialDemoAccountState.bookings, []);
  assert.equal(initialDemoAccountState.settings.displayName, "Edgar Hogg");
  assert.equal(initialDemoAccountState.settings.email, demoLoginEmail);
  assert.equal(demoTravelerProfile.homeTown, "London");
  assert.match(demoTravelerProfile.bio, /3:4 formation/);
  assert.match(demoTravelerProfile.bio, /rubber ducks/);
  assert.doesNotMatch(JSON.stringify(initialDemoAccountState), /password/i);
});

test("saving and booking are ignored until the fixed profile logs in", () => {
  const saved = demoAccountReducer(initialDemoAccountState, {
    type: "toggle-saved",
    stayId: "stay-01",
  });
  const booked = demoAccountReducer(initialDemoAccountState, {
    type: "book",
    booking,
  });
  assert.equal(saved, initialDemoAccountState);
  assert.equal(booked, initialDemoAccountState);
});

test("booking signs into the demo account, saves the stay once, and advances the error lab", () => {
  const ordinaryBooking = demoAccountReducer(initialDemoAccountState, { type: "confirm-booking", booking });
  assert.equal(ordinaryBooking.signedIn, true);
  assert.deepEqual(ordinaryBooking.bookings, [booking]);
  assert.equal(ordinaryBooking.errorTracking.stage, 0);

  const started = demoAccountReducer(initialDemoAccountState, { type: "error-tracking-stage", stage: 1 });
  const confirmed = demoAccountReducer(started, { type: "confirm-booking", booking, errorLabStayTitle: "Adiron-shack" });
  assert.equal(confirmed.signedIn, true);
  assert.deepEqual(confirmed.bookings, [booking]);
  assert.equal(confirmed.errorTracking.stage, 2);
  assert.equal(confirmed.errorTracking.state.booking?.id, booking.id);
  const repeated = demoAccountReducer(confirmed, { type: "confirm-booking", booking: { ...booking, id: "another-id" }, errorLabStayTitle: "Adiron-shack" });
  assert.equal(repeated.bookings.length, 1);
});

test("rebooking an existing trip does not attach a simulated error", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "logout" });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 1 });
  const resumed = demoAccountReducer(state, { type: "confirm-booking", booking: { ...booking, id: "duplicate" }, errorLabStayTitle: "Adiron-shack" });
  assert.equal(resumed.bookings.length, 1);
  assert.equal(resumed.errorTracking.state.booking, null);
});

test("signed-in saves, bookings, and settings survive logout", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "toggle-saved", stayId: "stay-01" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, {
    type: "update-settings",
    settings: { ...state.settings, tripReminders: false },
  });
  state = demoAccountReducer(state, { type: "logout" });
  assert.equal(state.signedIn, false);
  assert.deepEqual(state.savedStayIds, ["stay-01"]);
  assert.deepEqual(state.bookings, [booking]);
  assert.equal(state.settings.tripReminders, false);
});

test("the fixed personal details cannot be changed through settings or stored data", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, {
    type: "update-settings",
    settings: {
      ...state.settings,
      displayName: "Someone else",
      email: "someone@example.com",
      productUpdates: true,
    },
  });
  assert.equal(state.settings.displayName, "Edgar Hogg");
  assert.equal(state.settings.email, demoLoginEmail);
  assert.equal(state.settings.productUpdates, true);

  const parsed = parseDemoAccountState(JSON.stringify({
    ...state,
    settings: {
      ...state.settings,
      displayName: "Stored name",
      email: "stored@example.com",
    },
  }));
  assert.equal(parsed.settings.displayName, "Edgar Hogg");
  assert.equal(parsed.settings.email, demoLoginEmail);
});

test("local storage parsing rejects unknown schemas and invalid booking data", () => {
  assert.equal(parseDemoAccountState("not-json"), initialDemoAccountState);
  assert.equal(
    parseDemoAccountState(JSON.stringify({ version: 2 })),
    initialDemoAccountState
  );
  const parsed = parseDemoAccountState(JSON.stringify({
    version: 1,
    signedIn: true,
    savedStayIds: ["stay-01", "stay-01", null],
    bookings: [booking, { id: "bad" }],
    settings: initialDemoAccountState.settings,
  }));
  assert.deepEqual(parsed.savedStayIds, ["stay-01"]);
  assert.deepEqual(parsed.bookings, [booking]);
  const legacy = parseDemoAccountState(JSON.stringify({ ...parsed, bookings: [{ ...booking, status: undefined }] }));
  assert.equal(legacy.bookings[0].status, "confirmed");
});

test("canceling a stay keeps its history and allows another booking for the same dates", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "cancel-booking", bookingId: booking.id });
  assert.equal(state.bookings[0].status, "canceled");
  const replacement = { ...booking, id: "new-booking" };
  state = demoAccountReducer(state, { type: "book", booking: replacement });
  assert.deepEqual(state.bookings.map((item) => [item.id, item.status]), [["new-booking", "confirmed"], [booking.id, "canceled"]]);
  assert.deepEqual(parseDemoAccountState(JSON.stringify(state)).bookings, state.bookings);
});

test("unfinished error state survives reload until restart, and cancellation clears its link", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: "Adiron-shack" } } });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "capture", message: "Missing host", stayId: booking.stayId } });
  const restored = parseDemoAccountState(JSON.stringify(state));
  assert.equal(restored.errorTracking.stage, 4);
  assert.equal(restored.errorTracking.state.booking?.id, booking.id);
  assert.equal(restored.errorTracking.state.occurrences.length, 1);
  const canceled = demoAccountReducer(restored, { type: "cancel-booking", bookingId: booking.id });
  assert.equal(canceled.errorTracking.stage, 1);
  assert.equal(canceled.errorTracking.state.booking, null);
  assert.equal(canceled.errorTracking.state.occurrences.length, 0);
  assert.equal(parseDemoAccountState(JSON.stringify(canceled)).errorTracking.stage, 1);
});

test("the first failed trip details attempt opens the exception explanation", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: "Adiron-shack" } } });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 2 });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "capture", message: "Missing host", stayId: booking.stayId } });
  assert.equal(state.errorTracking.stage, 3);
  assert.equal(state.errorTracking.state.occurrences.length, 1);

  const oldSession = structuredClone(state);
  oldSession.errorTracking.stage = 2;
  assert.equal(parseDemoAccountState(JSON.stringify(oldSession)).errorTracking.stage, 3);
});

test("retries before the occurrence step do not skip its instruction or raise the count", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: "Adiron-shack" } } });
  const capture = { type: "error-tracking-action", action: { type: "capture", message: "Missing host", stayId: booking.stayId } };

  state = demoAccountReducer(state, capture);
  assert.equal(state.errorTracking.state.occurrences.length, 0);
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 2 });
  state = demoAccountReducer(state, capture);
  assert.equal(state.errorTracking.stage, 3);
  for (let i = 0; i < 5; i++) state = demoAccountReducer(state, capture);
  assert.equal(state.errorTracking.state.occurrences.length, 1);

  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  state = demoAccountReducer(state, capture);
  state = demoAccountReducer(state, capture);
  assert.equal(state.errorTracking.state.occurrences.length, 3);
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 5 });
  state = demoAccountReducer(state, capture);
  assert.equal(state.errorTracking.state.occurrences.length, 3);
});

test("host repair progress survives reload and older ending progress resumes at inspection", () => {
  let state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  state = demoAccountReducer(state, { type: "book", booking });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: "Adiron-shack" } } });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 2 });
  state = demoAccountReducer(state, { type: "error-tracking-action", action: { type: "capture", message: "Missing host", stayId: booking.stayId } });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  for (const action of [
    { type: "capture", message: "Missing host", stayId: booking.stayId },
    { type: "fix" }, { type: "retry-success" }, { type: "repair-host-lookup" },
  ]) state = demoAccountReducer(state, { type: "error-tracking-action", action });
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 8 });
  const restored = parseDemoAccountState(JSON.stringify(state));
  assert.equal(restored.errorTracking.stage, 8);
  assert.equal(restored.errorTracking.state.hostLookupRepaired, true);
  assert.equal(restored.errorTracking.state.hostVerified, false);
  assert.equal(restored.errorTracking.state.verifiedLoads, 0);

  const verified = demoAccountReducer(restored, { type: "error-tracking-action", action: { type: "verify-host" } });
  assert.equal(verified.errorTracking.state.verifiedLoads, 1);
  const resolved = demoAccountReducer(verified, { type: "error-tracking-action", action: { type: "resolve" } });
  assert.equal(resolved.errorTracking.state.resolved, true);
  assert.equal(parseDemoAccountState(JSON.stringify(resolved)).errorTracking.state.resolved, true);

  const olderState = structuredClone(state);
  delete olderState.errorTracking.state.hostLookupRepaired;
  delete olderState.errorTracking.state.hostVerified;
  delete olderState.errorTracking.state.verifiedLoads;
  delete olderState.errorTracking.state.issueReviewed;
  olderState.errorTracking.state.resolved = true;
  const migrated = parseDemoAccountState(JSON.stringify(olderState));
  assert.equal(migrated.errorTracking.stage, 7);
  assert.equal(migrated.errorTracking.state.resolved, false);
});

test("login links return to the current page without allowing login loops or external redirects", () => {
  assert.equal(loginHref("/stays/stay-01"), "/login?next=%2Fstays%2Fstay-01");
  assert.equal(loginHref("/login"), "/login?next=%2Fprofile");
  assert.equal(safeAccountRedirect("/profile/saved"), "/profile/saved");
  assert.equal(safeAccountRedirect("/login?next=/login"), "/profile");
  assert.equal(safeAccountRedirect("//example.com"), "/profile");
  assert.equal(safeAccountRedirect("https://example.com"), "/profile");
});
