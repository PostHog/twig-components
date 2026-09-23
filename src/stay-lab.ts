export type StayView = {
  actualStayId: string;
  actualTitle: string;
  event: "stay_viewed";
  properties: { stay_id?: string };
};
export type StayLabState = {
  applied: "anonymous" | "identified" | null;
  running: boolean;
  events: StayView[];
  before: StayView[];
  revision: number;
};
export const initialStayLab: StayLabState = {
  applied: null,
  running: false,
  events: [],
  before: [],
  revision: 0,
};
export type StayLabAction =
  | { type: "reset" }
  | { type: "pause" }
  | { type: "apply"; identified: boolean }
  | { type: "repair" }
  | { type: "view"; id: string; title: string };
export function stayLabReducer(
  state: StayLabState,
  action: StayLabAction
): StayLabState {
  switch (action.type) {
    case "reset":
      return { ...initialStayLab, revision: state.revision + 1 };
    case "pause":
      return { ...state, running: false };
    case "apply":
      return {
        ...state,
        applied: action.identified ? "identified" : "anonymous",
        running: true,
        events: [],
      };
    case "repair":
      return {
        ...state,
        before: state.events,
        events: [],
        applied: null,
        running: false,
      };
    case "view":
      return !state.running ||
        !state.applied ||
        !action.id ||
        state.events.length >= 20
        ? state
        : {
            ...state,
            events: [
              ...state.events,
              {
                actualStayId: action.id,
                actualTitle: action.title,
                event: "stay_viewed",
                properties:
                  state.applied === "identified" ? { stay_id: action.id } : {},
              },
            ],
          };
  }
}
export function stayCode(identified: boolean) {
  return identified
    ? 'posthog.capture("stay_viewed", {\n  stay_id: stay.id\n});'
    : 'posthog.capture("stay_viewed");';
}
