"use client";

import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";

export function LabPublishing({ title, stepCount, busy, error, prUrl, onOpenPr, onClose }: {
  title: string; stepCount: number; busy?: boolean; error?: string; prUrl?: string;
  onOpenPr: () => void; onClose: () => void;
}) {
  return <section className="ph-author-publishing" aria-label="Export to PR">
    <header className="ph-author-section-header"><div><h2>Export to PR</h2><p>{title} · {stepCount} {stepCount === 1 ? "page" : "pages"}</p></div><button className="ph-author-quiet" type="button" onClick={onClose}>Close</button></header>
    <div className="ph-author-publish-content">
      <p>Export the lab definition and implementation brief to <strong>PostHog/twig.com</strong>.</p>
      <p className="ph-author-preview-note">PoC: exports content and completion rules. Production lab wiring is still required.</p>
      {error && <p role="alert" className="ph-author-publish-error">{error}</p>}
      {prUrl ? <a className="ph-author-button ph-author-button-primary" href={prUrl} target="_blank" rel="noreferrer">View draft PR</a> : <button className="ph-author-button ph-author-button-primary" type="button" disabled={busy} onClick={onOpenPr}>{busy ? "Opening…" : "Open draft PR"}</button>}
      <details><PlaygroundSummary>GitHub connection</PlaygroundSummary><p>Sign in on this computer with repository access, then retry.</p><PlaygroundCodeBlock code="gh auth login" label="Shell" /></details>
    </div>
  </section>;
}
