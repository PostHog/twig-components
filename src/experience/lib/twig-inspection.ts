import type { PlaygroundActivity } from "../../PlaygroundPanels.js";

type Activity = Omit<PlaygroundActivity, "id">;
export type InspectionContext = { operationId?: string; simulated?: boolean };


// Explicitly project known instrumentation. Never forward arbitrary event properties,
// input text, booking dates, guest counts, prompts, error messages, or replay data.
export function inspectionActivityForEvent(event: string, properties: Record<string, unknown>): Activity | null {
  const definitions: Record<string, { kind: Activity["kind"]; label: string }> = {
    twig_demo_account_logged_in: { kind: "catalog", label: "Signed in" },
    twig_demo_account_logged_out: { kind: "catalog", label: "Signed out" },
    twig_demo_account_settings_saved: { kind: "catalog", label: "Account preferences saved" },
    twig_demo_login_prompted: { kind: "catalog", label: "Sign-in requested" },
    $exception: { kind: "errors", label: "Site error captured" },
    twig_stay_filter_selected: { kind: "catalog", label: "Setting selected" },
    twig_stay_amenity_toggled: { kind: "catalog", label: "Amenity changed" },
    twig_trip_search_submitted: { kind: "catalog", label: "Stay search submitted" },
    twig_destination_suggestion_selected: { kind: "catalog", label: "Destination selected" },
    twig_stay_viewed: { kind: "stay", label: "Stay viewed" },
    twig_stay_saved: { kind: "stay", label: "Stay saved" },
    twig_stay_unsaved: { kind: "stay", label: "Stay unsaved" },
    twig_ai_simulation_run: { kind: "discovery", label: "AI response ready" },
    twig_ai_search_answered: { kind: "discovery", label: "AI response ready" },
    twig_ai_recommendation_opened: { kind: "discovery", label: "AI recommendation opened" },
    twig_booking_simulation_submitted: { kind: "booking", label: "Booking simulation submitted" },
    twig_demo_booking_saved: { kind: "booking", label: "Booking confirmed" },
  };
  const definition = Object.hasOwn(definitions, event) ? definitions[event] : null;
  if (!definition) return null;
  const details: string[] = [];
  const safeProperties: Record<string, string | number | boolean | {type:string}[]> = {};
  const enums: Record<string, readonly unknown[]> = {
    exception_type: ["Error", "TypeError", "RangeError", "Unknown"],
    surface: ["trip_details", "vacation_route"],
    setting: ["All", "Forest", "Coast", "City"],
    amenity: ["beach-access", "fire-pit", "lake-access"],
    stay_id: ["stay-01", "stay-02", "stay-03"],
    outcome: ["results", "empty", "invalid", "question", "recommendation", "no-match", "unknown", "success", "failure"],
  };
  for (const [name, values] of Object.entries(enums)) {
    if (values.includes(properties[name])) { safeProperties[name] = properties[name] as string; details.push(`${name}: ${properties[name]}`); }
  }
  if (typeof properties.selected === "boolean") details.push(`selected: ${properties.selected}`);
  if (typeof properties.result_count === "number" && Number.isInteger(properties.result_count) && properties.result_count >= 0 && properties.result_count <= 3) details.push(`result_count: ${properties.result_count}`);
  for (const key of ["selected", "in_lab", "applied_to_results"] as const) if (typeof properties[key] === "boolean") safeProperties[key] = properties[key];
  if (typeof properties.result_count === "number" && Number.isInteger(properties.result_count) && properties.result_count >= 0 && properties.result_count <= 3) safeProperties.result_count = properties.result_count;
  if (event === "$exception" && typeof safeProperties.exception_type === "string") {
    safeProperties.$exception_list = [{type:safeProperties.exception_type}];
    delete safeProperties.exception_type;
  }
  const setting = safeProperties.setting;
  const element = event === "twig_stay_filter_selected" && typeof setting === "string"
    ? `<button aria-pressed="true">${setting === "All" ? "All locations" : setting}</button>`
    : event === "twig_stay_amenity_toggled" ? `<input type="checkbox"${safeProperties.selected ? " checked" : ""} />`
    : event === "twig_trip_search_submitted" ? '<form class="vac-trip-search"></form>' : undefined;
  // A canonical snapshot of known instrumented controls, never arbitrary DOM/user text.
  return { ...definition, event, detail: details.join(" · "), properties: safeProperties, ...(element ? { element } : {}) };
}

export type ReplayInspectionState = { mode: string | null; masked: boolean; capturedMasked: boolean; count: number };

/** Recording lifecycle/configuration, not replay snapshots or their contents. */
export function replayInspectionActivity(before: ReplayInspectionState, after: ReplayInspectionState): Activity | null {
  if (before.mode === after.mode && before.masked === after.masked) return null;
  return { kind: 'replay', label: before.mode !== after.mode ? after.mode ? 'Recording started' : 'Recording stopped' : 'Input masking changed',
    detail: after.mode ? 'Recording' : 'Not recording', properties: {
      recording: Boolean(after.mode), search_input_masked: after.mode ? after.capturedMasked : after.masked, captured_events: after.count,
    } };
}

export function createInspectionBus() {
const listeners = new Set<(activity: Activity) => void>();
/** In-memory observation only. This neither captures analytics nor persists events. */
function observeInspectionActivity(listener: (activity: Activity) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function publishInspectionActivity(event: string, properties: Record<string, unknown>, context?: InspectionContext) {
  if (!listeners.size) return;
  const activity = inspectionActivityForEvent(event, properties);
  if (activity) {
    publishLocalInspectionActivity({ ...activity, ...(context?.operationId ? { operationId: context.operationId } : {}), ...(context?.simulated && event === "$exception" ? { label: "Simulated exception", properties: { ...activity.properties, demo_data: true } } : {}) });
  }
}

/** Trusted local evidence producers supply fixed metadata, never DOM/visitor contents. */
function publishLocalInspectionActivity(activity: Activity) {
  const snapshot = { ...activity, timestamp: activity.timestamp ?? new Date().toISOString() };
  for (const listener of listeners) listener(snapshot);
}


return {observeInspectionActivity,publishInspectionActivity,publishLocalInspectionActivity};
}
