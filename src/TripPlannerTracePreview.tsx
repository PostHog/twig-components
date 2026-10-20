import type { TripPlannerRecord } from "./trip-planner-records.js";
import type { TripLessonField } from "./trip-planner-lesson.js";

/** A small view of the recorded generation, not a replica of PostHog's app. */
export function TripPlannerTracePreview({ record, field }: { record: TripPlannerRecord; field: TripLessonField }) {
  const input = field === "input";
  const messages = input
    ? record.properties.$ai_input.filter(message => message.role === "user")
    : record.properties.$ai_output_choices;
  const title = record.properties.scenario === "forest" ? "Forest getaway" : "Beach follow-up";
  return <figure className="vac-trace-preview" aria-label={`Simplified PostHog trace: ${title}`}>
    <figcaption>PostHog displays the captured input and output inside the request’s trace:</figcaption>
    <div className="vac-trace-preview-surface">
      <div className="vac-trace-preview-name"><strong>Trace · {title}</strong></div>
      <div className="vac-trace-preview-call"><strong>Generation</strong><code>$ai_generation</code></div>
      <div className="vac-trace-preview-data">
        <div className="vac-trace-preview-source"><strong>{input ? "Input" : "Output"}</strong><code>{input ? "$ai_input" : "$ai_output_choices"}</code></div>
        {messages.map((message, index) => <div className="vac-trace-preview-message" key={index}>
          <span className="vac-trace-preview-role">{message.role === "user" ? "User" : "Assistant"}</span>
          <p>{message.content}</p>
        </div>)}
      </div>
    </div>
  </figure>;
}
