"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { LabChecklist } from "./LabChecklist.js";
import { errorTrackingReducer, initialErrorTrackingState, type ErrorTrackingAction, type ErrorTrackingState } from "./error-tracking-lab.js";

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
  return <button type="button" className="vac-button" onClick={onClick}><span className="vac-os-button-face">{children}</span></button>;
}

function HighlightErrorMessage({ message }: { message: string }) {
  return <>{message.split(/\b(undefined|name)\b/gi).map((part, index) =>
    /^(undefined|name)$/i.test(part) ? <mark key={index}>{part}</mark> : part
  )}</>;
}

function IssuePreview({ count, resolved = false }: { count: number; resolved?: boolean }) {
  return <section className="vac-lab-output vac-error-issue" aria-label="Example error issue">
    <h4>Trip host name is missing</h4>
    <dl className="vac-event-comparison">
      <div><dt>Occurrences</dt><dd>{count}</dd></div>
      <div><dt>Status</dt><dd>{resolved ? "Resolved" : "Active"}</dd></div>
    </dl>
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
  const last = state.occurrences.at(-1);
  if (stage === 0) return <div className="vac-guide-intro">
    <h3>Error Tracking lab</h3>
    <p>Book a stay on Twig, then open its trip details and investigate a recoverable error.</p>
    <div className="vac-guide-example vac-booking-overview">
      <ol className="vac-error-intro-steps" aria-label="What you’ll do in this lab">
        <li>Book a stay and view its details.</li>
        <li>Encounter and investigate an error.</li>
      </ol>
    </div>
    <Continue onClick={() => onStage(1)}>Start lab →</Continue>
    <details className="vac-lab-step"><summary>How this simulation works</summary><p>Your booking succeeds and is saved only in this browser. For this lesson, Twig cannot load part of its trip details. The example error stays local and is not sent to PostHog. No payment or real reservation is made.</p></details>
  </div>;

  if (stage === 1) return <section className="vac-lab vac-builder">
    <p>Book a stay on Twig. Once your booking is saved, you’ll open its trip details to investigate the error.</p>
    <LabChecklist label="Book a stay" items={[{
      label: location !== "stay"
        ? <>Click <strong>Find a stay</strong> in Twig, then open a stay.</>
        : <>Choose dates and guests, then click <strong>Book stay</strong> in Twig.</>,
      done: Boolean(state.booking),
    }]} />
    {location !== "stay" && !state.booking && onBookNew && <Continue onClick={onBookNew}>Find a stay →</Continue>}
    {location === "stay" && !state.booking && <Continue onClick={onFocusBooking}>Show the booking form →</Continue>}
    {state.booking && <Continue onClick={() => onStage(2)}>Continue →</Continue>}
  </section>;

  if (stage === 2 && count > 0) return <section className="vac-lab vac-builder">
    <p>Twig showed an error when you opened the details.</p>
    <Continue onClick={() => onStage(3)}>Inspect the error →</Continue>
  </section>;

  if (stage === 2) return <section className="vac-lab vac-builder">
    <p>Your {state.booking?.stayTitle} booking is saved. {location === "bookings" ? "Open its trip details to investigate the error." : "Find that trip in Twig and open its details."}</p>
    <LabChecklist label="Open your trip" items={[{
      label: location === "bookings"
        ? <>Click <strong>Trip details</strong> on the booking you made.</>
        : <>Open your account menu, then select <strong>Booked stays</strong>.</>,
      done: false,
    }]} />
    {location === "bookings" && <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
  </section>;

  if (stage === 3) return <section className="vac-lab vac-builder">
    <p>Twig couldn’t open your trip details. In PostHog Error Tracking, an <strong>exception</strong> is an event for one software failure. This local example shows the error type, a message describing what failed, and a stay ID that identifies your booking.</p>
    <dl className="vac-lab-output vac-error-details"><div><dt>Exception type</dt><dd><code>{last?.type}</code></dd></div><div><dt>Error message</dt><dd><code>{last?.message}</code></dd></div><div><dt>Stay ID</dt><dd><code>{last?.stayId}</code></dd></div></dl>
    <p>A <strong>stack trace</strong> lists the functions Twig was running when it failed. A function is a named piece of code. Each entry also shows its file. Start at the top, closest to the failure, and compare it with the message.</p>
    <div className="vac-error-stack" role="group" aria-label="Example stack trace">
      <code>{last?.type}: <HighlightErrorMessage message={last?.message ?? ""} /></code>
      <div className="vac-error-stack-frame"><code>at <mark>readTripHost</mark></code><code>trip-details.ts</code></div>
      <div className="vac-error-stack-frame"><code>at openTripDetails</code><code>AccountPages.tsx</code></div>
    </div>
    <p>The highlighted clues tell the story. Twig tried to read <code>name</code> from <code>undefined</code>, a missing value. The first function, <code>readTripHost</code>, gets the host name. Together, they point to the host name in trip details. <code>TypeError</code> names this kind of invalid use of a value.</p>
    <Continue onClick={() => onStage(4)}>See how errors are grouped →</Continue>
  </section>;

  if (stage === 4) return <section className="vac-lab vac-builder">
    <p>{count < 2
      ? <>Go on, rage-click <strong>Try again</strong> on your trip a few times. Each failure adds an occurrence to the same issue – PostHog’s group for errors with the same cause. Watch the count climb.</>
      : <>PostHog kept all {count} failed attempts in one issue because the same error happened each time. Keep clicking <strong>Try again</strong> to watch the count climb, or find the fix.</>}</p>
    <IssuePreview count={count} resolved={state.resolved} />
    {count < 2 ? <Continue onClick={onFocusDetails}>Show your booking →</Continue> : <Continue onClick={() => onStage(5)}>Find the fix →</Continue>}
  </section>;

  if (stage === 5) return <section className="vac-lab vac-builder">
    <p>Twig keeps a host record for each stay – saved details about the host, such as Woody’s name. This trip’s record is missing, so <code>host</code> is <code>undefined</code>: there is no host information to read.</p>
    <pre className="vac-booking-code">{"// Before\nreturn host.name;\n\n// After\nreturn host?.name ??\n  'Host information unavailable';"}</pre>
    <p>In the new line, <code>?.</code> avoids reading a missing host. <code>??</code> shows the fallback text when no name is available.</p>
    <p>A developer would make this change in Twig’s trip-details code. The button only simulates that change in your browser. It does not edit code or change PostHog.</p>
    <Continue onClick={() => { dispatch({ type: "fix" }); onStage(6); }}>Simulate the Twig fix →</Continue>
  </section>;

  if (stage === 6) return <section className="vac-lab vac-builder">
    <p>{state.successfulRetry
      ? "Twig opened the trip with “Host information unavailable” in place of the missing name."
      : "This browser now uses the safer version of Twig’s trip-details code. Try opening the trip again. It should show “Host information unavailable” instead of an error."}</p>
    <LabChecklist label="Check the fix" items={[{
      label: state.successfulRetry ? "Trip details opened with the fallback host name." : <>Click <strong>Try again</strong> in that trip’s details.</>,
      done: state.successfulRetry,
    }]} />
    {state.successfulRetry && <p role="status">Trip details opened. The issue still has {count} recorded occurrences, and this retry added none.</p>}
    {state.successfulRetry ? <Continue onClick={() => onStage(7)}>Compare the results →</Continue> : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
  </section>;

  return <section className="vac-lab vac-builder">
    <p>Compare what happened when you opened the same trip:</p>
    <dl className="vac-lab-output vac-error-details">
      <div><dt>Before the change</dt><dd>{count} failed attempts to open trip details</dd></div>
      <div><dt>After the change</dt><dd>Trip details opened; this retry added no new error</dd></div>
    </dl>
    <p>The earlier errors stay in the issue’s history. This one successful retry checks the change in your browser. It does not prove a fix has been shipped to everyone.</p>
    <p>In a real workflow, a developer ships the Twig code change, checks that new attempts work and new errors stop, then marks the PostHog issue resolved. That status records the team’s decision; it does not fix Twig’s code.</p>
    <Continue onClick={() => onStage(8)}>Finish lab →</Continue>
  </section>;
}
