export function TripPlannerConversation() {
  return <>
    <p>Twig assigns each request a new <code>$ai_trace_id</code> and reuses the same <code>$ai_session_id</code> throughout the chat. PostHog uses these IDs to group the events:</p>
    <div className="vac-conversation-traces" role="group" aria-label="AI session and its two traces">
      <div className="vac-conversation-session">
        <code>$ai_session_id</code>
        <code>example-7f3a9c2e8b14</code>
      </div>
      <ol aria-label="Traces in this AI session">
        {[{ label: "Forest getaway", traceId: "example-a6d2f809c31e" }, { label: "Beach access", traceId: "example-4b8e1a7d05c9" }].map(({ label, traceId }) => <li key={traceId}>
          <strong>{label}</strong>
          <dl><dt><code>$ai_trace_id</code></dt><dd><code>{traceId}</code></dd></dl>
        </li>)}
      </ol>
    </div>
    <p>Twig includes both IDs in each <code>$ai_generation</code> capture call:</p>
    <pre><code>{'posthog.capture("$ai_generation", {\n'}<mark>{'  $ai_trace_id: traceId,\n'}</mark><mark>{'  $ai_session_id: sessionId,\n'}</mark>{'});'}</code></pre>
  </>;
}
