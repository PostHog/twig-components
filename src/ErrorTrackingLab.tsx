"use client";

import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";

import { LabPrimaryAction } from "./LabNavigation.js";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { touchpointDefinitions } from "./playground.js";

import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { LabChecklist } from "./LabChecklist.js";
import { ActivityPreview, type ActivityEvent } from "./ActivityPreview.js";
import {
  PlaygroundEvidenceStatus, PlaygroundIssueList, PlaygroundIssuePage,
  PlaygroundStackFrames, type PlaygroundIssueRow, type PlaygroundStackFrame,
} from "./PlaygroundErrorEvidence.js";
import { errorTrackingReducer, initialErrorTrackingState, latestOccurrence, type CapturedException, type ErrorTrackingAction, type ErrorTrackingState } from "./error-tracking-lab.js";

const ErrorTrackingContext = createContext<{
  state: ErrorTrackingState;
  dispatch: (action: ErrorTrackingAction) => void;
  active: boolean;
}>({ state: initialErrorTrackingState, dispatch: () => {}, active: false });

export function ErrorTrackingLabProvider({ children, active, state: controlledState, onAction }: {
  children: ReactNode;
  active: boolean;
  state?: ErrorTrackingState;
  onAction?: (action: ErrorTrackingAction) => void;
}) {
  const [localState, localDispatch] = useReducer(errorTrackingReducer, initialErrorTrackingState);
  const state = controlledState ?? localState;
  const dispatch = controlledState && onAction ? onAction : localDispatch;
  return <ErrorTrackingContext.Provider value={{ state, dispatch, active }}>{children}</ErrorTrackingContext.Provider>;
}

export function useErrorTrackingLab() { return useContext(ErrorTrackingContext); }

function Continue({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <LabPrimaryAction><button type="button" className="vac-button" onClick={onClick}><span className="vac-os-button-face">{children}</span></button></LabPrimaryAction>;
}

function Apply({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="vac-button" onClick={onClick}><span className="vac-os-button-face">{children}</span></button>;
}

// The Reduce noise chapter of the Error Tracking pocket guide, and how Twig uses each control there.
const reduceNoiseGuide = "https://posthog.com/learn/error-tracking/pocket-guide/reduce-noise";
const otherNoiseControls = [
  { name: "Production builds only", use: "Local development never sends exceptions", anchor: "skip-local-development-with-production-builds" },
  { name: "Burst protection", use: "Keeps one looping browser from flooding the project", anchor: "stop-looping-browsers-with-burst-protection" },
  { name: "Suppression rules", use: "Drops errors from browser extensions at ingestion", anchor: "drop-extension-errors-with-a-suppression-rule" },
  { name: "Rate limits", use: "Caps volume during an outage", anchor: "cap-outages-with-rate-limits" },
];

const noiseMessage = "ResizeObserver loop completed with undelivered notifications.";
const fromTwig = (occurrence: CapturedException) => occurrence.outcome !== "dropped";
const clock = (iso?: string) => {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour12: false }) : undefined;
};

/** An exception as the Activity tab lists it, with the properties the guide shows. */
function activityEvent(occurrence: CapturedException): ActivityEvent {
  return {
    id: String(occurrence.id),
    event: "$exception",
    timestamp: occurrence.timestamp,
    properties: {
      $exception_types: [occurrence.type],
      ...(occurrence.value ? { $exception_values: [occurrence.value] } : {}),
      $exception_handled: occurrence.handled,
      ...(occurrence.surface ? { surface: occurrence.surface } : {}),
      ...(occurrence.stayId ? { stay_id: occurrence.stayId } : {}),
      ...(occurrence.fingerprint ? { $exception_fingerprint: occurrence.fingerprint } : {}),
      ...(occurrence.distinctId ? { distinct_id: occurrence.distinctId } : {}),
      ...(occurrence.sessionId ? { $session_id: occurrence.sessionId } : {}),
      ...(occurrence.host ? { $groups: { host: occurrence.host } } : {}),
    },
  };
}

/** The newest events the Activity preview keeps. Older ones roll off as new ones arrive. */
const ACTIVITY_LIMIT = 8;

/** Recorded events in the Activity preview, newest selected unless the learner picks another. */
function EventActivity({ events }: { events: readonly ActivityEvent[] }) {
  const [selected, setSelected] = useState<string | undefined>();
  const frame = useRef<HTMLDivElement>(null);
  const recent = events.map((event, index) => ({ ...event, number: index + 1 })).slice(-ACTIVITY_LIMIT);
  const shown = recent.find((event) => event.id === selected) ?? recent.at(-1);
  // A new event can land below the dock's fold, so bring the list into view unless it's already visible.
  useEffect(() => {
    const element = frame.current;
    const scroller = element?.closest<HTMLElement>(".vac-dock-scroll");
    if (!element || !scroller) return;
    const box = element.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    if (box.top >= view.top && box.top <= view.bottom - 96) return;
    element.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [events.length]);
  return shown ? <div ref={frame}><ActivityPreview events={recent} selected={shown} onSelect={setSelected} highlightNew compact /></div> : null;
}

/** Twig's issues as PostHog groups them: by custom fingerprint, otherwise by exception type. */
function twigIssues(state: ErrorTrackingState, mappedFrames: readonly PlaygroundStackFrame[]): PlaygroundIssueRow[] {
  const groups = new Map<string, PlaygroundIssueRow>();
  // With source maps, an issue names Twig's first frame; without them, the first frame in the bundle.
  const mapped = state.sourceMapped ? mappedFrames.find((frame) => frame.inApp) : undefined;
  for (const occurrence of state.occurrences.filter(fromTwig)) {
    const key = occurrence.fingerprint ?? occurrence.type;
    const frame = mapped ? `${mapped.fn} in ${mapped.source.split("@")[0]}`
      : occurrence.frames[0] ? `${occurrence.frames[0]} in ${occurrence.sources?.[0]?.split("@")[0] ?? "Twig"}` : undefined;
    const issue = groups.get(key) ?? { key, type: occurrence.type, message: occurrence.fingerprint ?? occurrence.value ?? "", frame, status: state.resolved ? "Resolved" : "Active", occurrences: 0 };
    issue.occurrences += 1;
    groups.set(key, issue);
  }
  return [...groups.values()];
}

const captureCode = `try {
  setHost(readTripHost(hosts, booking.stay.hostId));
} catch (error) {
  setError("Try to load details again.");
  posthog.captureException(error, {
    surface: "trip_details",
    stay_id: booking.stay.id,
  });
}`;

const sourceMapCode = `withPostHogConfig(nextConfig, {
  sourcemaps: { enabled: true },
});`;

const fingerprintCode = `posthog.captureException(new HostNotFoundError(hostId), {
  surface: "trip_details",
  stay_id: booking.stay.id,
  $exception_fingerprint: \`host-not-found:\${hostId}\`,
});`;

const beforeSendCode = `before_send: (event) => {
  const exception = event.properties.$exception_list?.[0];
  if (exception?.value?.includes("ResizeObserver loop")) return null;
  return event;
},`;

/** Source-mapped frames for the Trip details retry. Hosts pass their real lines. */
export const defaultMappedFrames: readonly PlaygroundStackFrame[] = [
  { fn: "readTripHost", source: "src/lib/vacation/trip-details.ts@8:15", inApp: true, context: { startLine: 6, failingLine: 8, lines: ["  const host = hosts[hostId];", "  // The lab exercises this original assumption with an incomplete local fixture.", "  return host.name;"] } },
  { fn: "openTripDetails", source: "src/components/vacation/AccountPages.tsx@119:9", inApp: true, context: { startLine: 118, failingLine: 119, lines: ["      try {", "        readTripHost({}, hostId);", "      } catch (error) {"] } },
  { fn: "onRetry", source: "src/components/vacation/AccountPages.tsx@175:32", inApp: true, context: { startLine: 175, failingLine: 175, lines: ["                onRetry={() => openTripDetails(booking, true)}"] } },
  { fn: "executeDispatch", source: "node_modules/react-dom/cjs/react-dom-client.production.js@16368:9" },
  { fn: "processDispatchQueue", source: "node_modules/react-dom/cjs/react-dom-client.production.js@16418:13" },
];

export function ErrorTrackingLab({
  stage, onStage, location, onFocusBooking, onFocusDetails, onBookNew, onTriggerNoise, mappedFrames = defaultMappedFrames,
}: {
  stage: number;
  onStage: (stage: number) => void;
  location: "stay" | "bookings" | "other";
  onFocusBooking: () => void;
  onFocusDetails: () => void;
  onBookNew?: () => void;
  /** Twig's source-mapped frames for the Trip details retry. */
  mappedFrames?: readonly PlaygroundStackFrame[];
  /** Makes the browser raise real `ResizeObserver loop` errors. The host dispatches `noise` for each one. */
  onTriggerNoise?: () => void;
}) {
  const { state, dispatch } = useErrorTrackingLab();
  if (stage === 0) return <div className="vac-guide-intro">
    <h3>{touchpointDefinitions.errors.title}</h3>
    <p>Book a stay on Twig, then open its trip details. Twig fails on purpose. Each step shows the exception event the PostHog SDK builds in your browser.</p>
    <div className="vac-guide-example vac-booking-overview">
      <ol className="vac-error-intro-steps" aria-label="What you’ll do in this lab">
        <li>Book a stay and open its trip details.</li>
        <li>Capture the exception and drop browser noise.</li>
        <li>Read its stack trace, group it, then fix the bug.</li>
      </ol>
    </div>
    <Continue onClick={() => onStage(1)}>Start lab →</Continue>
    <details className="vac-lab-step" open><PlaygroundSummary>How this lab works</PlaygroundSummary><p>Your booking is saved only in this browser. The PostHog SDK builds a real event for each exception. Twig’s <code>before_send</code> keeps it in this browser rather than sending it to PostHog. No payment or real reservation is made.</p></details>
  </div>;

  if (stage === 1) return <section className="vac-lab vac-builder">
    <p>First, book a stay on Twig to get a trip to investigate.</p>
    <LabChecklist label="Book a stay" items={location !== "stay"
      ? [
          { label: <>Click <strong>Find a stay</strong> below.</>, done: Boolean(state.booking) },
          { label: <>Open a stay on Twig.</>, done: Boolean(state.booking) },
        ]
      : [{ label: <>Choose dates and guests, then click <strong>Book stay</strong> in Twig.</>, done: Boolean(state.booking) }]
    } />
    {location !== "stay" && !state.booking && onBookNew && <Continue onClick={onBookNew}>Find a stay →</Continue>}
    {location === "stay" && !state.booking && <Continue onClick={onFocusBooking}>Show the booking form →</Continue>}
    {state.booking && <Continue onClick={() => onStage(2)}>Continue →</Continue>}
  </section>;

  if (stage === 2) return <section className="vac-lab vac-builder">
    <p>Your {state.booking?.stayTitle} booking is saved.</p>
    {state.occurrences.some(fromTwig) ? <>
      <p>Trip details already threw an exception for this booking.</p>
      <Continue onClick={() => onStage(3)}>See what the SDK captured →</Continue>
    </> : <>
      <LabChecklist label="Open your trip" items={location === "bookings"
        ? [{ label: <>Click <strong>Trip details</strong> on the booking you made.</>, done: false }]
        : [
            { label: <>Open your account menu on Twig.</>, done: false },
            { label: <>Select <strong>Booked stays</strong>.</>, done: false },
          ]
      } />
      {location === "bookings" && <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
    </>}
  </section>;

  if (stage === 3) {
    const uncaught = latestOccurrence(state, (occurrence) => fromTwig(occurrence) && !occurrence.handled);
    return <section className="vac-lab vac-builder">
      <p>Trip details calls <code>readTripHost</code> without a <code>try</code>/<code>catch</code>. The error breaks the trip details button for every customer in production:</p>
      {uncaught && <EventActivity events={state.occurrences.filter(fromTwig).map(activityEvent)} />}
      {uncaught && <PlaygroundEvidenceStatus tone="error">This unhandled exception is caught by the PostHog Web SDK’s auto-capture. Un-handled exceptions show <code>$exception_handled: false</code>.</PlaygroundEvidenceStatus>}
      <p>An exception is an event like any other, so <code>distinct_id</code>, <code>$session_id</code>, and <code>$groups</code> tie it to the guest, their session, and the stay’s host.</p>
      <Continue onClick={() => onStage(4)}>Capture it yourself →</Continue>
    </section>;
  }

  if (stage === 4) {
    const handled = state.caught ? state.occurrences.filter((occurrence) => fromTwig(occurrence) && occurrence.handled) : [];
    if (!state.caught) return <section className="vac-lab vac-builder">
      <p>Autocapture misses exceptions that Twig catches itself. Catching an exception keeps the app from crashing, but something still went wrong. The engineers want to know, so they send it with <code>captureException</code>.</p>
      <p>In <strong>Trip details</strong>, they catch the error and add the stay that failed:</p>
      <h5>Current</h5>
      <PlaygroundCodeBlock label="TypeScript" code="setHost(readTripHost(hosts, booking.stay.hostId));" />
      <h5>With captureException</h5>
      <PlaygroundCodeBlock label="TypeScript" code={captureCode} highlightLines={[1, 2, 3, 4, 5, 6, 7, 8, 9]} />
      <Apply onClick={() => dispatch({ type: "catch" })}>Apply to Twig for this lab →</Apply>
    </section>;
    return <section className="vac-lab vac-builder">
      <LabChecklist label="Capture the retry" items={[{ label: <>Click <strong>Try again</strong> in Twig’s trip details.</>, done: handled.length > 0 }]} />
      {handled.length > 0 && <>
        <EventActivity events={state.occurrences.filter(fromTwig).map(activityEvent)} />
        <PlaygroundEvidenceStatus tone="error">{handled.length === 1
          ? <>Now the event has <code>surface</code> and <code>stay_id</code>. Click <strong>Try again</strong> again.</>
          : <>Each <strong>Try again</strong> sends another exception. You’ve sent {state.occurrences.filter(fromTwig).length}.</>}</PlaygroundEvidenceStatus>
      </>}
      {handled.length > 0 ? <Continue onClick={() => onStage(5)}>See the issue →</Continue> : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
    </section>;
  }

  if (stage === 5) {
    const occurrences = state.occurrences.filter((occurrence) => fromTwig(occurrence) && !occurrence.fingerprint);
    const first = occurrences[0];
    return <section className="vac-lab vac-builder">
      <p>To help you review them, PostHog groups similar exceptions into issues. In PostHog, you triage and resolve exceptions by issue.</p>
      {first && <PlaygroundIssuePage
        type={first.type}
        message={first.value}
        status={state.resolved ? "Resolved" : "Active"}
        occurrences={occurrences.length}
        sessions={new Set(occurrences.map((occurrence) => occurrence.sessionId ?? "session")).size}
        users={new Set(occurrences.map((occurrence) => occurrence.distinctId ?? "guest")).size}
        exceptions={occurrences.map((occurrence) => ({ id: occurrence.id, type: occurrence.type, message: occurrence.value, time: clock(occurrence.timestamp) }))}
      />}
      <Continue onClick={() => onStage(6)}>Drop browser noise →</Continue>
    </section>;
  }

  if (stage === 6) {
    const { unfiltered } = state.noise;
    const noiseEvents: ActivityEvent[] = (state.noise.capturedAt ?? []).map((timestamp, index) => ({
      id: `noise-${index}`, event: "$exception", timestamp,
      properties: { $exception_types: ["Error"], $exception_values: [noiseMessage], $exception_handled: false },
    }));
    return <section className="vac-lab vac-builder">
      {unfiltered === 0 && <p>Browsers raise errors that aren’t Twig bugs. A <code>ResizeObserver loop</code> error means a layout took more than one pass, and nothing breaks for the guest.</p>}
      <LabChecklist label="Make some noise" items={[{ label: <>Click <strong>Trigger browser noise</strong> and watch the events.</>, done: unfiltered > 0 }]} />
      {onTriggerNoise && <Apply onClick={onTriggerNoise}>Trigger browser noise →</Apply>}
      {noiseEvents.length > 0 && <EventActivity events={[...state.occurrences.filter(fromTwig).map(activityEvent), ...noiseEvents]} />}
      {unfiltered > 0 && <PlaygroundEvidenceStatus tone="error">Every one became an exception in PostHog, and PostHog bills by event.</PlaygroundEvidenceStatus>}
      {unfiltered > 0 && <Continue onClick={() => onStage(7)}>Drop them with before_send →</Continue>}
    </section>;
  }

  if (stage === 7) {
    const { unfiltered, dropped } = state.noise;
    if (!state.noiseFiltered) return <section className="vac-lab vac-builder">
      <p>Twig’s <code>before_send</code> drops them before they leave the browser:</p>
      <PlaygroundCodeBlock label="TypeScript" code={beforeSendCode} highlightLines={[3]} />
      <Apply onClick={() => dispatch({ type: "filter-noise" })}>Add before_send to Twig →</Apply>
    </section>;
    return <section className="vac-lab vac-builder">
      <LabChecklist label="Check the filter" items={[{ label: <>Click <strong>Trigger browser noise</strong> again.</>, done: dropped > 0 }]} />
      {onTriggerNoise && <Apply onClick={onTriggerNoise}>Trigger browser noise →</Apply>}
      {dropped > 0 && <>
        <PlaygroundEvidenceStatus><code>before_send</code> dropped all {dropped}, so none of them reached PostHog. The issue still has {unfiltered}.</PlaygroundEvidenceStatus>
        <Continue onClick={() => onStage(8)}>Other noise controls →</Continue>
      </>}
    </section>;
  }

  if (stage === 8) return <section className="vac-lab vac-builder">
    <p>Twig uses other controls for noise too:</p>
    <ul className="vac-et-issue-parts">
      {otherNoiseControls.map((control) => <li key={control.anchor}>
        <a href={`${reduceNoiseGuide}#${control.anchor}`} target="_blank" rel="noreferrer">{control.name} ↗</a> {control.use}.
      </li>)}
    </ul>
    <Continue onClick={() => onStage(9)}>Read the stack trace →</Continue>
  </section>;

  if (stage === 9) {
    const latest = latestOccurrence(state, (occurrence) => fromTwig(occurrence) && occurrence.handled) ?? latestOccurrence(state, fromTwig);
    const bundle: PlaygroundStackFrame[] = (latest?.frames ?? []).map((fn, index) => ({ fn, source: latest?.sources?.[index] ?? "unknown", unresolved: true }));
    return <section className="vac-lab vac-builder">
      {state.sourceMapped
        ? <p>With source maps, every frame points to Twig’s source:</p>
        : <p>Without source maps, every frame points into Twig’s minified bundle. Twig uploads its source maps in each production build.</p>}
      {latest && <PlaygroundStackFrames key={state.sourceMapped ? "mapped" : "bundle"} type={latest.type} message={latest.value} frames={state.sourceMapped ? mappedFrames : bundle} />}
      {!state.sourceMapped && <>
        <PlaygroundCodeBlock label="next.config.ts" code={sourceMapCode} highlightLines={[2]} />
        <Apply onClick={() => dispatch({ type: "upload-source-maps" })}>Upload Twig’s source maps →</Apply>
      </>}
      {state.sourceMapped && <Continue onClick={() => onStage(10)}>Group the exceptions →</Continue>}
    </section>;
  }

  if (stage === 10) {
    const grouped = state.fingerprinted ? latestOccurrence(state, (occurrence) => fromTwig(occurrence) && Boolean(occurrence.fingerprint)) : undefined;
    if (!state.fingerprinted) return <section className="vac-lab vac-builder">
      <p>PostHog puts exceptions with the same fingerprint in the same issue. By default, it builds the fingerprint from the exception type and Twig’s frames in the stack trace.</p>
      <p>The stay page and Trip details both fail when a host record is missing. Their frames differ, so they’d land in two issues. Twig’s engineers want one issue per missing host, so Trip details sets its own fingerprint:</p>
      <PlaygroundCodeBlock label="TypeScript" code={fingerprintCode} highlightLines={[1, 4]} />
      <Apply onClick={() => dispatch({ type: "fingerprint" })}>Apply to Twig for this lab →</Apply>
    </section>;
    return <section className="vac-lab vac-builder">
      <LabChecklist label="Capture the retry" items={[{ label: <>Click <strong>Try again</strong> in Twig’s trip details.</>, done: Boolean(grouped) }]} />
      {grouped && <>
        <PlaygroundIssueList issues={twigIssues(state, mappedFrames)} />
        <PlaygroundEvidenceStatus>A fingerprint only applies to new exceptions, so earlier ones stay in the <code>TypeError</code> issue. Every new <code>HostNotFoundError</code> for this host joins <code>{grouped.fingerprint}</code>.</PlaygroundEvidenceStatus>
      </>}
      {grouped ? <Continue onClick={() => onStage(11)}>Fix the bug →</Continue> : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
    </section>;
  }

  if (stage === 11) {
    if (!state.repaired) return <section className="vac-lab vac-builder">
      <p><code>readTripHost</code> read from an empty host list. The fix passes Twig’s loaded host records:</p>
      <h5>Current</h5>
      <PlaygroundCodeBlock label="TypeScript" code="readTripHost({}, stay.hostId);" />
      <h5>Fixed</h5>
      <PlaygroundCodeBlock label="TypeScript" code={"readTripHost(\n  hosts,\n  stay.hostId\n);"} highlightLines={[2]} />
      <Apply onClick={() => dispatch({ type: "repair" })}>Apply the Twig fix →</Apply>
    </section>;
    return <section className="vac-lab vac-builder">
      <LabChecklist label="Check the fix" items={[{ label: <>Open <strong>Trip details</strong> on Twig.</>, done: state.verified }]} />
      {state.verified && <>
        <PlaygroundIssueList issues={twigIssues(state, mappedFrames)} />
        <PlaygroundEvidenceStatus>Trip details opened with no new exception.</PlaygroundEvidenceStatus>
      </>}
      {state.verified
        ? state.resolved
          ? <Continue onClick={() => onStage(12)}>Finish lab →</Continue>
          : <Continue onClick={() => { dispatch({ type: "resolve" }); onStage(12); }}>Resolve the issues →</Continue>
        : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
    </section>;
  }

  return <section className="vac-lab vac-builder">
    <h3>{touchpointDefinitions.errors.title} complete</h3>
    <p>You captured Twig’s exception with autocapture and <code>captureException</code>, and dropped browser noise. Then you read its stack trace with source maps, grouped it with a fingerprint, and fixed the bug.</p>
  </section>;
}
