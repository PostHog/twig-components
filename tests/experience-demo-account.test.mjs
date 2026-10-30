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

const uncaught = { outcome: "local", type: "TypeError", handled: false, mechanism: "onerror", frames: ["readTripHost"] };
const labAction = (action) => ({ type: "error-tracking-action", action });
const labBook = labAction({ type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: "Adiron-shack" } });
const labCapture = labAction({ type: "capture", exception: uncaught });
const bookedSession = () => {
  const state = demoAccountReducer(initialDemoAccountState, { type: "login" });
  return demoAccountReducer(demoAccountReducer(state, { type: "book", booking }), labBook);
};

test("unfinished error state survives reload until restart, and cancellation clears its link", () => {
  let state = bookedSession();
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  state = demoAccountReducer(state, labCapture);
  const restored = parseDemoAccountState(JSON.stringify(state));
  assert.equal(restored.errorTracking.stage, 4);
  assert.equal(restored.errorTracking.state.booking?.id, booking.id);
  assert.equal(restored.errorTracking.state.occurrences.length, 1);
  assert.equal(restored.errorTracking.state.occurrences[0].type, "TypeError");
  const canceled = demoAccountReducer(restored, { type: "cancel-booking", bookingId: booking.id });
  assert.equal(canceled.errorTracking.stage, 1);
  assert.equal(canceled.errorTracking.state.booking, null);
  assert.equal(canceled.errorTracking.state.occurrences.length, 0);
  assert.equal(parseDemoAccountState(JSON.stringify(canceled)).errorTracking.stage, 1);
});

test("the first failed trip details attempt opens the exception explanation", () => {
  let state = bookedSession();
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 2 });
  state = demoAccountReducer(state, labCapture);
  assert.equal(state.errorTracking.stage, 3);
  assert.equal(state.errorTracking.state.occurrences.length, 1);

  const resumed = structuredClone(state);
  resumed.errorTracking.stage = 2;
  assert.equal(parseDemoAccountState(JSON.stringify(resumed)).errorTracking.stage, 3);
});

test("captures wait for the open-trip step, then keep counting on later steps", () => {
  let state = bookedSession();
  state = demoAccountReducer(state, labCapture);
  assert.equal(state.errorTracking.state.occurrences.length, 0);
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 2 });
  state = demoAccountReducer(state, labCapture);
  assert.equal(state.errorTracking.stage, 3);
  state = demoAccountReducer(state, labCapture);
  assert.equal(state.errorTracking.stage, 3);
  assert.equal(state.errorTracking.state.occurrences.length, 2);
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  state = demoAccountReducer(state, labCapture);
  assert.equal(state.errorTracking.stage, 4);
  assert.equal(state.errorTracking.state.occurrences.length, 3);
});

test("lab repair progress survives reload, and a stored state from the old simulated lab starts over", () => {
  let state = bookedSession();
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 4 });
  for (const action of [{ type: "capture", exception: uncaught }, { type: "catch" }, { type: "upload-source-maps" }, { type: "fingerprint" }, { type: "repair" }]) {
    state = demoAccountReducer(state, labAction(action));
  }
  state = demoAccountReducer(state, { type: "error-tracking-stage", stage: 9 });
  const restored = parseDemoAccountState(JSON.stringify(state));
  assert.equal(restored.errorTracking.stage, 9);
  assert.deepEqual(
    [restored.errorTracking.state.caught, restored.errorTracking.state.fingerprinted, restored.errorTracking.state.repaired, restored.errorTracking.state.verified],
    [true, true, true, false]
  );
  const verified = demoAccountReducer(restored, labAction({ type: "verify" }));
  const resolved = demoAccountReducer(verified, labAction({ type: "resolve" }));
  assert.equal(parseDemoAccountState(JSON.stringify(resolved)).errorTracking.state.resolved, true);

  const simulated = structuredClone(state);
  simulated.errorTracking.state = {
    booking: simulated.errorTracking.state.booking,
    occurrences: [{ id: 1, message: "Missing host", stayId: booking.stayId, fingerprint: "old" }],
    fixed: true, successfulRetry: true, hostLookupRepaired: true, hostVerified: true, verifiedLoads: 1, resolved: true, revision: 3,
  };
  const started = parseDemoAccountState(JSON.stringify(simulated));
  assert.equal(started.errorTracking.state.booking, null);
  assert.deepEqual(started.errorTracking.state.occurrences, []);
  assert.equal(started.errorTracking.state.resolved, false);
  assert.equal(started.bookings.length, 1);
});

test("login links return to the current page without allowing login loops or external redirects", () => {
  assert.equal(loginHref("/stays/stay-01"), "/login?next=%2Fstays%2Fstay-01");
  assert.equal(loginHref("/login"), "/login?next=%2Fprofile");
  assert.equal(safeAccountRedirect("/profile/saved"), "/profile/saved");
  assert.equal(safeAccountRedirect("/login?next=/login"), "/profile");
  assert.equal(safeAccountRedirect("//example.com"), "/profile");
  assert.equal(safeAccountRedirect("https://example.com"), "/profile");
});
