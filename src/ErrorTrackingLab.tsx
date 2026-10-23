"use client";

import { PlaygroundErrorIssue, PlaygroundStackTrace } from "./PlaygroundErrorEvidence.js";
import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";

import { LabPrimaryAction } from "./LabNavigation.js";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { touchpointDefinitions } from "./playground.js";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { LabChecklist } from "./LabChecklist.js";
import { characters, stays } from "./catalog.js";
import { errorTrackingReducer, initialErrorTrackingState, type ErrorOccurrence, type ErrorTrackingAction, type ErrorTrackingState } from "./error-tracking-lab.js";

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

function IssuePreview({ count, resolved = false }: { count: number; resolved?: boolean }) {
  return <PlaygroundErrorIssue count={count} resolved={resolved} />;
}

function PostHogExceptionProperties({ occurrence, highlightStayId = false }: {
  occurrence: ErrorOccurrence | undefined; highlightStayId?: boolean;
}) {
  return <div className="vac-error-exception-evidence">
    <h5>Exception</h5><strong>{occurrence?.type}</strong>
    <code className="vac-error-message">{occurrence?.message}</code>
    <table className="vac-lab-table vac-lab-table-key-value" aria-label="Exception properties">
      <thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead>
      <tbody>
        <tr><td><code>surface</code></td><td><code>trip_details</code></td></tr>
        <tr><td><code>stay_id</code></td><td><code>{highlightStayId ? <mark>{occurrence?.stayId}</mark> : occurrence?.stayId}</code></td></tr>
      </tbody>
    </table>
  </div>;
}

function PostHogExceptionExplanation({ onStage }: { onStage: (stage: number) => void }) {
  const { state } = useErrorTrackingLab();
  const last = state.occurrences.at(-1);

  return <section className="vac-lab vac-builder">
    <p>Twig couldn't open your trip details. PostHog Error Tracking helps pinpoint why: it records the failure as an exception, one error event with clues about what went wrong. The stay ID links the event to your booking.</p>
    <PlaygroundErrorIssue count={state.occurrences.length}><PostHogExceptionProperties occurrence={last} />
    <p>PostHog keeps this exception in an issue, a group of similar errors. The selected exception's stack trace lists the functions Twig was running when it failed, helping pinpoint where in Twig's code the error happened.</p>
    <PlaygroundStackTrace /></PlaygroundErrorIssue>
    <p>To read a stack trace, start at the top, closest to the failure, and compare it with the error message. Twig tried to read <code>name</code> from <code>undefined</code>, so it looks like there's a missing value. The first function, <code>readTripHost</code>, retrieves the host's name for the stay details.</p>
    <Continue onClick={() => onStage(4)}>See how errors are grouped →</Continue>
  </section>;
}

function PostHogIssueInvestigation({ onStage }: { onStage: (stage: number) => void }) {
  const { state, dispatch } = useErrorTrackingLab();
  const last = state.occurrences.at(-1);
  const bookedStay = stays.find((stay) => stay.id === state.booking?.stayId);

  return <section className="vac-lab vac-builder">
    <PlaygroundErrorIssue count={state.occurrences.length}>
      <LabChecklist label="Retry completed" items={[{ label: "Try again in Twig’s trip details.", done: state.successfulRetry }]} />
      {state.successfulRetry && <p>No new exception. Host name still missing.</p>}
      <h5>Current</h5>
      <PlaygroundCodeBlock label="Trip details" code="readTripHost({}, stay.hostId);" />
      <h5>Use the loaded host records</h5>
      <PlaygroundCodeBlock label="Trip details" code={"readTripHost(\n  hosts,\n  stay.hostId\n);"} highlightLines={[2]} />
    </PlaygroundErrorIssue>
    <p>Stay <code>{last?.stayId}</code> points to host <code>{bookedStay?.hostId}</code>. Pass Twig’s loaded host records to retrieve the name.</p>
    {state.hostLookupRepaired
      ? <Continue onClick={() => onStage(8)}>Check the Twig repair →</Continue>
      : <Continue onClick={() => { dispatch({ type: "repair-host-lookup" }); onStage(8); }}>Apply the Twig repair →</Continue>}
  </section>;
}

function PostHogIssueResolution({ onStage }: { onStage: (stage: number) => void }) {
  const { state, dispatch } = useErrorTrackingLab();
  const bookedStay = stays.find((stay) => stay.id === state.booking?.stayId);
  const bookedHost = characters.find((host) => host.id === bookedStay?.hostId);

  return <section className="vac-lab vac-builder">
    <PlaygroundErrorIssue count={state.occurrences.length} resolved={state.resolved}>
      <LabChecklist label="Check the host repair" items={[{ label: "Open Trip details on Twig.", done: true }]} />
      <table className="vac-lab-table" aria-label="Repair verification">
        <thead><tr><th scope="col">Check</th><th scope="col">Result</th></tr></thead>
        <tbody><tr><td>Trip details</td><td>Opened</td></tr><tr><td>Host name</td><td>{bookedHost?.name}</td></tr><tr><td>New exceptions</td><td>0</td></tr></tbody>
      </table>
    </PlaygroundErrorIssue>
    {state.resolved
      ? <Continue onClick={() => onStage(10)}>Finish lab →</Continue>
      : <Continue onClick={() => { dispatch({ type: "resolve" }); onStage(10); }}>Resolve the issue →</Continue>}
  </section>;
}

export function ErrorTrackingLab({
  stage, onStage, location, onFocusBooking, onFocusDetails, onBookNew,
}: {
  stage: number;
  onStage: (stage: number) => void;
  location: "stay" | "bookings" | "other";
  onFocusBooking: () => void;
  onFocusDetails: () => void;
  onBookNew?: () => void;
}) {
  const { state, dispatch } = useErrorTrackingLab();
  const count = state.occurrences.length;
  if (stage === 0) return <div className="vac-guide-intro">
    <h3>{touchpointDefinitions.errors.title}</h3>
    <p>Book a stay on Twig, then open its trip details and investigate a recoverable error.</p>
    <div className="vac-guide-example vac-booking-overview">
      <ol className="vac-error-intro-steps" aria-label="What you’ll do in this lab">
        <li>Book a stay and view its details.</li>
        <li>Encounter and investigate an error.</li>
      </ol>
    </div>
    <Continue onClick={() => onStage(1)}>Start lab →</Continue>
    <details className="vac-lab-step"><PlaygroundSummary>How this simulation works</PlaygroundSummary><p>Your booking succeeds and is saved only in this browser. For this lesson, Twig cannot load part of its trip details. The example error stays local and is not sent to PostHog. No payment or real reservation is made.</p></details>
  </div>;

  if (stage === 1) return <section className="vac-lab vac-builder">
    <p>First, save a booking on Twig so we have a trip to investigate.</p>
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
    {count > 0 ? <>
      <p>Trip details already produced an exception for this booking.</p>
      <Continue onClick={() => onStage(3)}>Review the exception →</Continue>
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

  if (stage === 3) return <PostHogExceptionExplanation onStage={onStage} />;

  if (stage === 4) return <section className="vac-lab vac-builder">
    <p>In a PostHog project, an issue groups similar exceptions using clues like their type, message, and stack trace. Each occurrence is one captured failure, not one person. An issue can include failures from different people and devices.</p>
    <p>{count < 2 ? "Here, every failed attempt comes from this browser." : `These ${count} failed attempts all came from this browser.`}</p>
    <IssuePreview count={count} resolved={state.resolved} />
    {count < 2 && <LabChecklist label="Retry trip details" items={[{
      label: <>Rage click <strong>Try again</strong> in Twig's trip details, and watch the count climb.</>, done: false,
    }]} />}
    {count < 2 ? <Continue onClick={onFocusDetails}>Show your booking →</Continue> : <Continue onClick={() => onStage(5)}>Find the fix →</Continue>}
  </section>;

  if (stage === 5) return <section className="vac-lab vac-builder">
    <p>Twig keeps a host record for each stay, saving details about the host. For this trip, the record doesn't reach the lookup, so <code>host</code> is <code>undefined</code>.</p>
    <p>Currently, there's no fallback in place when <code>host</code> is <code>undefined</code>, resulting in the generic error message seen on Twig:</p>
    <PlaygroundErrorIssue count={count}><h5>Current</h5><PlaygroundCodeBlock label="Trip details" code="return host.name;" highlightLines={[1]} />
    <p>The Twig code fix avoids reading a name from a missing host and shows a message if no name is available:</p>
    <h5>With a fallback</h5><PlaygroundCodeBlock label="Trip details" code={"return host?.name ??\n  'Host information unavailable';"} highlightLines={[1, 2]} /></PlaygroundErrorIssue>
    <LabChecklist label="Apply the fallback" items={[{ label: <>Click <strong>Apply the Twig code fix</strong>.</>, done: false }]} />
    <Continue onClick={() => { dispatch({ type: "fix" }); onStage(6); }}>Apply the Twig code fix →</Continue>
  </section>;

  if (stage === 6) return <section className="vac-lab vac-builder">
    <PlaygroundErrorIssue count={count}>
      <LabChecklist label="Check the fallback" items={[{ label: <>Click <strong>Try again</strong> in Twig’s trip details.</>, done: state.successfulRetry }]} />
      {state.successfulRetry && <p>No new exception. Host name still missing.</p>}
    </PlaygroundErrorIssue>
    {state.successfulRetry ? <Continue onClick={() => onStage(7)}>Inspect the missing host →</Continue> : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
  </section>;

  if (stage === 7) return <PostHogIssueInvestigation onStage={onStage} />;

  if (stage === 8 || stage === 9) return state.hostVerified
    ? <PostHogIssueResolution onStage={onStage} />
    : <section className="vac-lab vac-builder">
      <PlaygroundErrorIssue count={count}>
        <LabChecklist label="Check the host repair" items={[{
          label: <>Open <strong>Trip details</strong> on Twig.</>, done: false,
        }]} />
        <button type="button" className="vac-button" disabled><span className="vac-os-button-face">Resolve the issue</span></button>
      </PlaygroundErrorIssue>
      <Continue onClick={onFocusDetails}>Show your booking →</Continue>
    </section>;

  return <section className="vac-lab vac-builder">
    <h3>{touchpointDefinitions.errors.title} complete</h3>
    <p>The exception, stack trace, and stay ID pointed to the broken host lookup. The Twig repair restored the host name in trip details. That successful load added no new occurrence before the issue was marked resolved.</p>
  </section>;
}
