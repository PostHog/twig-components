import test from "node:test";
import assert from "node:assert/strict";
import { clearTwigStorage, isLabResumeLocation, labResumePath, labStartPath } from "../dist/experience/lib/vacation/lab-reset.js";
import { demoAccountStorageKey, initialDemoAccountState, parseDemoAccountState } from "../dist/experience/lib/vacation/demo-account.js";

test("reset returns every lab to its starting page", () => {
  for (const id of ["discovery", "catalog", "replay"]) {
    assert.equal(labStartPath(id, "stay-01"), "/");
  }
  for (const id of ["stay", "booking", "errors"]) {
    assert.equal(labStartPath(id, "stay-01"), "/stays/stay-01");
  }
});

test("returning to an active lab uses the page needed for its current step", () => {
  assert.equal(labResumePath("catalog", 2, "/", false), "/");
  assert.equal(labResumePath("replay", 0, "/stays/stay-02", false), "/stays/stay-02");
  assert.equal(labResumePath("replay", 1, "/stays/stay-02", false), "/");
  assert.equal(labResumePath("booking", 2, "/stays/stay-02", false), "/stays/stay-02");
  assert.equal(labResumePath("errors", 1, "/stays/stay-02", false), "/stays/stay-02");
  assert.equal(labResumePath("errors", 2, "/stays/stay-02", true), "/profile/bookings");
  assert.equal(labResumePath("errors", 6, "/stays/stay-02", true), "/profile/bookings");
  assert.equal(isLabResumeLocation("stay", 2, "/stays/stay-01", "/stays/stay-02"), true);
  assert.equal(isLabResumeLocation("errors", 1, "/stays/stay-01", "/stays/stay-02"), true);
  assert.equal(isLabResumeLocation("errors", 2, "/stays/stay-01", "/profile/bookings"), false);
  assert.equal(isLabResumeLocation("errors", 2, "/profile/bookings", "/profile/bookings"), true);
  assert.equal(isLabResumeLocation("catalog", 2, "/about", "/"), false);
});

test("a fresh lab starts with no prior account activity and keeps unrelated storage", () => {
  const previousAccount = {
    ...initialDemoAccountState,
    signedIn: true,
    savedStayIds: ["stay-01"],
    bookings: [{ id: "old-trip", stayId: "stay-01", checkIn: "2026-10-16", checkOut: "2026-10-18", guests: 2, status: "confirmed" }],
    settings: { ...initialDemoAccountState.settings, tripReminders: false },
  };
  const values = new Map([
    [demoAccountStorageKey, JSON.stringify(previousAccount)],
    ["other-app:settings", "keep"],
    ["twig:future-feature", "future state"],
  ]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
  };
  clearTwigStorage(storage);
  assert.deepEqual([...values], [["other-app:settings", "keep"]]);
  assert.deepEqual(parseDemoAccountState(values.get(demoAccountStorageKey) ?? null), initialDemoAccountState);
});
