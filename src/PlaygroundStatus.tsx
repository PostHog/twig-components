export type PlaygroundStatusValue = "active" | "resolved" | "ready" | "running" | "failed" | "passed" | "not-applicable" | "caught";

/** Fixed brand colors; keep the readable status alongside its color and mark. */
export function PlaygroundStatus({ value }: { value: PlaygroundStatusValue }) {
  return <span className="vac-playground-status" data-status={value}>
    {value === "failed" && <span aria-hidden="true">✕ </span>}
    {(value === "passed" || value === "resolved") && <span aria-hidden="true">✓ </span>}
    {{ active: "Active", resolved: "Resolved", ready: "Ready", running: "Running…", failed: "Failed", passed: "Passed", "not-applicable": "Not applicable", caught: "Exception caught" }[value]}
  </span>;
}
