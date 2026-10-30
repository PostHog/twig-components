/** One `$exception` event as the PostHog SDK built it, projected by the host to fixed fields. */
export type CapturedException = {
  id: number;
  /** Where `before_send` sent it: to PostHog, kept in this browser, or dropped as noise. */
  outcome: "sent" | "local" | "dropped";
  type: string;
  /** Only fixed engine and browser messages, like a `ResizeObserver loop` error. Never Twig's own error text. */
  value?: string;
  handled: boolean;
  mechanism: string;
  /** Function names, innermost first. */
  frames: string[];
  /** Each frame's bundle location as `path@line:col`, aligned with `frames`. */
  sources?: string[];
  fingerprint?: string;
  /** When the SDK built the event, as an ISO timestamp. */
  timestamp?: string;
  surface?: string;
  stayId?: string;
  distinctId?: string;
  sessionId?: string;
  host?: string;
};

export type ErrorTrackingState = {
  booking: { id: string; stayId: string; stayTitle: string } | null;
  occurrences: CapturedException[];
  /** Trip details catches the error and sends it with `captureException`. */
  caught: boolean;
  /** Trip details throws `HostNotFoundError` with a per-host fingerprint. */
  fingerprinted: boolean;
  /** Twig uploads source maps, so PostHog resolves the stack trace. */
  sourceMapped: boolean;
  /** Twig's `before_send` drops `ResizeObserver loop` errors. */
  noiseFiltered: boolean;
  /** Browser noise the lab raised before and after the filter. */
  noise: { unfiltered: number; dropped: number; capturedAt?: string[] };
  /** Trip details reads Twig's loaded host records. */
  repaired: boolean;
  verified: boolean;
  resolved: boolean;
  revision: number;
};

export const initialErrorTrackingState: ErrorTrackingState = {
  booking: null,
  occurrences: [],
  caught: false,
  fingerprinted: false,
  sourceMapped: false,
  noiseFiltered: false,
  noise: { unfiltered: 0, dropped: 0 },
  repaired: false,
  verified: false,
  resolved: false,
  revision: 0,
};

export function isErrorTrackingLabComplete(stage: number, state: ErrorTrackingState): boolean {
  return stage === 12 && state.resolved && state.verified;
}

export type ErrorTrackingAction =
  | { type: "book"; booking: { id: string; stayId: string; stayTitle: string } }
  | { type: "capture"; exception: Omit<CapturedException, "id"> }
  | { type: "catch" }
  | { type: "fingerprint" }
  | { type: "upload-source-maps" }
  | { type: "noise"; at?: string }
  | { type: "filter-noise" }
  | { type: "repair" }
  | { type: "verify" }
  | { type: "resolve" }
  | { type: "reset" };

/** The latest occurrence that matches, newest first. */
export function latestOccurrence(state: ErrorTrackingState, match: (occurrence: CapturedException) => boolean = () => true) {
  return [...state.occurrences].reverse().find(match);
}

export function errorTrackingReducer(
  state: ErrorTrackingState,
  action: ErrorTrackingAction
): ErrorTrackingState {
  switch (action.type) {
    case "book":
      return state.booking ? state : { ...state, booking: action.booking };
    case "capture":
      // Browser noise is counted through `noise`, from the browser's own error events.
      if (action.exception.outcome === "dropped") return state;
      if (!state.booking || state.repaired || state.occurrences.length >= 50) return state;
      return { ...state, occurrences: [...state.occurrences, { ...action.exception, id: state.occurrences.length + 1 }] };
    case "catch":
      return state.occurrences.some((occurrence) => !occurrence.handled) ? { ...state, caught: true } : state;
    case "upload-source-maps":
      return state.caught ? { ...state, sourceMapped: true } : state;
    case "fingerprint":
      return state.sourceMapped ? { ...state, fingerprinted: true } : state;
    case "noise": {
      if (!state.booking) return state;
      const noise = state.noiseFiltered
        ? { ...state.noise, dropped: state.noise.dropped + 1 }
        : { ...state.noise, unfiltered: state.noise.unfiltered + 1, capturedAt: [...(state.noise.capturedAt ?? []), action.at ?? ""].slice(-50) };
      return { ...state, noise };
    }
    case "filter-noise":
      return state.noise.unfiltered > 0 ? { ...state, noiseFiltered: true } : state;
    case "repair":
      return state.fingerprinted ? { ...state, repaired: true } : state;
    case "verify":
      return state.repaired ? { ...state, verified: true } : state;
    case "resolve":
      return state.verified ? { ...state, resolved: true } : state;
    case "reset":
      return { ...initialErrorTrackingState, revision: state.revision + 1 };
  }
}
