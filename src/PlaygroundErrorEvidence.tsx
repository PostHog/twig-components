"use client";

import { useState, type ReactNode } from "react";
import { PlaygroundCodeBlock, codeLanguage } from "./PlaygroundCodeBlock.js";
import { PlaygroundStatus } from "./PlaygroundStatus.js";

// Error Tracking evidence in the Playground design system's error investigation pattern:
// a plain issue header, stack frames as rows, and status words without controls.

const plural = (count: number, noun: string) => `${count.toLocaleString("en-US")} ${noun}${count === 1 ? "" : "s"}`;

/** One line under an evidence frame saying what just happened, like the guide's inspector status. */
export function PlaygroundEvidenceStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "error" }) {
  return <p className="vac-et-status" data-tone={tone} role="status"><span aria-hidden="true" /><span>{children}</span></p>;
}

export type PlaygroundIssueException = { id: string | number; type: string; message?: string; time?: string };

/** An issue as PostHog's issue page opens it: name, status, totals, then its exceptions, newest first. */
export function PlaygroundIssuePage({ type, message, status, occurrences, sessions, users, exceptions }: {
  type: string; message?: string; status: "Active" | "Resolved"; occurrences: number; sessions: number; users: number;
  exceptions: readonly PlaygroundIssueException[];
}) {
  return <section className="vac-et-issue-page" aria-label={`Issue: ${type}`}>
    <header className="vac-error-issue-header">
      <div><h4>{type}</h4><PlaygroundStatus value={status === "Resolved" ? "resolved" : "active"} /></div>
      <p>{[plural(occurrences, "occurrence"), plural(sessions, "session"), plural(users, "user")].join(" · ")}</p>
    </header>
    {message && <code className="vac-error-message vac-et-issue-message">{message}</code>}
    {/* The design system's event table, newest first: the same rows as the lab's running event list. */}
    <div className="vac-activity-list">
      <table className="vac-lab-table" aria-label="Exceptions">
        <thead><tr><th scope="col">Exception</th><th scope="col">Time</th></tr></thead>
        <tbody>{[...exceptions].reverse().map((exception) => <tr key={exception.id}>
          <td><code>{exception.type}</code></td>
          <td>{exception.time && <time>{exception.time}</time>}</td>
        </tr>)}</tbody>
      </table>
    </div>
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

/** Drops the indentation every line shares, so a nested excerpt keeps its width in a narrow panel. */
function dedent(lines: readonly string[]) {
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)![0].length));
  return Number.isFinite(indent) ? lines.map((line) => line.slice(indent)) : [...lines];
}

/** A stack trace as the issue page draws it: innermost first, with unresolved and dependency frames labeled in text. */
export function PlaygroundStackFrames({ type, message, frames }: { type: string; message?: string; frames: readonly PlaygroundStackFrame[] }) {
  const [open, setOpen] = useState<number | null>(() => {
    const first = frames.findIndex((frame) => frame.context);
    return first === -1 ? null : first;
  });
  return <section className="vac-et-frames" aria-label="Stack trace">
    <header><strong>{type}</strong>{message && <span>{message}</span>}</header>
    <ul>
      {frames.map((frame, index) => <li key={`${frame.fn}-${index}`} data-in-app={frame.inApp ? "true" : undefined}>
        {frame.context
          ? <button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}>
              <span className="vac-et-frame-chevron" aria-hidden="true">{open === index ? "▾" : "▸"}</span>
              <code>{frame.fn}</code>
              <span>{frame.source}</span>
            </button>
          : <div className="vac-et-frame-static">
              <code>{frame.fn}</code>
              <span data-unresolved={frame.unresolved ? "true" : undefined}>{frame.source}</span>
              {frame.unresolved && <span className="vac-et-frame-note">Unresolved: no source map</span>}
              {!frame.inApp && !frame.unresolved && <span className="vac-et-frame-note">Dependency code</span>}
            </div>}
        {open === index && frame.context && <PlaygroundCodeBlock
          label={codeLanguage(frame.source.split("@")[0] ?? "")}
          aria-label={`${frame.fn} source`}
          code={dedent(frame.context.lines).join("\n")}
          startLine={frame.context.startLine}
          highlightLines={[frame.context.failingLine - frame.context.startLine + 1]}
          copyable={false}
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
          <strong>{issue.type}</strong>
          <span>{issue.message}</span>
          {issue.frame && <small>{issue.frame}</small>}
          <PlaygroundStatus value={issue.status === "Resolved" ? "resolved" : "active"} />
        </div>
        <span className="vac-et-issue-count">{issue.occurrences.toLocaleString("en-US")}</span>
      </li>)}
    </ul>
  </section>;
}
