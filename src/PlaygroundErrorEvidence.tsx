"use client";

import { useState, type ReactNode } from "react";
import { PlaygroundCodeBlock, codeLanguage } from "./PlaygroundCodeBlock.js";

// Error Tracking evidence drawn after the posthog.com Error Tracking pocket guide's figures
// (InspectorStatus, StackFrames, IssueList), in the Playground's tokens.

const errorTrackingIcon = new URL("./assets/posthog-error-tracking.svg", import.meta.url).href;

/** One line under an evidence frame saying what just happened, like the guide's inspector status. */
export function PlaygroundEvidenceStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "error" }) {
  return <p className="vac-et-status" data-tone={tone} role="status"><span aria-hidden="true" /><span>{children}</span></p>;
}

export type PlaygroundIssueException = { id: string | number; type: string; message?: string; time?: string };

/** An issue as PostHog's issue page opens it: name, status controls, totals, then its exceptions, newest first. */
export function PlaygroundIssuePage({ type, message, status, occurrences, sessions, users, exceptions }: {
  type: string; message?: string; status: "Active" | "Resolved"; occurrences: number; sessions: number; users: number;
  exceptions: readonly PlaygroundIssueException[];
}) {
  return <section className="vac-et-issue-page" aria-label={`Issue: ${type}`}>
    <header>
      <strong><img src={errorTrackingIcon} width={14} height={14} alt="" />{type}</strong>
      <div className="vac-et-issue-controls" aria-label="Issue controls">
        <span data-status={status.toLowerCase()}>{status} ▾</span>
        <span>No severity ▾</span>
        <span>Unassigned ▾</span>
      </div>
    </header>
    <dl>
      <div><dd>{occurrences}</dd><dt>Occurrences</dt></div>
      <div><dd>{sessions}</dd><dt>Sessions</dt></div>
      <div><dd>{users}</dd><dt>Users</dt></div>
    </dl>
    <ol aria-label="Exceptions">
      {[...exceptions].reverse().map((exception) => <li key={exception.id}>
        <strong>{exception.type}</strong>
        {exception.message && <span>{exception.message}</span>}
        {exception.time && <time>{exception.time}</time>}
      </li>)}
    </ol>
  </section>;
}

export type PlaygroundStackFrame = {
  fn: string;
  /** A bundle path and position when unresolved; a repository path and position when resolved. */
  source: string;
  inApp?: boolean;
  unresolved?: boolean;
  /** Source around the failing line. Only resolved frames carry it. */
  context?: { startLine: number; failingLine: number; lines: readonly string[] };
};

/** A stack trace as the issue page draws it: innermost first, unresolved frames warned, dependencies boxed. */
export function PlaygroundStackFrames({ type, message, frames }: { type: string; message?: string; frames: readonly PlaygroundStackFrame[] }) {
  const [open, setOpen] = useState<number | null>(() => {
    const first = frames.findIndex((frame) => frame.context);
    return first === -1 ? null : first;
  });
  return <section className="vac-et-frames" aria-label="Stack trace">
    <header><strong>{type}</strong>{message && <span>{message}</span>}</header>
    <ul>
      {frames.map((frame, index) => <li key={`${frame.fn}-${index}`} data-in-app={frame.inApp ? "true" : undefined}>
        <button type="button" disabled={!frame.context} aria-expanded={frame.context ? open === index : undefined} onClick={() => setOpen(open === index ? null : index)}>
          <code>{frame.fn}</code>
          <span data-unresolved={frame.unresolved ? "true" : undefined}>{frame.source}</span>
          {frame.unresolved && <span className="vac-et-frame-icon" title="Unresolved frame: upload your source maps to see Twig's code" aria-label="Unresolved frame">⚠</span>}
          {!frame.inApp && !frame.unresolved && <span className="vac-et-frame-icon" title="Vendor frame" aria-label="Vendor frame">▣</span>}
        </button>
        {open === index && frame.context && <PlaygroundCodeBlock
          label={codeLanguage(frame.source.split("@")[0] ?? "")}
          aria-label={`${frame.fn} source`}
          code={frame.context.lines.join("\n")}
          startLine={frame.context.startLine}
          highlightLines={[frame.context.failingLine - frame.context.startLine + 1]}
        />}
      </li>)}
    </ul>
  </section>;
}

export type PlaygroundIssueRow = { key: string; type: string; message: string; frame?: string; status: "Active" | "Resolved"; occurrences: number };

/** Twig's issue list: one row per issue, with its status and how many exceptions it holds. */
export function PlaygroundIssueList({ issues }: { issues: readonly PlaygroundIssueRow[] }) {
  return <section className="vac-et-issues" aria-label="Issues">
    <div className="vac-et-issues-head" aria-hidden="true"><span>Issue</span><span>Occurrences</span></div>
    <ul>
      {issues.map((issue) => <li key={issue.key} aria-label={`Issue: ${issue.type}`}>
        <div>
          <strong><img src={errorTrackingIcon} width={14} height={14} alt="" />{issue.type}</strong>
          <span>{issue.message}</span>
          {issue.frame && <small>{issue.frame}</small>}
          <em data-status={issue.status.toLowerCase()}>{issue.status}</em>
        </div>
        <span className="vac-et-issue-count">{issue.occurrences.toLocaleString("en-US")}</span>
      </li>)}
    </ul>
  </section>;
}
