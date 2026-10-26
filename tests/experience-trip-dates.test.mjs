import assert from "node:assert/strict";
import test from "node:test";
import { todayAtStay, validateTrip } from "../dist/experience/lib/vacation/trip-dates.js";

const selection = {
  checkIn: "2027-03-13",
  checkOut: "2027-03-15",
  guests: "4",
};

test("counts calendar nights across the New York spring clock change", () => {
  assert.deepEqual(validateTrip(selection, 4, "2027-03-01"), {
    errors: {},
    nights: 2,
  });
});
test("counts calendar nights across the autumn clock change", () => {
  assert.equal(
    validateTrip(
      { ...selection, checkIn: "2027-11-06", checkOut: "2027-11-08" },
      4,
      "2027-03-01"
    ).nights,
    2
  );
});
test("rejects nonexistent calendar dates, but accepts leap day", () => {
  assert.ok(
    validateTrip({ ...selection, checkIn: "2027-02-29" }, 4, "2027-01-01")
      .errors.checkIn
  );
  assert.deepEqual(
    validateTrip(
      { ...selection, checkIn: "2028-02-29", checkOut: "2028-03-01" },
      4,
      "2028-01-01"
    ),
    { errors: {}, nights: 1 }
  );
});
test("rejects past check-in and same-day or reversed checkout", () => {
  assert.ok(validateTrip(selection, 4, "2027-03-14").errors.checkIn);
  for (const checkOut of ["2027-03-13", "2027-03-12"]) {
    const result = validateTrip({ ...selection, checkOut }, 4, "2027-03-01");
    assert.ok(result.errors.checkOut);
    assert.equal(result.nights, null);
  }
});
test("enforces whole guest counts within capacity", () => {
  for (const guests of ["", "0", "5", "-1", "1.5", "1e0", "a"]) {
    assert.ok(
      validateTrip({ ...selection, guests }, 4, "2027-03-01").errors.guests
    );
  }
});
test("uses the stay’s New York calendar day, not UTC", () => {
  assert.equal(todayAtStay(new Date("2027-03-14T03:30:00Z")), "2027-03-13");
  assert.equal(todayAtStay(new Date("2027-03-14T07:30:00Z")), "2027-03-14");
});
test("reports each missing field separately", () => {
  assert.deepEqual(
    Object.keys(
      validateTrip({ checkIn: "", checkOut: "", guests: "" }, 4, "2027-03-01")
        .errors
    ),
    ["checkIn", "checkOut", "guests"]
  );
});
