"use client";

import { useState, type ReactNode } from "react";
import { PlaygroundStatus } from "./PlaygroundStatus.js";
import { PlaygroundCodeBlock, codeLanguage } from "./PlaygroundCodeBlock.js";

/** The issue identity stays attached to evidence, fixes and verification. */
export function PlaygroundErrorIssue({ count, resolved = false, children }: { count: number; resolved?: boolean; children?: ReactNode }) {
  return <section className="vac-error-investigation" aria-label="Issue: Trip host name is missing">
    <header className="vac-error-issue-header">
      <div><h4>Issue: Trip host name is missing</h4><PlaygroundStatus value={resolved ? "resolved" : "active"} /></div>
      <p>{count} {count === 1 ? "occurrence" : "occurrences"}</p>
    </header>
    {children && <div className="vac-error-investigation-content">{children}</div>}
  </section>;
}

/** A frame selects its source; it does not expand or collapse the event. */
export function PlaygroundStackTrace() {
  const [selected, setSelected] = useState(0);
  const frames = [
    { name: "readTripHost", file: "trip-details.ts", code: "const host = hosts[hostId];\nreturn host.name;", highlight: 2 },
    { name: "openTripDetails", file: "AccountPages.tsx", code: "readTripHost({}, stay.hostId);", highlight: 1 },
  ];
  const frame = frames[selected];
  return <div className="vac-error-stack-evidence">
    <h5>Stack trace</h5>
    <div className="vac-error-stack-frames" role="group" aria-label="Stack frames">
      {frames.map((frame, index) => <button type="button" key={frame.name} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <code>{frame.name}</code><span>{frame.file}</span>
      </button>)}
    </div>
    <PlaygroundCodeBlock label={codeLanguage(frame.file)} code={frame.code} highlightLines={[frame.highlight]} /><small className="vac-source-caption">{frame.file}</small>
  </div>;
}
