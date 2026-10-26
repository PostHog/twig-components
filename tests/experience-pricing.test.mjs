import test from "node:test";
import assert from "node:assert/strict";
import { priceStay } from "../dist/experience/lib/vacation/pricing-policy.js";
import { validateTrip } from "../dist/experience/lib/vacation/trip-dates.js";

const quote = (start, end) => {
  const { errors, nights } = validateTrip(
    { checkIn: start, checkOut: end, guests: "1" },
    1,
    "2027-01-01"
  );
  if (Object.keys(errors).length || nights === null)
    throw new Error("Invalid trip");
  return priceStay(nights, 35500);
};

test("charges the same nightly rate throughout the year, excluding checkout", () => {
  for (const [start, end, expected] of [
    ["2027-06-30", "2027-07-01", 35500],
    ["2027-07-01", "2027-07-02", 35500],
    ["2027-08-31", "2027-09-01", 35500],
    ["2027-09-01", "2027-09-02", 35500],
    ["2027-09-14", "2027-09-15", 35500],
    ["2027-09-15", "2027-09-16", 35500],
    ["2027-10-15", "2027-10-16", 35500],
    ["2027-10-16", "2027-10-17", 35500],
  ])
    assert.equal(quote(start, end).totalCents, expected, start);
});
test("uses one rate for the whole trip without adding fees", () => {
  const result = quote("2027-08-30", "2027-09-03");
  assert.equal(result.totalCents, 142000);
  assert.deepEqual(
    result.lines.map((line) => line.nights),
    [4]
  );
});
test("handles leap day, clock changes, and year rollover", () => {
  assert.equal(quote("2028-02-28", "2028-03-01").totalCents, 71000);
  assert.equal(quote("2027-03-13", "2027-03-15").totalCents, 71000);
  assert.equal(quote("2027-12-31", "2028-01-02").totalCents, 71000);
});
test("keeps the same rate in later years", () => {
  assert.equal(quote("2028-07-01", "2028-07-03").totalCents, 71000);
});
test("rejects impossible dates and non-positive trips", () => {
  for (const [start, end] of [
    ["2027-02-29", "2027-03-02"],
    ["2027-07-01", "2027-07-01"],
    ["2027-07-02", "2027-07-01"],
  ]) {
    assert.throws(() => quote(start, end));
  }
});
test("requires a positive whole number of validated nights", () => {
  for (const nights of [0, -1, 1.5, Number.NaN])
    assert.throws(() => priceStay(nights, 35500));
});
