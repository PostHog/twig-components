import assert from "node:assert/strict";
import { test } from "node:test";
import { addDateDays } from "../dist/DatePicker.js";

test("calendar dates cross month and leap-year boundaries without timezone shifts", () => {
  assert.equal(addDateDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDateDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDateDays("2028-03-01", -1), "2028-02-29");
});
