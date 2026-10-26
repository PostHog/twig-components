import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";
import type { TripPlannerRecord } from "./trip-planner-records.js";
import type { TripLessonField } from "./trip-planner-lesson.js";
import { PlaygroundGeneration, generationModelLabel, type AiTrace } from "./PlaygroundAiEvidence.js";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";

export function traceForGeneration(record: TripPlannerRecord): AiTrace {
  const titles: Record<TripPlannerRecord["properties"]["scenario"], string> = {
    forest: "Forest getaway", beach: "Beach access", kitchen: "Kitchen question", fallback: "Chat request",
    "capacity-broken": "City stay for four", "capacity-fixed": "City stay for four",
  };
  return { id: record.properties.$ai_trace_id, title: titles[record.properties.scenario], generation: record.properties.$ai_span_name,
    ...(record.capacityEvidence ? { toolCall: "Search stays" } : {}) };
}

/** Latest chat message above the fold; the full captured context remains inspectable. */
export function TripPlannerTracePreview({ record, field, onFieldChange }: {
  record: TripPlannerRecord; field?: TripLessonField; onFieldChange?: (field: TripLessonField) => void;
}) {
  const p = record.properties;
  return <PlaygroundGeneration field={field} onFieldChange={onFieldChange}
    input={p.$ai_input.filter(message => message.role === "user").slice(-1)} output={p.$ai_output_choices}
    facts={[{ label: "Model", value: generationModelLabel(p.$ai_model) }, { label: "Duration", value: `${p.$ai_latency}s` }]}
    details={<table className="vac-lab-table vac-lab-table-key-value" aria-label="Generation details"><tbody>
      <tr><th scope="row">Provider</th><td>{p.$ai_provider}</td></tr>
      <tr><th scope="row">Tokens</th><td>{p.$ai_input_tokens} in / {p.$ai_output_tokens} out</td></tr>
      <tr><th scope="row">Cost</th><td>${p.$ai_total_cost_usd.toFixed(6)}</td></tr>
      <tr><th scope="row">Model ID</th><td><code>{p.$ai_model}</code></td></tr>
      <tr><th scope="row">Trace ID</th><td><code>{p.$ai_trace_id}</code></td></tr>
      <tr><th scope="row">Generation ID</th><td><code>{p.$ai_span_id}</code></td></tr>
      <tr><th scope="row">Captured input</th><td><details><PlaygroundSummary>Messages</PlaygroundSummary><PlaygroundCodeBlock label="JSON">{JSON.stringify(p.$ai_input, null, 2)}</PlaygroundCodeBlock></details></td></tr>
    </tbody></table>} />;
}
