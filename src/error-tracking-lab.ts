export type ErrorOccurrence = {
  id: number;
  type: "TypeError";
  message: string;
  stayId: string;
  fingerprint: string;
};

export type ErrorTrackingState = {
  booking: { id: string; stayId: string; stayTitle: string } | null;
  occurrences: ErrorOccurrence[];
  fixed: boolean;
  successfulRetry: boolean;
  hostLookupRepaired: boolean;
  hostVerified: boolean;
  verifiedLoads: number;
  issueReviewed: boolean;
  resolved: boolean;
  revision: number;
};

export const tripDetailsFingerprint = "twig-trip-host-name";
export const initialErrorTrackingState: ErrorTrackingState = {
  booking: null,
  occurrences: [],
  fixed: false,
  successfulRetry: false,
  hostLookupRepaired: false,
  hostVerified: false,
  verifiedLoads: 0,
  issueReviewed: false,
  resolved: false,
  revision: 0,
};

export function isErrorTrackingLabComplete(stage: number, state: ErrorTrackingState): boolean {
  return stage === 10 && state.resolved && state.hostVerified && state.verifiedLoads >= 1;
}

export type ErrorTrackingAction =
  | { type: "book"; booking: { id: string; stayId: string; stayTitle: string } }
  | { type: "capture"; message: string; stayId: string }
  | { type: "fix" }
  | { type: "retry-success" }
  | { type: "repair-host-lookup" }
  | { type: "verify-host" }
  | { type: "review-issue" }
  | { type: "resolve" }
  | { type: "reset" };

export function errorTrackingReducer(
  state: ErrorTrackingState,
  action: ErrorTrackingAction
): ErrorTrackingState {
  switch (action.type) {
    case "book":
      return state.booking ? state : { ...state, booking: action.booking };
    case "capture":
      if (!state.booking || action.stayId !== state.booking.stayId || state.fixed || state.occurrences.length >= 50) return state;
      return {
        ...state,
        occurrences: [
          ...state.occurrences,
          {
            id: state.occurrences.length + 1,
            type: "TypeError",
            message: action.message,
            stayId: action.stayId,
            fingerprint: tripDetailsFingerprint,
          },
        ],
      };
    case "fix":
      return state.occurrences.length >= 2 ? { ...state, fixed: true } : state;
    case "retry-success":
      return state.fixed ? { ...state, successfulRetry: true } : state;
    case "repair-host-lookup":
      return state.successfulRetry ? { ...state, hostLookupRepaired: true } : state;
    case "verify-host":
      return state.hostLookupRepaired ? { ...state, hostVerified: true, verifiedLoads: Math.min(state.verifiedLoads + 1, 10) } : state;
    case "review-issue":
      return state.verifiedLoads >= 2 ? { ...state, issueReviewed: true } : state;
    case "resolve":
      return state.hostVerified && state.verifiedLoads >= 1 ? { ...state, resolved: true } : state;
    case "reset":
      return { ...initialErrorTrackingState, revision: state.revision + 1 };
  }
}
