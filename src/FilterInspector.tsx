"use client";

import { useId, useState } from "react";
import {
  summarizeFilterEvents,
  type LabState,
  type LabEvent,
} from "./filter-lab.js";

export function FilterInspector({
  state,
  onPractice,
  filterHref,
  bounded = false,
}: {
  state: LabState;
  bounded?: boolean;
  onPractice: () => void;
  filterHref: string;
}) {
  const detailId = useId();
  const [selection, setSelection] = useState<LabEvent | null>(null);
  const selected =
    selection && state.events.includes(selection)
      ? selection
      : state.events.at(-1);
  const summary = summarizeFilterEvents(state.events);
  const applied = state.applied;
  if (!applied)
    return (
      <div className="vac-lab-output">
        <p>
          Apply your event in the exercise first. Then click Forest and Coast to
          compare their events here.
        </p>
        <button className="vac-button" onClick={onPractice}>
          <span className="vac-os-button-face">Continue the exercise →</span>
        </button>
      </div>
    );
  if (!selected)
    return (
      <div className="vac-lab-output">
        <h4>No events yet</h4>
        <p>Click Forest, then Coast to compare their events.</p>
        <a className="vac-browse-link" href={filterHref}>
          Go to the filters ↗
        </a>
      </div>
    );
  const matches = selected.clicked === selected.properties.destination_type;
  return (
    <>
      <p className="vac-muted" role="status">
        {state.events.length} local events · {summary.mismatches}{" "}
        {summary.mismatches === 1 ? "mismatch" : "mismatches"}
      </p>
      <div
        className="vac-filter-comparisons"
        role="group"
        aria-label="Recorded clicks"
      >
        <div className="vac-filter-comparison-head" aria-hidden="true">
          <span>Clicked</span>
          <span>Recorded</span>
          <span>Result</span>
        </div>
        <div className="vac-filter-comparison-list">
          {state.events.map((event) => {
            const match = event.clicked === event.properties.destination_type;
            return (
              <button
                key={event.id}
                type="button"
                className="vac-filter-comparison-row"
                aria-pressed={selected.id === event.id}
                aria-controls={detailId}
                aria-label={`Event ${event.id}: clicked ${
                  event.clicked
                }, recorded ${event.properties.destination_type}, ${
                  match ? "match" : "mismatch"
                }`}
                onClick={() => setSelection(event)}
              >
                <span>
                  <small>#{event.id}</small> {event.clicked}
                </span>
                <code>{event.properties.destination_type}</code>
                <span className="vac-filter-match" data-mismatch={!match}>
                  {match ? "Match" : "Mismatch"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <section
        id={detailId}
        className="vac-lab-output"
        aria-label={`Event ${selected.id} comparison`}
      >
        <h4>Event #{selected.id}</h4>
        <code className="vac-inspect-name">{selected.event}</code>
        <dl className="vac-event-comparison">
          <div>
            <dt>Clicked on Twig</dt>
            <dd>{selected.clicked}</dd>
          </div>
          <div data-mismatch={!matches}>
            <dt>Recorded destination type</dt>
            <dd>{selected.properties.destination_type}</dd>
          </div>
        </dl>
        <p>
          {matches
            ? "These values match."
            : "Mismatch: the event describes a different filter from the one clicked."}
        </p>
        <p className="vac-muted">
          {applied.source === "fixed"
            ? `The source is a fixed value: ${applied.fixedValue}. Every click records that value, even when a different filter is selected.`
            : "The value comes from the clicked filter, so it changes with the interaction."}
        </p>
      </section>
      {state.before.some((event) => event.clicked === selected.clicked) && (
        <div className="vac-ai-compare">
          <h4>Same click, different instrumentation</h4>
          <dl>
            <dt>Before · fixed value</dt>
            <dd>
              {selected.clicked} →{" "}
              {
                state.before.find((event) => event.clicked === selected.clicked)
                  ?.properties.destination_type
              }
            </dd>
            <dt>
              Now ·{" "}
              {applied.source === "clicked" ? "clicked value" : "fixed value"}
            </dt>
            <dd>
              {selected.clicked} → {selected.properties.destination_type}
            </dd>
          </dl>
        </div>
      )}
      {!bounded && applied.source === "fixed" && (
        <button className="vac-button" onClick={onPractice}>
          <span className="vac-os-button-face">
            Connect the clicked value →
          </span>
        </button>
      )}
    </>
  );
}
