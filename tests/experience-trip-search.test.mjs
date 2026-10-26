import test from "node:test";
import assert from "node:assert/strict";
import { searchTripStays, validateTripSearch } from "../dist/experience/lib/vacation/trip-search.js";

const selection = { destination: "", checkIn: "", checkOut: "", guests: "1" };

test("trip search combines destination, setting, and real guest capacity", () => {
  assert.equal(searchTripStays("All", selection).length, 3);
  assert.deepEqual(searchTripStays("All", { ...selection, guests: "5" }).map(stay => stay.id), ["stay-02"]);
  assert.deepEqual(searchTripStays("All", { ...selection, destination: " PARIS " }).map(stay => stay.id), ["stay-03"]);
  assert.equal(searchTripStays("Forest", { ...selection, destination: "Paris" }).length, 0);
  assert.equal(searchTripStays("All", { ...selection, destination: "Paris", guests: "3" }).length, 0);
});

test("amenities refine destination and capacity without conflating place and setting", () => {
  assert.deepEqual(searchTripStays("All", selection, ["fire-pit", "lake-access"]).map(stay => stay.id), ["stay-01"]);
  assert.deepEqual(searchTripStays("All", selection, ["beach-access"]).map(stay => stay.id), ["stay-02"]);
  assert.equal(searchTripStays("All", { ...selection, destination: "Paris" }, ["lake-access"]).length, 0);
  assert.equal(searchTripStays("All", { ...selection, guests: "5" }, ["fire-pit"]).length, 0);
});

test("flexible dates are optional, but partial, past, or reversed dates are rejected", () => {
  assert.deepEqual(validateTripSearch(selection, 5, "2026-10-20"), {});
  assert.ok(validateTripSearch({ ...selection, checkIn: "2026-10-21" }, 5, "2026-10-20").checkOut);
  assert.ok(validateTripSearch({ ...selection, checkIn: "2026-10-19", checkOut: "2026-10-22" }, 5, "2026-10-20").checkIn);
  assert.ok(validateTripSearch({ ...selection, checkIn: "2026-10-22", checkOut: "2026-10-21" }, 5, "2026-10-20").checkOut);
  assert.deepEqual(validateTripSearch({ ...selection, checkIn: "2026-10-21", checkOut: "2026-10-23" }, 5, "2026-10-20"), {});
  assert.ok(validateTripSearch({ ...selection, guests: "6" }, 5, "2026-10-20").guests);
});

test('AI budgets also constrain conventional search', () => {
  const selection = { destination: '', guests: '1', checkIn: '2027-01-01', checkOut: '2027-01-04' };
  assert.deepEqual(searchTripStays('All', selection, [], { amount: 700, basis: 'trip' }).map(stay => stay.id), ['stay-03']);
  assert.equal(searchTripStays('All', selection, [], { amount: 100, basis: 'night' }).length, 0);
});
