import test from "node:test";
import assert from "node:assert/strict";
import { readTripHost } from "../dist/experience/lib/vacation/trip-details.js";

test("a fallback prevents the crash while repairing the lookup restores the real host name", () => {
  assert.throws(() => readTripHost({}, "woodrow-sparks"), TypeError);
  assert.equal(readTripHost({}, "woodrow-sparks", true), "Host information unavailable");
  assert.equal(readTripHost({ "woodrow-sparks": { name: "Woody" } }, "woodrow-sparks", true), "Woody");
});
