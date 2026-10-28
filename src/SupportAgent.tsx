"use client";
import { useEffect, useId, useRef, useState } from "react";
import { LabResetIcon } from "./LabNavigation.js";
import { AiSearchIcon } from "./TripPlanner.js";
import { tripPlannerInputLimit, tripPlannerTurnLimit } from "./trip-planner.js";
import {
  supportCases,
  type SupportCase,
  type SupportRun,
} from "./support-evals.js";

export type SupportMessage = { input: string; output: string };
/** Twig chat surface. Prepared input belongs only to an active guided lab. */
export function SupportAgent({
  caseId = "saved",
  run,
  guided = false,
  conversation = [],
  pending = false,
  onSend,
  onReset,
  accessory,
  highlighted = false,
}: {
  guided?: boolean;
  conversation?: readonly SupportMessage[];
  pending?: boolean;
  highlighted?: boolean;
  caseId?: SupportCase;
  run?: SupportRun;
  onSend: (message: string) => void;
  onReset: () => void;
  accessory?: import("react").ReactNode;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (guided && run && sent.current) {
      heading.current?.focus({ preventScroll: true });
      sent.current = false;
    }
  }, [run, guided]);
  useEffect(() => {
    if (!guided && !pending && sent.current) {
      input.current?.focus({ preventScroll: true });
      sent.current = false;
    }
  }, [pending, guided]);
  const turns = guided
    ? run
      ? [{ input: run.input, output: run.output }]
      : []
    : conversation;
  const message = guided ? supportCases[caseId].input : draft;
  const atLimit = !guided && turns.length >= tripPlannerTurnLimit;
  function submit() {
    if (pending || atLimit || !message.trim()) return;
    sent.current = true;
    onSend(message.trim());
    if (!guided) setDraft("");
  }
  return (
    <section
      className="twig-trip-planner twig-trip-planner-window twig-trip-planner-inline twig-getaway-window twig-support-agent"
      aria-labelledby={id}
    >
      <header className="twig-trip-planner-header">
        <h2 ref={heading} tabIndex={-1} id={id}>
          <AiSearchIcon /> Support agent
        </h2>
        <button
          className="twig-trip-planner-close"
          onClick={() => {
            setDraft("");
            onReset();
            if (!guided) input.current?.focus();
          }}
          aria-label="Reset support conversation"
        >
          <LabResetIcon />
        </button>
      </header>
      <div className="twig-trip-planner-history" hidden={!turns.length}>
        <ol
          className="twig-trip-planner-log"
          role="log"
          aria-label="Support conversation"
          aria-live="polite"
          aria-busy={pending}
        >
          {turns.map((turn, index) => (
            <li key={index} className="twig-trip-planner-exchange">
              <div className="twig-trip-planner-message" data-speaker="visitor">
                <span className="vac-sr-only">Customer: </span>
                <p>{turn.input}</p>
              </div>
              {turn.output && (
                <div
                  className="twig-trip-planner-message"
                  data-speaker="assistant"
                >
                  <span className="vac-sr-only">Support agent: </span>
                  <p>{turn.output}</p>
                </div>
              )}
            </li>
          ))}
        </ol>
        {pending && (
          <div className="twig-trip-planner-status" role="status">
            Twig is typing…
          </div>
        )}
      </div>
      <div className="twig-trip-planner-bottom">
        {(!guided || !run) && (
          <form
            className={`twig-trip-planner-form${
              highlighted ? " vac-lab-target" : ""
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="twig-trip-planner-compose">
              <textarea
                ref={input}
                aria-label="Customer message"
                placeholder="How can we help with your stay?"
                readOnly={guided}
                disabled={pending || atLimit}
                maxLength={tripPlannerInputLimit}
                rows={3}
                value={message}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Send customer message"
                disabled={pending || atLimit || !message.trim()}
              >
                ↑
              </button>
            </div>
          </form>
        )}
        {atLimit && (
          <p className="twig-trip-planner-status" role="status">
            Reset the conversation to start again.
          </p>
        )}
        {accessory && (
          <div className="twig-trip-planner-footer">{accessory}</div>
        )}
      </div>
    </section>
  );
}
