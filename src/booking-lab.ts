export type CompletionSource = "click" | "confirmation";
export type BookingOutcome = "failure" | "success";
export type BookingFacts = {
  stay_id: string;
  nights: number;
  guests: number;
  total_cents: number;
};
export type BookingEvent = {
  event: "availability_checked" | "booking_started" | "booking_completed";
  properties: BookingFacts & { request_id: string };
};
export type BookingRun = {
  id: string;
  source: CompletionSource;
  outcome: BookingOutcome;
  events: BookingEvent[];
};
export type BookingState = {
  lesson: BookingOutcome;
  applied: CompletionSource | null;
  outcome: BookingOutcome;
  available: BookingFacts | null;
  availabilityEvent: BookingEvent | null;
  revision: number;
  runs: BookingRun[];
  latest: BookingRun | null;
  nextId: number;
};
export const initialBookingState: BookingState = {
  lesson: "success",
  applied: null,
  outcome: "failure",
  available: null,
  availabilityEvent: null,
  revision: 0,
  runs: [],
  latest: null,
  nextId: 1,
};
export type BookingAction =
  | { type: "begin-failure" }
  | { type: "reset" }
  | { type: "apply"; source: CompletionSource; outcome: BookingOutcome }
  | { type: "invalidate" }
  | { type: "availability"; facts: BookingFacts }
  | { type: "book" }
  | { type: "submit"; facts: BookingFacts };
export function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case "begin-failure":
      return state.lesson === "success" &&
        state.latest?.outcome === "success" &&
        state.latest.source === "confirmation"
        ? {
            ...state,
            lesson: "failure",
            applied: null,
            outcome: "failure",
            available: null,
            availabilityEvent: null,
            latest: null,
          }
        : state;
    case "submit": {
      if (state.latest) return state;
      const checked = bookingReducer(state, {
        type: "availability",
        facts: action.facts,
      });
      return checked === state
        ? state
        : bookingReducer(checked, { type: "book" });
    }
    case "reset":
      return { ...initialBookingState, revision: state.revision + 1 };
    case "apply":
      return {
        ...state,
        applied: action.source,
        outcome: action.outcome,
        available: null,
        availabilityEvent: null,
        latest: null,
      };
    case "invalidate":
      return {
        ...state,
        available: null,
        availabilityEvent: null,
        latest: null,
      };
    case "availability": {
      const f = action.facts;
      if (
        !state.applied ||
        state.runs.length >= 12 ||
        !f.stay_id ||
        !Number.isInteger(f.nights) ||
        f.nights < 1 ||
        !Number.isInteger(f.guests) ||
        f.guests < 1 ||
        !Number.isSafeInteger(f.total_cents) ||
        f.total_cents <= 0
      )
        return state;
      return {
        ...state,
        available: { ...f },
        availabilityEvent: {
          event: "availability_checked",
          properties: { ...f, request_id: `booking-${state.nextId}` },
        },
        latest: null,
      };
    }
    case "book": {
      if (
        !state.applied ||
        !state.available ||
        !state.availabilityEvent ||
        state.latest ||
        state.runs.length >= 12
      )
        return state;
      const id = `booking-${state.nextId}`;
      const properties = { ...state.available, request_id: id };
      const events: BookingEvent[] = [
        state.availabilityEvent,
        { event: "booking_started", properties },
      ];
      if (state.applied === "click" || state.outcome === "success")
        events.push({ event: "booking_completed", properties });
      const run: BookingRun = {
        id,
        source: state.applied,
        outcome: state.outcome,
        events,
      };
      return {
        ...state,
        available: null,
        availabilityEvent: null,
        latest: run,
        runs: [...state.runs, run],
        nextId: state.nextId + 1,
      };
    }
  }
}
export function bookingCode(source: CompletionSource) {
  const started = `posthog.capture(
  "booking_started",
  properties
);`;
  return source === "click"
    ? `${started}

posthog.capture(
  "booking_completed",
  properties
);

const result = await bookStay();`
    : `${started}

const result = await bookStay();
if (result.confirmed) {
  posthog.capture(
    "booking_completed",
    properties
  );
}`;
}
