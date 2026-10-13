import { capacityPrompt, createCapacityRequest, type CapacityEvidence } from "./trip-planner-capacity.js";
import { type Stay } from "./catalog.js";
import { replyToTripPlanner, tripPlannerIntentFor, tripPlannerPrompts, tripPlannerTurnLimit, type TripPlannerState } from "./trip-planner.js";

/** Frozen teaching configuration, not a live provider connection. */
export const tripPlannerModel = {
  provider: "anthropic",
  model: "claude-haiku-4-5-20251001",
  inputUsdPerMillion: 1,
  outputUsdPerMillion: 5,
  pricingDate: "2026-10-07",
  pricingSource: "https://platform.claude.com/docs/en/models/haiku-4-5/overview",
} as const;

export type TripPlannerMessage = { role: "system" | "user" | "assistant"; content: string };
export type TripPlannerRecord = {
  /** Local evidence bundle, not extra fields sent to PostHog. */
  capacityEvidence?: CapacityEvidence;
  event: "$ai_generation";
  timestamp: string;
  properties: {
    $ai_session_id: string;
    $ai_trace_id: string;
    $ai_span_id: string;
    $ai_span_name: string;
    $ai_model: string;
    $ai_provider: string;
    $ai_input: TripPlannerMessage[];
    $ai_output_choices: TripPlannerMessage[];
    $ai_input_tokens: number;
    $ai_output_tokens: number;
    $ai_input_token_price: number;
    $ai_output_token_price: number;
    $ai_input_cost_usd: number;
    $ai_output_cost_usd: number;
    $ai_total_cost_usd: number;
    $ai_latency: number;
    $ai_is_error: false;
    $ai_stop_reason: "end_turn";
    feature: "trip_planner";
    scenario: "forest" | "beach" | "kitchen" | "fallback" | "capacity-broken" | "capacity-fixed";
    turn_number: number;
    selected_stay_id: string | null;
    group_size: number | null;
    response_kind: "recommendation" | "answer" | "fallback";
    demo_data: true;
    fixture_version: "trip-planner-v1";
    usage_source: "fixture";
    pricing_date: string;
  };
};
export type TripPlannerRequest = { state: TripPlannerState; record: TripPlannerRecord };
export type TripPlannerRequestIdentity = {
  sessionId: string;
  traceId: string;
  generationId: string;
  startedAt: number;
};

const durations = { forest: 1.1, beach: 1.4, kitchen: 0.8, fallback: 0.45 } as const;
const systemPrompt = "You help visitors choose a Twig stay. Use only the supplied catalog facts. Keep the visitor's group size when their preferences change. Answer follow-up questions about the most recently selected stay. Be explicit when a recommendation changes country. Never invent amenities or prices.";

function canonicalPrompt(prompt: string): string {
  const intent = tripPlannerIntentFor(prompt);
  return intent ? tripPlannerPrompts[intent] : "[Unsupported message omitted]";
}

// Illustrative usage scales with the full message payload. This is not an
// Anthropic tokenizer or measured billing data. Keep it out of real usage reports.
function exampleTokens(messages: readonly TripPlannerMessage[]): number {
  return 3 + messages.reduce((total, message) => total + 4 + Math.ceil(message.content.length / 4), 0);
}
function roundCost(cost: number): number { return Number(cost.toFixed(9)); }

/** Build the answer and its local PostHog event from the same catalog snapshot. */
export function createTripPlannerRequest(
  state: TripPlannerState,
  input: string,
  stays: readonly Stay[],
  identity: TripPlannerRequestIdentity,
): TripPlannerRequest | null {
  if (state.stage === "kitchen" && state.turns.length < tripPlannerTurnLimit && input.trim() === capacityPrompt) return createCapacityRequest(stays, identity, "capacity-broken", state);
  const next = replyToTripPlanner(state, input, stays);
  if (next === state) return null;
  const turn = next.turns.at(-1)!;
  const scenario = turn.kind === "fallback" ? "fallback" : tripPlannerIntentFor(input)!;
  const context = {
    guests: state.guests,
    selectedStayId: state.selectedStayId,
    catalog: stays.map((stay) => ({
      id: stay.id,
      title: stay.title,
      location: stay.location,
      setting: stay.setting,
      capacity: stay.capacity,
      bedrooms: stay.bedrooms,
      sleepingArrangements: stay.sleepingArrangements,
      amenities: stay.amenities,
      nightlyRate: stay.nightlyRate,
      currency: stay.currency,
    })),
  };
  const messages: TripPlannerMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `Current trip and stay catalog:\n${JSON.stringify(context)}` },
    ...state.turns.flatMap((previous): TripPlannerMessage[] => [
      { role: "user", content: canonicalPrompt(previous.prompt) },
      { role: "assistant", content: previous.reply },
    ]),
    { role: "user", content: canonicalPrompt(input) },
  ];
  const output: TripPlannerMessage[] = [{ role: "assistant", content: turn.reply }];
  return { state: next, record: createGenerationRecord(messages, output, identity, {
    scenario,
    turn_number: next.turns.length,
    selected_stay_id: next.selectedStayId,
    group_size: next.guests,
    response_kind: turn.kind,
  }, durations[scenario], turn.kind === "answer" ? "Answer stay question" : turn.kind === "fallback" ? "Handle unsupported request" : "Recommend a stay") };
}

/** Shared record construction for the normal conversation and bounded lab scenarios. */
export function createGenerationRecord(
  messages: TripPlannerMessage[], output: TripPlannerMessage[], identity: TripPlannerRequestIdentity,
  metadata: Pick<TripPlannerRecord["properties"], "scenario" | "turn_number" | "selected_stay_id" | "group_size" | "response_kind">,
  duration: number, name: string,
): TripPlannerRecord {
  const inputTokens = exampleTokens(messages);
  const outputTokens = exampleTokens(output);
  const inputPrice = tripPlannerModel.inputUsdPerMillion / 1_000_000;
  const outputPrice = tripPlannerModel.outputUsdPerMillion / 1_000_000;
  const inputCost = roundCost(inputTokens * inputPrice);
  const outputCost = roundCost(outputTokens * outputPrice);
  return {
    event: "$ai_generation",
    timestamp: new Date(identity.startedAt).toISOString(),
    properties: {
      $ai_session_id: identity.sessionId, $ai_trace_id: identity.traceId,
      $ai_span_id: identity.generationId, $ai_span_name: name,
      $ai_model: tripPlannerModel.model, $ai_provider: tripPlannerModel.provider,
      $ai_input: messages, $ai_output_choices: output,
      $ai_input_tokens: inputTokens, $ai_output_tokens: outputTokens,
      $ai_input_token_price: inputPrice, $ai_output_token_price: outputPrice,
      $ai_input_cost_usd: inputCost, $ai_output_cost_usd: outputCost,
      $ai_total_cost_usd: roundCost(inputCost + outputCost), $ai_latency: duration,
      $ai_is_error: false, $ai_stop_reason: "end_turn", feature: "trip_planner",
      ...metadata,
      demo_data: true, fixture_version: "trip-planner-v1", usage_source: "fixture", pricing_date: tripPlannerModel.pricingDate,
    },
  };
}
