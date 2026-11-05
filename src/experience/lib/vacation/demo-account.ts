import type { AccountSettingsValue } from "../../../Account.js";
import { errorTrackingReducer, initialErrorTrackingState, type CapturedException, type ErrorTrackingAction, type ErrorTrackingState } from "../../../error-tracking-lab.js";

export const demoAccountStorageKey = "twig:demo-account:v2";
export const demoLoginEmail = "edgar.hogg@fakeemail.com";
export const demoTravelerProfile = {
  displayName: "Edgar Hogg",
  email: demoLoginEmail,
  homeTown: "London",
  bio: "Hi, I'm Edgar! I love long walks on the beach with my family in 3:4 formation and I have collection of rubber ducks from my many trips across Europe.",
} as const;

export type DemoBooking = {
  id: string;
  stayId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "confirmed" | "canceled";
};

export type ErrorTrackingSession = { state: ErrorTrackingState; stage: number };

export type DemoAccountState = {
  version: 1;
  signedIn: boolean;
  savedStayIds: string[];
  bookings: DemoBooking[];
  errorTracking: ErrorTrackingSession;
  settings: AccountSettingsValue;
};

export const initialDemoAccountState: DemoAccountState = {
  version: 1,
  signedIn: false,
  savedStayIds: [],
  bookings: [],
  errorTracking: { state: initialErrorTrackingState, stage: 0 },
  settings: {
    displayName: demoTravelerProfile.displayName,
    email: demoTravelerProfile.email,
    tripReminders: true,
    productUpdates: false,
  },
};

export type DemoAccountAction =
  | { type: "hydrate"; state: DemoAccountState }
  | { type: "login" }
  | { type: "confirm-booking"; booking: DemoBooking; errorLabStayTitle?: string }
  | { type: "logout" }
  | { type: "toggle-saved"; stayId: string }
  | { type: "book"; booking: DemoBooking }
  | { type: "cancel-booking"; bookingId: string }
  | { type: "error-tracking-action"; action: ErrorTrackingAction }
  | { type: "error-tracking-stage"; stage: number }
  | { type: "update-settings"; settings: AccountSettingsValue };

export function demoAccountReducer(
  state: DemoAccountState,
  action: DemoAccountAction
): DemoAccountState {
  if (action.type === "hydrate") return action.state;
  if (action.type === "login") return { ...state, signedIn: true };
  if (action.type === "confirm-booking") {
    const existing = state.bookings.find((booking) => booking.status === "confirmed" && booking.stayId === action.booking.stayId && booking.checkIn === action.booking.checkIn && booking.checkOut === action.booking.checkOut);
    const booking = existing ?? action.booking;
    const errorTracking = !existing && action.errorLabStayTitle && state.errorTracking.stage === 1 && !state.errorTracking.state.booking
      ? {
          state: errorTrackingReducer(state.errorTracking.state, { type: "book", booking: { id: booking.id, stayId: booking.stayId, stayTitle: action.errorLabStayTitle } }),
          stage: 2,
        }
      : state.errorTracking;
    return {
      ...state,
      signedIn: true,
      bookings: existing ? state.bookings : [booking, ...state.bookings],
      errorTracking,
    };
  }
  if (action.type === "logout") return { ...state, signedIn: false };
  if (action.type === "update-settings") {
    if (!state.signedIn) return state;
    return {
      ...state,
      settings: {
        ...action.settings,
        displayName: demoTravelerProfile.displayName,
        email: demoTravelerProfile.email,
      },
    };
  }
  if (action.type === "toggle-saved") {
    if (!state.signedIn || !action.stayId) return state;
    const savedStayIds = state.savedStayIds.includes(action.stayId)
      ? state.savedStayIds.filter((id) => id !== action.stayId)
      : [...state.savedStayIds, action.stayId];
    return { ...state, savedStayIds };
  }
  if (action.type === "error-tracking-action") {
    if (action.action.type === "capture" && state.errorTracking.stage < 2) return state;
    const labState = errorTrackingReducer(state.errorTracking.state, action.action);
    const firstFailure = action.action.type === "capture"
      && state.errorTracking.stage === 2
      && action.action.exception.outcome !== "dropped"
      && labState.occurrences.length > state.errorTracking.state.occurrences.length;
    return { ...state, errorTracking: { state: labState, stage: firstFailure ? 3 : state.errorTracking.stage } };
  }
  if (action.type === "error-tracking-stage") {
    return { ...state, errorTracking: { ...state.errorTracking, stage: Math.max(0, Math.min(12, action.stage)) } };
  }
  if (action.type === "cancel-booking") {
    if (!state.signedIn || !state.bookings.some((booking) => booking.id === action.bookingId && booking.status === "confirmed")) return state;
    const bookings = state.bookings.map((booking) => booking.id === action.bookingId ? { ...booking, status: "canceled" as const } : booking);
    const linked = state.errorTracking.state.booking?.id === action.bookingId;
    return {
      ...state,
      bookings,
      errorTracking: linked ? {
        state: errorTrackingReducer(state.errorTracking.state, { type: "reset" }),
        stage: 1,
      } : state.errorTracking,
    };
  }
  if (!state.signedIn || !action.booking.stayId) return state;
  const bookings = [
    action.booking,
    ...state.bookings.filter((booking) => booking.id !== action.booking.id),
  ];
  return { ...state, bookings };
}

export function parseDemoAccountState(value: string | null): DemoAccountState {
  if (!value) return initialDemoAccountState;
  try {
    const parsed = JSON.parse(value) as Partial<DemoAccountState>;
    if (parsed.version !== 1) return initialDemoAccountState;
    const settings = parsed.settings;
    const bookings = Array.isArray(parsed.bookings)
      ? parsed.bookings.filter(isDemoBooking).map((booking) => ({ ...booking, status: booking.status === "canceled" ? "canceled" as const : "confirmed" as const }))
      : [];
    const storedSession = parsed.errorTracking;
    const parsedLabState = isErrorTrackingState(storedSession?.state) ? storedSession.state : null;
    const storedLabState = parsedLabState ? { ...initialErrorTrackingState, ...parsedLabState } : initialErrorTrackingState;
    // State from an older lab version starts over, stage included.
    const storedStage = parsedLabState && Number.isInteger(storedSession?.stage) ? Math.max(0, Math.min(12, storedSession!.stage)) : 0;
    const resumedStage = storedStage === 2 && storedLabState.occurrences.length > 0 ? 3 : storedStage;
    const linkedBooking = bookings.find((booking) => booking.id === storedLabState.booking?.id && booking.status === "confirmed");
    const errorTracking: ErrorTrackingSession = storedLabState.booking && !linkedBooking
      ? { state: errorTrackingReducer(storedLabState, { type: "reset" }), stage: 1 }
      : { state: storedLabState, stage: resumedStage };
    return {
      version: 1,
      signedIn: parsed.signedIn === true,
      savedStayIds: Array.isArray(parsed.savedStayIds)
        ? [...new Set(parsed.savedStayIds.filter((id): id is string => typeof id === "string" && !!id))]
        : [],
      bookings,
      errorTracking,
      settings: {
        displayName: demoTravelerProfile.displayName,
        email: demoTravelerProfile.email,
        tripReminders: settings?.tripReminders !== false,
        productUpdates: settings?.productUpdates === true,
      },
    };
  } catch {
    return initialDemoAccountState;
  }
}

function isDemoBooking(value: unknown): value is DemoBooking {
  if (!value || typeof value !== "object") return false;
  const booking = value as Partial<DemoBooking>;
  return (
    typeof booking.id === "string" &&
    typeof booking.stayId === "string" &&
    typeof booking.checkIn === "string" &&
    typeof booking.checkOut === "string" &&
    typeof booking.guests === "number" &&
    Number.isInteger(booking.guests) &&
    booking.guests > 0
  );
}

function isErrorTrackingState(value: unknown): value is ErrorTrackingState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ErrorTrackingState>;
  return (
    (state.booking === null || (typeof state.booking?.id === "string" && typeof state.booking?.stayId === "string" && typeof state.booking?.stayTitle === "string")) &&
    Array.isArray(state.occurrences) && state.occurrences.every(isCapturedException) &&
    typeof state.caught === "boolean" && typeof state.fingerprinted === "boolean" && typeof state.repaired === "boolean" &&
    // Fields added after a lab started are optional. Parsing fills them from the initial state.
    (state.sourceMapped === undefined || typeof state.sourceMapped === "boolean") &&
    (state.noiseFiltered === undefined || typeof state.noiseFiltered === "boolean") &&
    (state.noise === undefined || (Number.isInteger(state.noise.unfiltered) && Number.isInteger(state.noise.dropped))) &&
    typeof state.verified === "boolean" && typeof state.resolved === "boolean" && Number.isInteger(state.revision)
  );
}

function isCapturedException(value: unknown): value is CapturedException {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CapturedException>;
  return (
    (item.outcome === "sent" || item.outcome === "local" || item.outcome === "dropped") &&
    typeof item.type === "string" && typeof item.handled === "boolean" && typeof item.mechanism === "string" &&
    Array.isArray(item.frames) && item.frames.every((frame) => typeof frame === "string")
  );
}
