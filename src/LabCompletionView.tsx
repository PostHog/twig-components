"use client";

import { LabCompletionActions } from "./LabNavigation.js";
import type { RefObject } from "react";
import { touchpointDefinitions, type TouchpointId } from "./playground.js";

const recaps: Record<TouchpointId, { title: string; points: string[] }> = {
  catalog: {
    title: "You recorded the correct setting for each click.",
    points: [
      "Found why a fixed value mislabels filter clicks.",
      "Recorded each filter’s actual setting and checked the results.",
    ],
  },
  discovery: {
    title: "You captured both successful and failed AI requests.",
    points: [
      "Connected a request to the model’s response.",
      "Recorded a failed request so the error is visible too.",
    ],
  },
  booking: {
    title: "You counted confirmed bookings, not just clicks.",
    points: [
      "Followed a successful booking from attempt to confirmation.",
      "Checked that a failed request does not count as a completed booking.",
    ],
  },
  stay: {
    title: "You connected each view event to the right stay.",
    points: [
      "Saw why identical view events cannot distinguish stays.",
      "Grouped view events by their listing ID.",
    ],
  },
  replay: {
    title: "You’ve captured a visitor’s journey.",
    points: [
      "Followed a ghost visitor across Twig.",
      "Recorded your own visit and opened its replay with your masking setting.",
    ],
  },
  errors: {
    title: "You traced the trip-details error, repaired Twig's host lookup, and resolved the example issue.",
    points: [
      "Used the exception and stack trace to find where Twig failed.",
      "Used the stay ID to inspect the broken host lookup.",
      "Saw the host name return without adding a new exception.",
    ],
  },
};

export function LabCompletionView({
  lab,
  onChoose,
  onReview,
  headingRef,
  title,
  recap: customRecap,
}: {
  title?: string;
  recap?: { title: string; points: string[] };
  lab: TouchpointId;
  onChoose: () => void;
  onReview?: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const recap = customRecap ?? recaps[lab];
  return (
    <section className="vac-lab vac-lab-completion" aria-label="Lab complete">
      <h3 className="vac-completion-title" ref={headingRef} tabIndex={-1}>
        <span className="vac-completion-check" aria-hidden="true">
          ✓
        </span>
        <span>{title ?? `${touchpointDefinitions[lab].title} complete`}</span>
      </h3>
      <p>{recap.title}</p>
      <div className="vac-guide-example">
        <h4>What you learned</h4>
        <ul>
          {recap.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
      <LabCompletionActions onChoose={onChoose} onReview={onReview} />
    </section>
  );
}
