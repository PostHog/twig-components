import { filterStays } from "../../../catalog.js";
import { validateTrip, type TripErrors } from "../../../trip-dates.js";
import { matchesStayAmenities, type StayAmenity, type StaySetting } from "../../../StayFilters.js";

export type TripSearchSelection = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};

export function searchTripStays(setting: StaySetting, selection: TripSearchSelection, amenities: readonly StayAmenity[] = [], budget?: { amount: number; basis: "night" | "trip" }) {
  const nights = (Date.parse(selection.checkOut) - Date.parse(selection.checkIn)) / 86400000;
  return filterStays(setting, selection.destination.trim()).filter(
    stay => stay.capacity !== null && stay.capacity >= Number(selection.guests || "1") && matchesStayAmenities(stay.amenities, amenities) && (!budget || (budget.basis === "night" ? stay.nightlyRate <= budget.amount : Number.isInteger(nights) && nights > 0 && stay.nightlyRate * nights <= budget.amount))
  );
}

/** Dates prepare the booking form; this demo has no availability inventory. */
export function validateTripSearch(selection: TripSearchSelection, capacity: number, today: string): TripErrors {
  const errors = validateTrip({ ...selection, guests: selection.guests || "1" }, capacity, today).errors;
  if (!selection.checkIn && !selection.checkOut) {
    delete errors.checkIn;
    delete errors.checkOut;
  }
  return errors;
}
