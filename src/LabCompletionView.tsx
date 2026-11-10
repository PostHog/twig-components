"use client";

import { LabCompletionActions } from "./LabNavigation.js";
import type { RefObject } from "react";
import { touchpointDefinitions, type TouchpointId } from "./playground.js";

const recaps: Record<TouchpointId, { title: string; points: string[] }> = {
  evaluations: { title: "Offline and online evaluations", points: ["Test known cases before shipping.", "Monitor production for missed cases.", "Choose an eval that measures the quality you care about."] },
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
    title: "You captured Twig's trip-details exception, fixed the host lookup, and resolved the issue.",
    points: [
      "Saw autocapture catch an uncaught error, then sent a caught one with captureException.",
      "Read the stack trace and grouped missing hosts with a fingerprint.",
      "Dropped browser noise in before_send and saw the IDs that join exceptions to other data.",
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
