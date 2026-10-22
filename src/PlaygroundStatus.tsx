export type PlaygroundStatusValue = "ready" | "running" | "failed" | "passed" | "not-applicable";

/** Fixed brand colors; keep the readable status alongside its color and mark. */
export function PlaygroundStatus({ value }: { value: PlaygroundStatusValue }) {
  return <span className="vac-playground-status" data-status={value}>
    {value === "failed" && <span aria-hidden="true">✕ </span>}
    {value === "passed" && <span aria-hidden="true">✓ </span>}
    {{ ready: "Ready", running: "Running…", failed: "Failed", passed: "Passed", "not-applicable": "Not applicable" }[value]}
  </span>;
}
