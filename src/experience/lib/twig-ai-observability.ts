import { createGenerationRecord, type TripPlannerRecord } from '../../trip-planner-records.js';
import type { createInspectionBus } from "./twig-inspection.js";

const knownStays = new Set(['stay-01', 'stay-02', 'stay-03']);
const outcomes = new Set(['question', 'recommendation', 'no-match', 'unknown']);

/** Use the existing AIO teaching model without copying visitor messages or preferences. */
export function createPlannerEvidenceSession() {
  const sessionId = `planner-${crypto.randomUUID()}`;
  let turn = 0;
  return (outcome: string, stayIds: readonly string[]) => {
    turn++;
    const traceId = `planner-${crypto.randomUUID()}`;
    const safeOutcome = outcomes.has(outcome) ? outcome : 'unknown';
    const ids = stayIds.filter(id => knownStays.has(id));
    return createGenerationRecord(
      [{ role: 'user', content: '[Visitor message omitted]' }],
      [{ role: 'assistant', content: JSON.stringify({ outcome: safeOutcome, stay_ids: ids }) }],
      { sessionId, traceId, generationId: `${traceId}-generation`, startedAt: Date.now() },
      { scenario: 'fallback', turn_number: turn, selected_stay_id: ids[0] ?? null, group_size: null, response_kind: ids.length ? 'recommendation' : safeOutcome === 'question' ? 'answer' : 'fallback' },
      1.2, 'Plan a getaway',
    );
  };
}

/** Local generation evidence only. Never pass simulated AI payloads to trackTwigEvent/SDK. */
export function publishPlannerGeneration(publishLocalInspectionActivity: ReturnType<typeof createInspectionBus>["publishLocalInspectionActivity"], record: TripPlannerRecord, stayIds: readonly string[] = [record.properties.selected_stay_id ?? '']) {
  const p = record.properties;
  const ids = stayIds.filter(id => knownStays.has(id));
  const properties = {
    $ai_session_id: p.$ai_session_id, $ai_trace_id: p.$ai_trace_id,
    $ai_span_id: p.$ai_span_id, $ai_span_name: 'Plan a getaway',
    $ai_model: p.$ai_model, $ai_provider: p.$ai_provider,
    $ai_input: [{ role: 'user', content: '[Visitor message omitted]' }],
    $ai_output_choices: [{ role: 'assistant', content: JSON.stringify({ response_kind: p.response_kind, stay_ids: ids }) }],
    $ai_input_tokens: p.$ai_input_tokens, $ai_output_tokens: p.$ai_output_tokens,
    $ai_latency: p.$ai_latency, $ai_total_cost_usd: p.$ai_total_cost_usd,
    $ai_is_error: p.$ai_is_error, demo_data: true, usage_source: 'fixture',
  };
  publishLocalInspectionActivity({ kind: 'discovery', label: 'AI generation', event: '$ai_generation',
    detail: `${p.$ai_model} · ${p.$ai_latency}s`, properties, operationId: p.$ai_trace_id, timestamp: record.timestamp });
}
