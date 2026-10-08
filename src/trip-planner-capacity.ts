import { initialTripPlannerState, tripPlannerIntentFor, tripPlannerPrompts, type TripPlannerState } from "./trip-planner.js";
import { stayLabel, type Stay } from "./catalog.js";
import { createGenerationRecord, type TripPlannerRequest, type TripPlannerRequestIdentity } from "./trip-planner-records.js";

export const capacityPrompt = "Find me a city stay for four.";
export type CapacityScenario = "capacity-broken" | "capacity-fixed";
type Candidate = { id: string; name: string; capacity: number | null };
export type CapacityEvidence = {
  lookup: {
    event: "$ai_span";
    timestamp: string;
    properties: {
      $ai_trace_id: string; $ai_session_id: string; $ai_span_id: string;
      $ai_span_name: "search_stays"; $ai_latency: number;
      $ai_input_state: { setting: "City"; guests?: number };
      $ai_output_state: Candidate[];
    };
  };
  evaluation: { name: "Fits the group"; generationId: string; result: "pass" | "fail" | "not-applicable"; reason: string };
};

/** Capacity is checked independently of whether the model call completed. */
export function evaluateCapacity(recommendation: Candidate | undefined, guests: number): Omit<CapacityEvidence["evaluation"], "generationId"> {
  if (!recommendation) return { name: "Fits the group", result: "pass", reason: "No undersized stay was recommended. This does not mean a matching stay was found." };
  if (recommendation.capacity === null) return { name: "Fits the group", result: "not-applicable", reason: "The recommended stay has no recorded capacity to check." };
  return recommendation.capacity < guests
    ? { name: "Fits the group", result: "fail", reason: `${recommendation.name} sleeps ${recommendation.capacity}, but the visitor asked for ${guests}.` }
    : { name: "Fits the group", result: "pass", reason: `${recommendation.name} sleeps ${recommendation.capacity}, enough for ${guests}.` };
}

/** A scripted website failure, plus the corrected lookup used after the guided fix. */
export function createCapacityRequest(stays: readonly Stay[], identity: TripPlannerRequestIdentity, scenario: CapacityScenario, state: TripPlannerState = initialTripPlannerState()): TripPlannerRequest {
  const filters = { setting: "City" as const, ...(scenario === "capacity-fixed" ? { guests: 4 } : {}) };
  const candidates = stays.filter(stay => stay.setting === filters.setting && (filters.guests === undefined || (stay.capacity ?? 0) >= filters.guests))
    .map(stay => ({ id: stay.id, name: stayLabel(stay), capacity: stay.capacity }));
  const recommendation = candidates[0];
  const reply = recommendation
    ? `${recommendation.name} is my recommendation for your city getaway for four.`
    : "There isn’t a city stay for four in Twig’s current catalog. Try a different setting or a smaller group.";
  const record = createGenerationRecord([
    { role: "system", content: "Recommend the first stay returned by search_stays. If there are no matches, explain that no stay meets the request." },
    { role: "system", content: `search_stays results: ${JSON.stringify(candidates)}` },
    ...state.turns.flatMap(turn => [{ role: "user" as const, content: tripPlannerIntentFor(turn.prompt) ? tripPlannerPrompts[tripPlannerIntentFor(turn.prompt)!] : "[Unsupported message omitted]" }, { role: "assistant" as const, content: turn.reply }]),
    { role: "user", content: capacityPrompt },
  ], [{ role: "assistant", content: reply }], { ...identity, startedAt: identity.startedAt + 150 }, {
    scenario, turn_number: state.turns.length + 1, selected_stay_id: recommendation?.id ?? null, group_size: 4,
    response_kind: recommendation ? "recommendation" : "answer",
  }, 1.1, "Recommend a city stay");
  record.capacityEvidence = {
    lookup: { event: "$ai_span", timestamp: new Date(identity.startedAt).toISOString(), properties: {
      $ai_trace_id: identity.traceId, $ai_session_id: identity.sessionId, $ai_span_id: `${identity.traceId}:lookup`,
      $ai_span_name: "search_stays", $ai_latency: 0.15, $ai_input_state: filters, $ai_output_state: candidates,
    } },
    evaluation: { ...evaluateCapacity(recommendation, 4), generationId: identity.generationId },
  };
  return { record, state: { stage: "complete", guests: 4, selectedStayId: recommendation?.id ?? null,
    turns: [...state.turns, { prompt: capacityPrompt, reply, kind: recommendation ? "recommendation" : "answer", stayId: recommendation?.id }] } };
}
