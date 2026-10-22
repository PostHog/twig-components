"use client";

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

function PostHogExceptionRow({ occurrence, highlightMessage = false }: {
  occurrence: ErrorOccurrence | undefined;
  highlightMessage?: boolean;
}) {
  return <>
    <div className="vac-error-posthog-list-heading">Exceptions</div>
    <div className="vac-error-posthog-selected" aria-label="Selected exception">
      <strong>{occurrence?.type}</strong>
      <code>{highlightMessage ? <HighlightErrorMessage message={occurrence?.message ?? ""} /> : occurrence?.message}</code>
    </div>
  </>;
}

function PostHogExceptionProperties({ occurrence, highlightStayId = false }: {
  occurrence: ErrorOccurrence | undefined;
  highlightStayId?: boolean;
}) {
  return <section className="vac-lab-output vac-error-posthog-preview" aria-label="Example PostHog exception properties">
    <PostHogExceptionRow occurrence={occurrence} />
    <div className="vac-error-posthog-list-heading">Properties</div>
    <table className="vac-lab-table vac-lab-table-key-value vac-error-posthog-table vac-error-posthog-properties-table" aria-label="Selected exception properties">
      <thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead>
      <tbody>
        <tr><td><code>surface</code></td><td><code>trip_details</code></td></tr>
        <tr><td><code>stay_id</code></td><td><code>{highlightStayId ? <mark>{occurrence?.stayId}</mark> : occurrence?.stayId}</code></td></tr>
      </tbody>
    </table>
  </section>;
}

function PostHogStackTrace({ occurrence }: { occurrence: ErrorOccurrence | undefined }) {
  return <section className="vac-lab-output vac-error-posthog-preview" aria-label="Example PostHog stack trace">
    <PostHogExceptionRow occurrence={occurrence} highlightMessage />
    <div className="vac-error-posthog-list-heading">Stack Trace</div>
    <div className="vac-error-posthog-stack">
      <PlaygroundCodeBlock aria-label="Stack frames">at <mark>readTripHost</mark> (trip-details.ts){"\n"}at openTripDetails (AccountPages.tsx)</PlaygroundCodeBlock>
    </div>
  </section>;
}

function PostHogExceptionExplanation({ onStage }: { onStage: (stage: number) => void }) {
  const { state } = useErrorTrackingLab();
  const last = state.occurrences.at(-1);

  return <section className="vac-lab vac-builder">
    <p>Twig couldn't open your trip details. PostHog Error Tracking helps pinpoint why: it records the failure as an <strong>exception</strong>, one error event with clues about what went wrong. The stay ID links the event to your booking.</p>
    <PostHogExceptionProperties occurrence={last} />
    <p>PostHog keeps this exception in an <strong>issue</strong>, a group of similar errors. The selected exception's <strong>stack trace</strong> lists the functions Twig was running when it failed, helping pinpoint where in Twig's code the error happened.</p>
    <PostHogStackTrace occurrence={last} />
    <p>To read a stack trace, start at the top, closest to the failure, and compare it with the error message. Twig tried to read <code>name</code> from <code>undefined</code>, so it looks like there's a missing value. The first function, <code>readTripHost</code>, retrieves the host's name for the stay details.</p>
    <Continue onClick={() => onStage(4)}>See how errors are grouped →</Continue>
  </section>;
}

function PostHogIssueInvestigation({ onStage }: { onStage: (stage: number) => void }) {
  const { state, dispatch } = useErrorTrackingLab();
  const last = state.occurrences.at(-1);
  const bookedStay = stays.find((stay) => stay.id === state.booking?.stayId);

  return <section className="vac-lab vac-builder">
    <p>In PostHog, the issue's stack trace points to <code>readTripHost</code>.</p>
    <PostHogStackTrace occurrence={last} />
    <p>The exception's properties show the stay ID Twig sent with the error.</p>
    <PostHogExceptionProperties occurrence={last} highlightStayId />
    <p>The stay ID in PostHog points to this booking in Twig. The book's data and trip-details code show why the host lookup failed.</p>
    <p>Stay <code>{last?.stayId}</code> points to host <code>{bookedStay?.hostId}</code>. But trip details passes an empty set of host records to <code>readTripHost</code>, so the lookup returns no host:</p>
    <PlaygroundCodeBlock className="vac-booking-code">{"readTripHost({}, stay.hostId);"}</PlaygroundCodeBlock>
    <p>The fix for this is to pass Twig's loaded host records instead:</p>
    <PlaygroundCodeBlock className="vac-booking-code">{"readTripHost(hosts, stay.hostId);"}</PlaygroundCodeBlock>
    {!state.hostLookupRepaired && <LabChecklist label="Repair the host lookup" items={[{ label: <>Click <strong>Apply the Twig repair</strong>.</>, done: false }]} />}
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
    <p>After reloading trip details, Twig now shows <strong>{bookedHost?.name}</strong> instead of the fallback. This load added no new exception.</p>
    <IssuePreview count={state.occurrences.length} resolved={state.resolved} />
    <p>The earlier failures stay in the issue's history.</p><LabChecklist label="Resolve the issue" items={[{ label: <>Click <strong>Resolve the issue</strong> to mark it handled.</>, done: state.resolved }]} />
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
    <p>In a PostHog project, an <strong>issue</strong> groups similar exceptions using clues like their type, message, and stack trace. Each <strong>occurrence</strong> is one captured failure, not one person. An issue can include failures from different people and devices.</p>
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
    <PlaygroundCodeBlock className="vac-booking-code">{"return host.name;"}</PlaygroundCodeBlock>
    <p>The Twig code fix avoids reading a name from a missing host and shows a message if no name is available:</p>
    <PlaygroundCodeBlock className="vac-booking-code">{"return host?.name ??\n  'Host information unavailable';"}</PlaygroundCodeBlock>
    <LabChecklist label="Apply the fallback" items={[{ label: <>Click <strong>Apply the Twig code fix</strong>.</>, done: false }]} />
    <Continue onClick={() => { dispatch({ type: "fix" }); onStage(6); }}>Apply the Twig code fix →</Continue>
  </section>;

  if (stage === 6) return <section className="vac-lab vac-builder">
    {state.successfulRetry ? <>
      <p>With the fallback in place, Twig opened the trip details and used <code>Host information unavailable</code> in place of the missing name. This retry added no new exception.</p>
      <p>The fallback stopped the crash, but the host's name is still missing. Next, inspect why Twig couldn't load the host record.</p>
    </> : <>
      <p>Twig now uses the fallback in this browser.</p>
      <LabChecklist label="Check the fallback" items={[{
        label: <>Click <strong>Try again</strong> in Twig’s trip details to see what happens.</>, done: false,
      }]} />
    </>}
    {state.successfulRetry ? <Continue onClick={() => onStage(7)}>Inspect the missing host →</Continue> : <Continue onClick={onFocusDetails}>Show your booking →</Continue>}
  </section>;

  if (stage === 7) return <PostHogIssueInvestigation onStage={onStage} />;

  if (stage === 8 || stage === 9) return state.hostVerified
    ? <PostHogIssueResolution onStage={onStage} />
    : <section className="vac-lab vac-builder">
      <p>The repair is applied to Twig's trip-details lookup in this lab.</p>
      <LabChecklist label="Check the host repair" items={[{
        label: <>Click <strong>Trip details</strong> in Twig to reload this booking and check the host's name.</>, done: false,
      }]} />
      <Continue onClick={onFocusDetails}>Show your booking →</Continue>
    </section>;

  return <section className="vac-lab vac-builder">
    <h3>{touchpointDefinitions.errors.title} complete</h3>
    <p>The exception, stack trace, and stay ID pointed to the broken host lookup. The Twig repair restored the host name in trip details. That successful load added no new occurrence before the issue was marked resolved.</p>
  </section>;
}
