export function TripPlannerMilestone({ onContinue }: { onContinue: () => void }) {
  return <div className="vac-lab-completion vac-trip-milestone">
    <h3 className="vac-completion-title">
      <span className="vac-completion-check" aria-hidden="true">✓</span>
      <span>You’ve followed a successful chat</span>
    </h3>
    <div className="vac-guide-example">
      <h4>What you can now do</h4>
      <ul>
        <li>Capture a model call in Twig as an <code>$ai_generation</code> event.</li>
        <li>Inspect its input and output inside a PostHog trace.</li>
        <li>Use an AI session ID to group requests into a conversation in PostHog.</li>
      </ul>
    </div>
    <p>Next, use that evidence to investigate a recommendation that looks helpful but is wrong.</p>
    <button type="button" className="vac-button" onClick={onContinue}><span className="vac-os-button-face">Follow a failure →</span></button>
  </div>;
}
