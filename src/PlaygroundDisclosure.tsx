import type { ReactNode } from "react";

/** PostHog.com IconPlus / IconMinus, shared by every Playground disclosure. */
export function DisclosureIcon({ expanded }: { expanded?: boolean }) {
  return <span className="vac-disclosure-icon" aria-hidden="true" data-expanded={expanded}>
    <svg className="vac-disclosure-plus" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 3a.75.75 0 0 1 .75.75v7.5h7.5a.75.75 0 0 1 0 1.5h-7.5v7.5a.75.75 0 0 1-1.5 0v-7.5h-7.5a.75.75 0 0 1 0-1.5h7.5v-7.5A.75.75 0 0 1 12 3Z" /></svg>
    <svg className="vac-disclosure-minus" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Z" /></svg>
  </span>;
}

export function PlaygroundSummary({ children, className = "", terminal = false }: { children: ReactNode; className?: string; terminal?: boolean }) {
  if (terminal) return <summary className="vac-agent-disclosure"><span className="vac-agent-caret" aria-hidden="true">›</span><span>{children}</span></summary>;
  return <summary className={`vac-playground-disclosure ${className}`.trim()}>
    <span className="vac-inspector-disclosure-label">{children}</span>
    <DisclosureIcon />
  </summary>;
}

/** Opening-page context stays on the lesson background, with native keyboard disclosure. */
export function LabSimulationDisclosure({ children }: { children: ReactNode }) {
  return <details className="vac-simulation-disclosure">
    <PlaygroundSummary>How this simulation works</PlaygroundSummary>
    {children}
  </details>;
}
