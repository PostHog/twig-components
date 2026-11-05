import test from "node:test";
import assert from "node:assert/strict";
import { readTripHost } from "../dist/experience/lib/vacation/trip-details.js";

test("a missing host record throws, and repairing the lookup returns the real host name", () => {
  assert.throws(() => readTripHost({}, "woodrow-sparks"), TypeError);
  assert.equal(readTripHost({ "woodrow-sparks": { name: "Woody" } }, "woodrow-sparks"), "Woody");
});
