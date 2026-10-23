"use client";

import { PlaygroundTooltip, useClipboardFeedback } from "./PlaygroundTooltip.js";

/** PostHog.com WizardCommand → PlatformInstall/InlineCommand, without site contexts. */
export function WizardCommand({ command = "", fullCommand, copyCommand, learnMore = "https://posthog.com/wizard", slim = false }: {
  command?: string; fullCommand?: string; copyCommand?: string; learnMore?: string; slim?: boolean;
}) {
  const display = fullCommand ?? `npx @posthog/wizard${command ? ` ${command}` : ""}`;
  const clipboard = copyCommand ?? fullCommand ?? `npx -y @posthog/wizard@latest${command ? ` ${command}` : ""}`;
  const { feedback, copy } = useClipboardFeedback();
  return <div className="vac-wizard-command" data-slim={slim || undefined}>
    <PlaygroundTooltip label={feedback || "Copy command"} open={!!feedback} feedbackOnly>
      <button className="vac-wizard-copy" type="button" aria-label="Copy setup command" onClick={() => void copy(clipboard)}><span aria-hidden="true">›</span><code className="vac-wizard-gradient">{display}</code><span className="vac-copy-glyph" aria-hidden="true" /></button>
      {feedback && <span className="vac-sr-only" role="status">{feedback}</span>}
    </PlaygroundTooltip>
    {!slim && <a className="vac-wizard-learn" href={learnMore} target="_blank" rel="noreferrer">Learn more ↗</a>}
  </div>;
}
