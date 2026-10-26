"use client";
import {useExperienceRuntime} from "../Runtime.js";

import { useState } from "react";
import { DatePicker, addDateDays } from "../../DatePicker.js";
import { GuestPicker } from "../../GuestPicker.js";
import { usePathname, useRouter } from "./TwigNavigation.js";
import { nightlyPrice, type Stay } from "../lib/vacation/catalog.js";
import { loginHref } from "../lib/vacation/account-links.js";
import { priceLabel, priceStay } from "../lib/vacation/pricing-policy.js";
import {
  todayAtStay,
  validateTrip,
  type TripSelection,
} from "../lib/vacation/trip-dates.js";
import { useBookingLab } from "./BookingLab.js";
import { useErrorTrackingLab } from "./ErrorTrackingLab.js";
import { Marker } from "./Playground.js";

import { useDemoAccount } from "./DemoAccount.js";


export function BookingForm({ stay }: { stay: Stay }) {
const {trackTwigEvent,trackTwigLabInteraction,captureErrorTrackingLabBooking,captureTwigBookingConfirmed}=useExperienceRuntime();

  const lab = useBookingLab();
  const errorLab = useErrorTrackingLab();
  const labEnabled = lab.active && !!lab.state.applied;
  const account = useDemoAccount();
  const pathname = usePathname();
  const router = useRouter();
  const { trip: selection, setTrip: setSelection } = lab;
  const existingBooking = account.ready && account.signedIn && selection.checkIn && selection.checkOut
    ? account.bookings.find((booking) => booking.status === "confirmed" && booking.stayId === stay.id && booking.checkIn === selection.checkIn && booking.checkOut === selection.checkOut)
    : undefined;
  const [today, setToday] = useState<string | null>(() => selection.checkIn ? todayAtStay() : null);
  const [touched, setTouched] = useState<
    Partial<Record<keyof TripSelection, boolean>>
  >({});
  const result = today
    ? validateTrip(selection, stay.capacity ?? 0, today)
    : null;
  const complete = result && Object.keys(result.errors).length === 0;
  const price = complete && result.nights !== null
    ? priceStay(
        result.nights,
        Math.round(stay.nightlyRate * 100)
      )
    : null;

  function change(field: keyof TripSelection, value: string) {
    lab.dispatch({ type: "invalidate" });
    setToday(todayAtStay());
    setSelection((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "checkIn" && previous.checkOut && previous.checkOut <= value ? { checkOut: "" } : {}),
    }));
  }
  function blur(field: keyof TripSelection) {
    setToday(todayAtStay());
    setTouched((previous) => ({ ...previous, [field]: true }));
  }
  function error(field: keyof TripSelection) {
    return touched[field] ? result?.errors[field] : undefined;
  }

  return (
    <section
      className={`vac-booking${(labEnabled && !lab.state.latest) || (errorLab.active && !errorLab.state.booking) ? " vac-lab-target" : ""}`}
      aria-labelledby="booking-title"
    >
      <div className="vac-row">
        <h2 id="booking-title">Your stay</h2>
        <Marker id="booking" />
        <Marker id="errors" />
      </div>
      <p className="vac-rate">
        <strong>{nightlyPrice(stay)}</strong> / night{" "}
        <span className="vac-muted">USD</span>
      </p>
      <p className="vac-muted">
        <strong>No extra fees.</strong> Charging you for the privilege of paying
        us felt a bit human.
      </p>
      <fieldset disabled={stay.capacity === null}>
        <legend>Trip details</legend>
        <label htmlFor="stay-check-in">Check in</label>
        <DatePicker
          id="stay-check-in"
          label="Check in"
          value={selection.checkIn}
          minDate={today ?? todayAtStay()}
          onChange={(value) => change("checkIn", value)}
          onClose={() => blur("checkIn")}
          invalid={!!error("checkIn")}
          describedBy={error("checkIn") ? "check-in-error" : undefined}
        />
        {error("checkIn") && (
          <p id="check-in-error" className="vac-field-error">
            {error("checkIn")}
          </p>
        )}
        <label htmlFor="stay-check-out">Check out</label>
        <DatePicker
          id="stay-check-out"
          label="Check out"
          value={selection.checkOut}
          minDate={selection.checkIn ? addDateDays(selection.checkIn, 1) : today ?? todayAtStay()}
          onChange={(value) => change("checkOut", value)}
          onClose={() => blur("checkOut")}
          invalid={!!error("checkOut")}
          describedBy={error("checkOut") ? "check-out-error" : undefined}
        />
        {error("checkOut") && (
          <p id="check-out-error" className="vac-field-error">
            {error("checkOut")}
          </p>
        )}
        <label htmlFor="stay-guests">Guests</label>
        <GuestPicker
          id="stay-guests"
          value={selection.guests}
          capacity={stay.capacity ?? 0}
          onChange={(value) => change("guests", value)}
          onClose={() => blur("guests")}
          invalid={!!error("guests")}
          describedBy={error("guests") ? "guests-error" : undefined}
        />
        {error("guests") && (
          <p id="guests-error" className="vac-field-error">
            {error("guests")}
          </p>
        )}
      </fieldset>
      <p className="vac-trip-summary" role="status">
        {complete
          ? `${result.nights} ${result.nights === 1 ? "night" : "nights"} · ${
              selection.guests
            } ${selection.guests === "1" ? "guest" : "guests"}`
          : ""}
      </p>
      {price && (
        <dl
          className="vac-price-breakdown"
          aria-live="polite"
          aria-label="Price breakdown"
        >
          {price.lines.map((line) => (
            <div key={line.label}>
              <dt>
                {line.label}
                <span>
                  {line.nights} {line.nights === 1 ? "night" : "nights"} ×{" "}
                  {priceLabel(line.nightlyCents)}
                </span>
              </dt>
              <dd>{priceLabel(line.totalCents)}</dd>
            </div>
          ))}
          <div className="vac-price-total">
            <dt>Estimated total</dt>
            <dd>{priceLabel(price.totalCents)}</dd>
          </div>
        </dl>
      )}
      <button
        type="button"
        className="vac-button vac-primary"
        disabled={
          !account.ready || !!existingBooking ||
          (labEnabled
            ? lab.state.runs.length >= 12 || !!lab.state.latest
            : (account.signedIn || errorLab.active) && !complete)
        }
        aria-describedby="booking-status"
        onClick={() => {
          if (!account.signedIn && !labEnabled && !errorLab.active) {
            trackTwigEvent(
              "twig_demo_login_prompted",
              {
                source: "booking"
              }
            );
            router.push(loginHref(pathname));
            return;
          }
          const checked = validateTrip(
            selection,
            stay.capacity ?? 0,
            todayAtStay()
          );
          setToday(todayAtStay());
          setTouched({ checkIn: true, checkOut: true, guests: true });
          if (Object.keys(checked.errors).length || !checked.nights) return;
          const quote = priceStay(
            checked.nights,
            Math.round(stay.nightlyRate * 100)
          );
          if (quote && lab.active && lab.state.applied) {
            trackTwigEvent(
              "twig_booking_simulation_submitted",
              {
                stay_id: stay.id,
                outcome: lab.state.outcome,
                completion_source: lab.state.applied,
              }
            );
            trackTwigLabInteraction(
              "booking",
              "booking_submitted",
              lab.state.outcome
            );
            lab.dispatch({
              type: "submit",
              facts: {
                stay_id: stay.id,
                nights: checked.nights,
                guests: Number(selection.guests),
                total_cents: quote.totalCents,
              },
            });
            if (account.signedIn && lab.state.outcome === "success") {
              account.book({
                id: crypto.randomUUID(),
                stayId: stay.id,
                checkIn: selection.checkIn,
                checkOut: selection.checkOut,
                guests: Number(selection.guests),
                status: "confirmed",
              }, "lab");
            }
          } else if (quote) {
            const booking = {
              id: crypto.randomUUID(),
              stayId: stay.id,
              checkIn: selection.checkIn,
              checkOut: selection.checkOut,
              guests: Number(selection.guests),
              status: "confirmed" as const,
            };
            const alreadyBooked = account.bookings.some((item) => item.status === "confirmed" && item.stayId === booking.stayId && item.checkIn === booking.checkIn && item.checkOut === booking.checkOut);
            const errorLabStayTitle = errorLab.active && !errorLab.state.booking ? stay.title ?? "stay" : undefined;
            account.confirmBooking(booking, errorLabStayTitle);
            if (!alreadyBooked) {
              captureTwigBookingConfirmed(stay.id);
              if (errorLabStayTitle) captureErrorTrackingLabBooking(stay.id);
            }
            router.push("/profile/bookings");
          }
        }}
      >
        {existingBooking
          ? "Stay booked"
          : labEnabled && lab.state.latest
            ? "Attempt finished"
            : !account.signedIn && !labEnabled && !errorLab.active
              ? "Log in to book"
            : "Book stay"}
      </button>
      <p id="booking-status" className="vac-muted" role="status">
        {existingBooking
          ? "This simulated reservation is saved in your profile."
          : labEnabled && lab.state.latest
          ? lab.state.latest.outcome === "success"
            ? "Booking confirmed in this simulation. No real reservation was made."
            : "The simulated booking request failed. No reservation was made."
          : labEnabled
            ? "Booking lab active. Dates and responses are simulated. No payment or reservation is created."
          : "Bookings are saved only in this browser. No payment or real reservation is created."}
      </p>
    </section>
  );
}
