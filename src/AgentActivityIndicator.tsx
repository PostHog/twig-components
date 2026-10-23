/** Shared vector activity indicator; never a platform emoji glyph. */
export function AgentActivityIndicator() {
  return <svg className="vac-agent-spinner" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.46 2.46l1.42 1.42M8.12 8.12l1.42 1.42M2.46 9.54l1.42-1.42M8.12 3.88l1.42-1.42" />
  </svg>;
}
