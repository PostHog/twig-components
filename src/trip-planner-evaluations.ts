import { stayLabel, type Stay } from "./catalog.js";
import { evaluateCapacity, createCapacityRequest, capacityPrompt } from "./trip-planner-capacity.js";
import { createTripPlannerRequest, type TripPlannerRecord, type TripPlannerRequestIdentity } from "./trip-planner-records.js";
import { initialTripPlannerState, tripPlannerPrompts } from "./trip-planner.js";

/** Versioned local teaching data. No PostHog dataset, judge, or upload is created. */
export const plannerRegressionDataset = {
  id: "twig-recommendations", version: 1,
  cases: [
    { id: "forest-four", input: tripPlannerPrompts.forest, expected: "supported" },
    { id: "city-four", input: capacityPrompt, expected: "no-match" },
    { id: "unknown-capacity", input: capacityPrompt, expected: "not-applicable" },
  ],
} as const;

export const plannerCapacityScorer = {
  name: "Guest capacity", version: "guest-capacity-v1",
  minimum: 0, maximum: 1, passingScore: 1,
} as const;

/** Three output types from one deterministic rule, never a simulated LLM judge. */
export function scorePlannerCapacity(record: TripPlannerRecord, stays: readonly Stay[]) {
  const p = record.properties;
  const stay = stays.find(stay => stay.id === p.selected_stay_id);
  const result = p.group_size === null || (p.selected_stay_id !== null && !stay)
    ? "not-applicable" : evaluateCapacity(stay && { id: stay.id, name: stayLabel(stay), capacity: stay.capacity ?? null }, p.group_size).result;
  const applicable = result !== "not-applicable";
  return {
    generationId: p.$ai_span_id, traceId: p.$ai_trace_id, sessionId: p.$ai_session_id,
    scorer: plannerCapacityScorer.name, scorerVersion: plannerCapacityScorer.version,
    boolean: applicable ? result === "pass" : null,
    numeric: applicable ? result === "pass" ? 1 : 0 : null,
    category: !applicable ? "not-applicable" : result === "fail" ? "capacity-mismatch" : stay ? "supported" : "no-match",
    // A skipped check is not a pass. Honest no-match only passes this narrow rule.
    passed: applicable ? result === "pass" : null,
    source: "local-rule" as const,
  };
}

/** Both configurations run the same cases and scorer. Caller supplies unique run IDs. */
export function runPlannerRegression(stays: readonly Stay[], identity: TripPlannerRequestIdentity, configuration: "before" | "after") {
  const items = plannerRegressionDataset.cases.map((item, index) => {
    const requestId = `${identity.traceId}:${item.id}`;
    const requestIdentity = { ...identity, traceId: requestId, generationId: `${requestId}:generation`, startedAt: identity.startedAt + index * 10_000 };
    // Missing reference data is a separate case, not a fabricated capacity value.
    const catalog = item.id === "unknown-capacity" ? stays.map(stay => stay.setting === "City" ? { ...stay, capacity: null } : stay) : stays;
    const request = item.id === "forest-four"
      ? createTripPlannerRequest(initialTripPlannerState(), item.input, catalog, requestIdentity)!
      : createCapacityRequest(catalog, requestIdentity, item.id === "unknown-capacity" || configuration === "before" ? "capacity-broken" : "capacity-fixed");
    return { caseId: item.id, input: item.input, expected: item.expected, record: request.record, score: scorePlannerCapacity(request.record, catalog) };
  });
  const scored = items.filter(item => item.score.passed !== null);
  return {
    id: identity.traceId, datasetId: plannerRegressionDataset.id, datasetVersion: plannerRegressionDataset.version,
    scorerVersion: plannerCapacityScorer.version, configuration, items,
    passRate: scored.length ? scored.filter(item => item.score.passed).length / scored.length : null,
    skipped: items.length - scored.length, demoData: true as const,
  };
}
