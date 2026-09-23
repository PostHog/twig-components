"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FinishLabButton } from "./FinishLabButton.js";
import type { ReplayFrame } from "./replay-lab.js";

export type ReplayLabViewState = {
  exercise: "ghost" | "manual";
  recording: readonly unknown[];
  starting: boolean;
  frames: ReplayFrame[];
  mode: "ghost" | "manual" | null;
  masked: boolean;
  setMasked: (value: boolean) => void;
  capturedMasked: boolean;
  message: string;
  start: (mode: "ghost" | "manual") => void;
  stop: () => void;
  clear: () => void;
  setExercise: (value: "ghost" | "manual") => void;
};

export function ReplayRecordingBar({ replay }: { replay: ReplayLabViewState }) {
  if (!replay.mode) return null;
  return (
    <div className="vac-replay-recording" role="status">
      <span>
        {replay.mode === "ghost"
          ? "Ghost visit running"
          : "Recording your visit"}
      </span>
      {replay.mode === "manual" && (
        <button className="vac-text-button" onClick={replay.stop}>
          End recording and review
        </button>
      )}
    </div>
  );
}

export function ReplayLab({
  stage,
  onStage,
  replay,
  pathname,
  returnHome,
  sessionPlayer,
}: {
  stage: number;
  onStage: (stage: number) => void;
  replay: ReplayLabViewState;
  pathname: string;
  returnHome: ReactNode;
  sessionPlayer: ReactNode;
}) {
  const source = replay.exercise;
  const hasVisit = replay.recording.length > 1;
  const previousMode = useRef(replay.mode);
  useEffect(() => {
    if (
      previousMode.current === "manual" &&
      !replay.mode &&
      hasVisit &&
      stage === 1
    ) {
      onStage(2);
    }
    previousMode.current = replay.mode;
  }, [replay.mode, hasVisit, stage, onStage]);
  if (replay.mode === "ghost" || (replay.starting && source === "ghost")) {
    const latest = [...replay.frames].reverse().find(
      (frame) =>
        frame.kind === "click" ||
        frame.kind === "input" ||
        frame.kind === "page"
    );
    const update = replay.starting
      ? "Starting the recorder…"
      : latest?.kind === "input"
      ? "Typing a search for Adiron-shack…"
      : latest?.kind === "click"
      ? latest.label.startsWith("Filter: ")
        ? `Selected ${latest.label.slice(8)}. Browsing the filtered stays…`
        : "Opening Adiron-shack…"
      : latest?.page.startsWith("/stays/")
      ? "Viewing the stay details. Finishing the recording…"
      : "Starting on Find a stay…";
    return (
      <section
        className="vac-lab vac-ghost-progress"
        aria-label="Ghost simulation in progress"
      >
        <h3>Watch the ghost visitor</h3>
        <div className="vac-ghost-loader" aria-hidden="true" />
        <p role="status" aria-live="polite" aria-atomic="true">
          {update}
        </p>
        <p className="vac-muted">
          The simulation runs automatically. You can watch the recording when it
          finishes.
        </p>
      </section>
    );
  }
  if (stage === 2 && replay.mode)
    return (
      <section className="vac-lab vac-builder">
        <h3>Finish the visit first</h3>
        <p>
          Explore Twig however you like, then end the recording to watch your
          visit.
        </p>
        {replay.mode === "manual" && (
          <button className="vac-button" onClick={replay.stop}>
            <span className="vac-os-button-face">
              End recording and review →
            </span>
          </button>
        )}
      </section>
    );
  if (stage === 0)
    return (
      <div className="vac-guide-intro">
        <h3>What happened between the clicks?</h3>
        <p>
          Events tell you a visitor selected Coast. Replay adds the sequence:
          where they moved, what they typed, and which stay they opened.
        </p>
        <div className="vac-guide-example">
          <p>
            Follow a ghost visitor from filters to a stay. Then record your own
            visit.
          </p>
        </div>
        <button className="vac-button" onClick={() => onStage(1)}>
          <span className="vac-os-button-face">Set up the ghost visit →</span>
        </button>
      </div>
    );
  return (
    <section className="vac-lab vac-builder">
      {stage === 1 ? (
        <>
          <h3>
            {replay.mode === "manual"
              ? "Record your visit on Twig"
              : hasVisit
              ? "Your recording is ready"
              : source === "ghost"
              ? "Set up the ghost visit"
              : "Set up your own recording"}
          </h3>
          {replay.mode || hasVisit ? (
            <>
              <p>
                {replay.mode === "manual" ? (
                  <>
                    Explore Twig however you like. Click around, browse stays,
                    or try a search. When you’re ready, click{" "}
                    <strong>End recording and review</strong> to watch your
                    visit.
                  </>
                ) : (
                  "Your recording is ready. Play it back to see the interactions you captured."
                )}
              </p>
              {replay.mode === "manual" && (
                <button className="vac-button" onClick={replay.stop}>
                  <span className="vac-os-button-face">
                    End recording and review →
                  </span>
                </button>
              )}
              {!replay.mode && hasVisit && (
                <button className="vac-button" onClick={() => onStage(2)}>
                  <span className="vac-os-button-face">
                    Watch the recording →
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              <p>
                {source === "ghost"
                  ? "First, capture a ghost visitor filtering stays, searching, and opening Adiron-shack."
                  : "Start recording, then explore Twig however you like. When you’re ready, end the recording to watch it back. Starting replaces the ghost recording."}
              </p>
              <label className="vac-replay-mask">
                <input
                  type="checkbox"
                  aria-describedby="replay-masking-help"
                  checked={replay.masked}
                  onChange={(event) => replay.setMasked(event.target.checked)}
                />{" "}
                Hide search text in the replay
              </label>
              <p id="replay-masking-help" className="vac-muted">
                When enabled, search words appear as <code>[masked]</code> in
                the recording. Your recording stays in this browser tab.
              </p>
              {source === "ghost" && pathname !== "/" ? (
                {returnHome}
              ) : (
                <button
                  className="vac-button"
                  disabled={replay.starting}
                  onClick={() => replay.start(source)}
                >
                  <span className="vac-os-button-face">
                    {replay.starting
                      ? "Starting recorder…"
                      : source === "ghost"
                      ? "Run ghost simulation →"
                      : "Start my recording →"}
                  </span>
                </button>
              )}
              {replay.message && <p role="status">{replay.message}</p>}
            </>
          )}
        </>
      ) : (
        <>
          <h3>Watch your actual visit</h3>
          {replay.recording.length < 2 ? (
            <>
              <p>Record a new visit to capture the page for playback.</p>
              <button
                className="vac-button"
                onClick={() => {
                  replay.clear();
                  onStage(1);
                }}
              >
                <span className="vac-os-button-face">
                  Continue the exercise →
                </span>
              </button>
            </>
          ) : (
            <>
              <p className="vac-muted">
                Actual page recording, stored in this tab. Nothing sent to
                PostHog.
              </p>
              {sessionPlayer}
              <div className="vac-lab-output">
                <h4>Look for the search</h4>
                <p>
                  {replay.capturedMasked
                    ? "Search words were masked before storage. You can still watch the typing and surrounding interactions."
                    : "Search words are visible in this recording. Record another visit with masking on to compare."}
                </p>
              </div>
              <section
                className="vac-lab-step"
                aria-label="Captured interactions"
              >
                <h4>Captured interactions</h4>
                <ol>
                  {replay.frames
                    .filter(
                      (item) => item.kind !== "move" && item.kind !== "scroll"
                    )
                    .map((item, i) => (
                      <li key={i}>
                        {(item.at / 1000).toFixed(1)}s · {item.label}
                        {item.value !== undefined ? `: ${item.value}` : ""}
                      </li>
                    ))}
                </ol>
              </section>
              {source === "ghost" ? (
                <button
                  className="vac-button"
                  onClick={() => {
                    replay.clear();
                    replay.setExercise("manual");
                    onStage(1);
                  }}
                >
                  <span className="vac-os-button-face">
                    Record my own visit →
                  </span>
                </button>
              ) : (
                <FinishLabButton onClick={() => onStage(3)} />
              )}
            </>
          )}
        </>
      )}
      <details className="vac-lab-step">
        <summary>About this exercise</summary>
        <p>
          This uses rrweb to record and replay actual page changes, clicks,
          scrolling, and typing. It stays in memory in this tab. The playground
          and other form fields are excluded. No recording is uploaded to
          PostHog. Reloading clears it.
        </p>
        <a
          href="https://posthog.com/docs/session-replay"
          target="_blank"
          rel="noreferrer"
        >
          Session Replay docs ↗
        </a>
      </details>
    </section>
  );
}
