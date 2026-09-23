export type LabConfig = {
  eventName: string;
  source: "clicked" | "fixed";
  fixedValue: string;
};
export type LabEvent = {
  id: number;
  event: string;
  clicked: string;
  properties: { destination_type: string };
};
export type LabState = {
  config: LabConfig;
  applied: LabConfig | null;
  step: number;
  selecting: boolean;
  selected: boolean;
  events: LabEvent[];
  before: LabEvent[];
};
export const initialLabState: LabState = {
  config: { eventName: "", source: "fixed", fixedValue: "Forest" },
  applied: null,
  step: 0,
  selecting: false,
  selected: false,
  events: [],
  before: [],
};
export type LabAction =
  | { type: "example" }
  | { type: "repair" }
  | { type: "select" }
  | { type: "cancel" }
  | { type: "target" }
  | { type: "edit"; config: Partial<LabConfig> }
  | { type: "step"; step: number }
  | { type: "apply" }
  | { type: "filter"; setting: string }
  | { type: "clear" }
  | { type: "reset" };
export function validEventName(name: string) {
  return /^[a-z][a-z0-9_]{0,63}$/.test(name);
}
export function filterLabReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case "example": {
      const config: LabConfig = {
        eventName: "stay_filter_selected",
        source: "fixed",
        fixedValue: "Forest",
      };
      return {
        ...initialLabState,
        config,
        applied: { ...config },
        selected: true,
        step: 3,
      };
    }
    case "repair":
      return {
        ...state,
        before:
          state.applied?.source === "fixed" && state.events.length
            ? [...state.events]
            : state.before,
        applied: null,
        events: [],
        step: 2,
      };
    case "reset":
      return initialLabState;
    case "clear":
      return { ...state, events: [] };
    case "select":
      return { ...state, selecting: true };
    case "cancel":
      return { ...state, selecting: false };
    case "target":
      return state.selecting
        ? {
            ...state,
            selected: true,
            selecting: false,
            step: 1,
            applied: null,
            events: [],
          }
        : state;
    case "edit":
      return {
        ...state,
        config: { ...state.config, ...action.config },
        applied: null,
        events: [],
      };
    case "step":
      return { ...state, step: action.step, selecting: false };
    case "apply":
      return state.selected &&
        validEventName(state.config.eventName) &&
        (state.config.source === "clicked" || state.config.fixedValue.trim())
        ? { ...state, applied: { ...state.config }, events: [], step: 3 }
        : state;
    case "filter":
      return !state.applied || state.events.length >= 20
        ? state
        : {
            ...state,
            events: [
              ...state.events,
              {
                id: state.events.length + 1,
                event: state.applied.eventName,
                clicked: action.setting,
                properties: {
                  destination_type:
                    state.applied.source === "clicked"
                      ? action.setting
                      : state.applied.fixedValue,
                },
              },
            ],
          };
  }
}
export function labPassed(state: LabState) {
  return (
    ["Forest", "Coast"].every((setting) =>
      state.events.some(
        (event) =>
          event.clicked === setting &&
          event.properties.destination_type === setting
      )
    ) &&
    state.events.every(
      (event) => event.clicked === event.properties.destination_type
    )
  );
}
export function latestFilterFeedback(state: LabState) {
  const latest = state.events.at(-1);
  if (!latest) return null;
  const recorded = latest.properties.destination_type;
  if (latest.clicked !== recorded) {
    return `You clicked ${latest.clicked}, but recorded ${recorded}. A fixed value stays the same for every click. Change the property source, apply, and test again.`;
  }
  if (state.applied?.source === "fixed") {
    const other = latest.clicked === "Coast" ? "Forest" : "Coast";
    return `Correct for this click: ${latest.clicked} recorded ${recorded}. But clicking ${other} would also record ${recorded}, because the value is fixed. Use the clicked filter’s value to handle both.`;
  }
  return `Correct: ${latest.clicked} recorded ${recorded}. The property follows the filter you clicked.`;
}
export function filterLabCode(config: LabConfig) {
  return `// Inside the filter's click handler\nposthog.capture(${JSON.stringify(
    config.eventName || "your_event_name"
  )}, {\n  destination_type: ${
    config.source === "clicked"
      ? "selectedDestinationType"
      : JSON.stringify(config.fixedValue)
  },\n});`;
}

export function summarizeFilterEvents(events: readonly LabEvent[]) {
  const rows = new Map<
    string,
    { setting: string; actual: number; recorded: number }
  >();
  const row = (setting: string) => {
    if (!rows.has(setting))
      rows.set(setting, { setting, actual: 0, recorded: 0 });
    return rows.get(setting)!;
  };
  for (const event of events) {
    row(event.clicked).actual++;
    row(event.properties.destination_type).recorded++;
  }
  return {
    rows: [...rows.values()],
    mismatches: events.filter(
      (event) => event.clicked !== event.properties.destination_type
    ).length,
  };
}
