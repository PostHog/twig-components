"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createTripPlannerRequest, type TripPlannerRecord, type TripPlannerRequest } from "./trip-planner-records.js";
import { capacityPrompt, createCapacityRequest, type CapacityScenario } from "./trip-planner-capacity.js";
import { type Stay } from "./catalog.js";
import {
  initialTripPlannerState,
  tripPlannerInputLimit,
  tripPlannerPrompts,
  tripPlannerSuggestions,
  tripPlannerTurnLimit,
} from "./trip-planner.js";

export type TripPlannerProps = {
  stays: readonly Stay[];
  /** Lab-only scenario. Remount when changing it to cancel pending answers. */
  scenario?: CapacityScenario;
  /** The host supplies routing, link presentation, and any click analytics. */
  renderStayLink: (stay: Stay) => ReactNode;
  accessory?: ReactNode;
  inputId?: string;
  /** Hide both the launcher and its portal while preserving conversation state. */
  hidden?: boolean;
  /** Host layout styling for the portaled window. */
  windowClassName?: string;
  /** Switch to a host-owned panel while keeping this conversation. */
  windowAction?: { label: string; onSelect: () => void };
  launcherLabel?: string;
  /** Optional guided-lab guard, checked by both the button and submit handler. */
  canSendMessage?: (message: string) => boolean;
  /** Lets a guided host reset its lesson and remount the chat together. */
  onReset?: () => void;
  /** One local record per completed answer. No records are sent by this component. */
  onRequestComplete?: (record: TripPlannerRecord) => void;
};

function SendIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 19V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Local scripted chat. The host owns catalog data, routing, and analytics. */
export function TripPlanner({ scenario, stays, renderStayLink, accessory, inputId, hidden = false, windowClassName, windowAction, launcherLabel = "Continue your conversation", canSendMessage, onReset, onRequestComplete }: TripPlannerProps) {
  const id = useId();
  const requestId = inputId ?? `${id}-request`;
  const [state, setState] = useState(initialTripPlannerState);
  const [draft, setDraft] = useState<string>(scenario ? capacityPrompt : tripPlannerPrompts.forest);
  const [pending, setPending] = useState<TripPlannerRequest | null>(null);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const session = useRef<{ id: string; nextStartedAt: number } | null>(null);
  const completeCallback = useRef(onRequestComplete);
  useEffect(() => { completeCallback.current = onRequestComplete; }, [onRequestComplete]);
  const input = useRef<HTMLTextAreaElement>(null);
  const entry = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const atLimit = state.turns.length >= tripPlannerTurnLimit;
  const messageLocked = !!draft.trim() && !!canSendMessage && !canSendMessage(draft);
  const started = state.turns.length > 0 || !!pending;
  const visible = open && !hidden;

  useEffect(() => {
    if (!pending) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      setState(pending.state);
      setDraft(tripPlannerSuggestions(pending.state)[0] ?? "");
      setPending(null);
      busy.current = false;
      completeCallback.current?.(pending.record);
    }, reducedMotion ? 0 : pending.record.properties.$ai_latency * 1000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (!visible) return;
    // Announce the new window without opening the mobile keyboard automatically.
    heading.current?.focus({ preventScroll: true });
  }, [visible]);

  useEffect(() => {
    const log = transcript.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [state, pending, visible]);

  useEffect(() => {
    const field = input.current;
    if (!field) return;
    let width = field.clientWidth;
    const resize = () => {
      field.style.height = "auto";
      field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
    };
    resize();
    const observer = new ResizeObserver(() => {
      if (field.clientWidth === width) return;
      width = field.clientWidth;
      resize();
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [draft, visible]);

  function send(message: string) {
    if (busy.current || (canSendMessage && !canSendMessage(message))) return;
    if (!message.trim() || message.trim().length > tripPlannerInputLimit || atLimit) return;
    const activeSession = session.current ?? { id: crypto.randomUUID(), nextStartedAt: Date.now() };
    const startedAt = Math.max(Date.now(), activeSession.nextStartedAt);
    const identity = {
      sessionId: activeSession.id,
      traceId: crypto.randomUUID(),
      generationId: crypto.randomUUID(),
      startedAt,
    };
    const next = scenario ? createCapacityRequest(stays, identity, scenario) : createTripPlannerRequest(state, message, stays, identity);
    if (!next) return;
    session.current = { id: activeSession.id, nextStartedAt: startedAt + next.record.properties.$ai_latency * 1000 };
    busy.current = true;
    setDraft("");
    setPending(next);
    setOpen(true);
    if (visible) input.current?.focus({ preventScroll: true });
  }

  function close() {
    setOpen(false);
    // Wait for the launcher to replace the initial composer, or vice versa.
    requestAnimationFrame(() => entry.current?.querySelector<HTMLElement>("button, textarea")?.focus({ preventScroll: true }));
  }

  function reset() {
    if (onReset) { onReset(); return; }
    setPending(null);
    busy.current = false;
    session.current = null;
    setState(initialTripPlannerState());
    setDraft(scenario ? capacityPrompt : tripPlannerPrompts.forest);
    input.current?.focus({ preventScroll: true });
  }

  const composer = (
    <form onSubmit={(event) => { event.preventDefault(); send(draft); }}>
      <label className="vac-sr-only" htmlFor={requestId}>Your message</label>
      <div className="twig-trip-planner-compose">
        <textarea
          ref={input}
          id={requestId}
          rows={2}
          value={draft}
          maxLength={tripPlannerInputLimit}
          placeholder={state.stage === "complete" ? "Start over to try another conversation" : "Message Twig…"}
          autoComplete="off"
          readOnly
          aria-describedby={`${visible ? `${id}-window-disclosure` : `${id}-disclosure`}${messageLocked ? ` ${id}-locked` : ""}`}
        />
        <button type="submit" aria-label="Send message" disabled={messageLocked || !!pending || atLimit || !draft.trim()} aria-describedby={messageLocked ? `${id}-locked` : undefined}><SendIcon /></button>
      </div>
      {messageLocked && <p id={`${id}-locked`} className="twig-trip-planner-lock" role="status">Continue in the lab to unlock this message.</p>}
    </form>
  );

  return (
    <>
      <section ref={entry} className="twig-trip-planner" aria-label="Plan your stay" hidden={hidden}>
        {started || open ? (
          <button className="twig-trip-planner-launcher" type="button" aria-haspopup="dialog" aria-expanded={visible} onClick={() => setOpen(true)}>
            {launcherLabel} <span aria-hidden="true">↗</span>
          </button>
        ) : composer}
        <div className="twig-trip-planner-footer">
          <p id={`${id}-disclosure`}>Simulated AI responses</p>
          {accessory}
        </div>
      </section>
      {visible && createPortal(
        <div className={`twig-trip-planner twig-trip-planner-window${windowClassName ? ` ${windowClassName}` : ""}`} role="dialog" aria-labelledby={`${id}-title`} onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
        }}>
          <header className="twig-trip-planner-header">
            <h2 ref={heading} id={`${id}-title`} tabIndex={-1}>Plan your getaway</h2>
            {windowAction && <button type="button" className="twig-trip-planner-window-action" onClick={() => {
              setOpen(false);
              windowAction.onSelect();
            }}>{windowAction.label}</button>}
            <button type="button" className="twig-trip-planner-close" aria-label="Close chat" onClick={close}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </header>
          <div ref={transcript} className="twig-trip-planner-history">
            <ol className="twig-trip-planner-log" role="log" aria-label="Trip planning conversation" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
              {state.turns.map((turn, index) => {
                const stay = stays.find((candidate) => candidate.id === turn.stayId);
                return <li key={index} className="twig-trip-planner-exchange">
                  <div className="twig-trip-planner-message" data-speaker="visitor"><span className="vac-sr-only">You: </span><p>{turn.prompt}</p></div>
                  <div className="twig-trip-planner-message" data-speaker="assistant"><span className="vac-sr-only">Twig: </span><p>{turn.reply}</p>
                    {stay && <div className="twig-trip-planner-stay">{renderStayLink(stay)}</div>}
                  </div>
                </li>;
              })}
              {pending && <li className="twig-trip-planner-message" data-speaker="visitor"><span className="vac-sr-only">You: </span><p>{pending.state.turns.at(-1)?.prompt}</p></li>}
            </ol>
            <div className="twig-trip-planner-status" role="status">{pending ? "Twig is typing…" : atLimit ? "You’ve reached the demo limit. Start over to try again." : ""}</div>
          </div>
          <div className="twig-trip-planner-bottom">
            {composer}
            <div className="twig-trip-planner-footer">
              <p id={`${id}-window-disclosure`}>Simulated AI responses</p>
              <button type="button" className="twig-trip-planner-reset" onClick={reset}>Start over</button>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
