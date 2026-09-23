export type TripSelection = {
  checkIn: string;
  checkOut: string;
  guests: string;
};
export type TripErrors = Partial<Record<keyof TripSelection, string>>;

const DAY_MS = 86_400_000;

/** Calendar dates are UTC day numbers, not instants in the guest's timezone. */
function calendarDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return null;
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp / DAY_MS;
}

export function todayAtStay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function validateTrip(
  selection: TripSelection,
  capacity: number,
  today: string
) {
  const errors: TripErrors = {};
  const start = calendarDay(selection.checkIn);
  const end = calendarDay(selection.checkOut);
  const current = calendarDay(today);
  if (current === null) throw new Error("A valid current date is required.");

  if (start === null) errors.checkIn = "Choose a valid check-in date.";
  else if (start < current) errors.checkIn = "Check-in can’t be in the past.";
  if (end === null) errors.checkOut = "Choose a valid check-out date.";
  else if (start !== null && end <= start)
    errors.checkOut = "Check-out must be after check-in.";
  const guests = Number(selection.guests);
  if (
    !/^\d+$/.test(selection.guests) ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > capacity
  ) {
    errors.guests = `Choose between 1 and ${capacity} guests.`;
  }

  return {
    errors,
    nights: start !== null && end !== null && end > start ? end - start : null,
  };
}
