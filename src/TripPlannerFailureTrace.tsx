import type { TripPlannerRecord } from "./trip-planner-records.js";

/** A generation and its recorded messages, using the session diagram's tree. */
export function TripPlannerFailureTrace({ record }: { record: TripPlannerRecord }) {
  const input = record.properties.$ai_input.filter(message => message.role === "user").at(-1);
  return <div className="vac-conversation-traces" role="group" aria-label="City generation and its recorded input and output">
    <div className="vac-conversation-session">
      <code>$ai_generation</code>
      <span>City stay for four</span>
    </div>
    <ol aria-label="Recorded generation properties">
      <li><dl>
        <dt><code>$ai_input</code></dt>
        <dd>{input?.content}</dd>
      </dl></li>
      <li><dl>
        <dt><code>$ai_output_choices</code></dt>
        {record.properties.$ai_output_choices.map((message, index) => <dd key={index}>{message.content}</dd>)}
      </dl></li>
    </ol>
  </div>;
}
