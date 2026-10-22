import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";
import { PlaygroundTraceExplorer } from "./PlaygroundAiEvidence.js";
import { useTripPlannerLab } from "./TripPlannerLab.js";
import { traceForGeneration } from "./TripPlannerTracePreview.js";
export function TripPlannerConversation() {
  const { lesson } = useTripPlannerLab();
  const records = lesson.evidence;
  return <>
    <p>Twig assigns each request a new <code>$ai_trace_id</code> and reuses the same <code>$ai_session_id</code> throughout the chat. PostHog uses these IDs to group the events:</p>
    <PlaygroundTraceExplorer traces={records.map(traceForGeneration)} sessionId={records[0]?.properties.$ai_session_id} />
    <p>Include both IDs in each <code>$ai_generation</code> capture call:</p>
    <PlaygroundCodeBlock><code>{'posthog.capture("$ai_generation", {\n'}<mark>{'  $ai_trace_id: traceId,\n'}</mark><mark>{'  $ai_session_id: sessionId,\n'}</mark>{'});'}</code></PlaygroundCodeBlock>
  </>;
}
