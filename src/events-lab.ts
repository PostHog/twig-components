export type LabPath = "web" | "mcp";
export type TeachingEvent = {
  id: string;
  /** Local Twig observation, separate from the selected captured fields. */
  clickedElement?: string;
  timestamp: string;
  event: string;
  properties: Record<string, string | number | boolean>;
};
export type EventsState = {
  path: LabPath;
  step: number;
  revision: number;
  events: TeachingEvent[];
  inspected: string | null;
  answered: boolean;
  configured: number[];
};
export const initialEventsState: EventsState = {
  path: "web", step: 0, revision: 0, events: [], inspected: null, answered: false, configured: [],
};
export type EventsAction =
  | { type: "path"; path: LabPath }
  | { type: "configure" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "reset" }
  | { type: "click"; setting: string; count: number; timestamp: string }
  | { type: "inspect"; id: string }
  | { type: "answer"; correct: boolean };
export function currentEvents(state: EventsState) {
  return state.events.filter(event => event.id.startsWith(`${state.revision}-${Math.min(state.step, 4)}-`));
}
export function needsConfiguration(state: EventsState) {
  return state.step >= 2 && state.step <= 4 && !state.configured.includes(state.step);
}
export function canContinue(state: EventsState) {
  const events = currentEvents(state);
  if (state.step === 5) return state.answered && events.length > 0;
  if (state.step < 1 || state.step > 4 || needsConfiguration(state) || !events.length || state.inspected !== events.at(-1)?.id) return false;
  return state.step !== 3 || new Set(events.map(event => event.properties.destination_type)).size >= 2;
}
/** A previous step needs a fresh reply even when its old turn is still visible. */
export function hasCurrentAgentReply(state: EventsState, repliedEventIds: readonly (string | undefined)[]) {
  const latestId = currentEvents(state).at(-1)?.id;
  return !!latestId
    && (state.step === 5 ? state.answered : state.inspected === latestId)
    && repliedEventIds.includes(latestId);
}
export function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case "path": return { ...state, path: action.path, step: state.step === 0 ? 1 : state.step };
    case "configure": return needsConfiguration(state) ? { ...state, configured: [...state.configured, state.step] } : state;
    case "reset": return { ...initialEventsState, revision: state.revision + 1 };
    case "previous": return { ...state, step: Math.max(0, state.step - 1), inspected: null, answered: false };
    case "next": return canContinue(state) ? { ...state, step: state.step + 1, inspected: null, answered: false } : state;
    case "answer": return state.step === 5 ? { ...state, answered: action.correct } : state;
    case "inspect": return currentEvents(state).some(event => event.id === action.id) ? { ...state, inspected: action.id } : state;
    case "click": {
      if (state.step < 1 || state.step > 5 || needsConfiguration(state) || !["All", "Forest", "Coast", "City"].includes(action.setting)) return state;
      if (state.step >= 3 && action.setting === "All") return state;
      if (!Number.isInteger(action.count) || action.count < 0 || !Number.isFinite(Date.parse(action.timestamp))) return state;
      const properties: TeachingEvent["properties"] = state.step === 1
        ? { $event_type: "click", $pathname: "/" }
        : state.step === 2 ? {} : { destination_type: action.setting };
      if (state.step >= 4) Object.assign(properties, { results_count: action.count, has_results: action.count > 0 });
      const event: TeachingEvent = {
        id: `${state.revision}-${Math.min(state.step, 4)}-${state.events.length + 1}`,
        clickedElement: action.setting,
        timestamp: action.timestamp,
        event: state.step === 1 ? "$autocapture" : "stay_filter_selected",
        properties,
      };
      return { ...state, events: [...state.events, event], answered: false };
    }
  }
}
export function destinationCounts(events: readonly TeachingEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const value = event.properties.destination_type;
    if (value === "Forest" || value === "Coast" || value === "City") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([destination, count]) => ({ destination, count }));
}
export const captureCode = [
  "",
  "// Twig has the PostHog web SDK installed.\n// Autocapture records button clicks automatically.",
  'posthog.capture("stay_filter_selected");',
  'function track(type) {\n  if (type === "All") return;\n  posthog.capture(\n    "stay_filter_selected",\n    { destination_type: type }\n  );\n}',
  'function track(type, matches) {\n  if (type === "All") return;\n  const count = matches.length;\n  posthog.capture(\n    "stay_filter_selected",\n    {\n      destination_type: type,\n      results_count: count,\n      has_results: count > 0,\n    }\n  );\n}',
];
export const handoffSteps = [
  "Confirm my PostHog project and ask which product interaction and time range to investigate. Find the actual event and property names – ask me about ambiguous matches.",
  "Inspect a few events. Explain what the event name tells us and what its properties add.",
  "Compare event counts by a useful property. Share one finding, the supporting query, and evidence links where available. Distinguish event counts from people and explain any missing data.",
];
export const handoffIntro = "Help me explore events and properties in my PostHog project using MCP.";
export const handoffScope = "Use read-only tools. Do not change tracking or save anything to my project. Keep project data in this agent session.";
export const handoffTask = [handoffIntro, ...handoffSteps.map((step, index) => `${index + 1}. ${step}`), handoffScope].join("\n\n");

/** MCP request contracts verified against live info/schema on 2026-09-28. */
export function eventInspectionRequest(events: readonly TeachingEvent[]) {
  const latest = events.at(-1);
  if (!latest) throw new Error("An event is required for inspection");
  return { query: `SELECT event, timestamp, properties FROM events WHERE event = '${latest.event}' AND timestamp >= '${events[0].timestamp}' AND timestamp < '${new Date(Date.parse(latest.timestamp) + 1).toISOString()}' ORDER BY timestamp DESC LIMIT 1` };
}
export function eventTrendsRequest(events: readonly TeachingEvent[]) {
  const latest = events.at(-1);
  if (!latest) throw new Error("Events are required for comparison");
  return {
    series: [{ kind: "EventsNode", event: "stay_filter_selected", math: "total" }],
    breakdownFilter: { breakdowns: [{ property: "destination_type", type: "event" }] },
    dateRange: { date_from: events[0].timestamp, date_to: new Date(Date.parse(latest.timestamp) + 1).toISOString() },
  };
}
