"use client";

import { useEffect, useRef } from "react";

export type ActivityEvent = { id: string; event: string; timestamp?: string; properties: Record<string, unknown>; /** Shown beside the event name, so a fast stream of the same event stays countable. */ number?: number };

const time = (timestamp?: string) => {
  const date = timestamp ? new Date(timestamp) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour12: false }) : "";
};
const show = (value: unknown) => value !== null && typeof value === "object" ? JSON.stringify(value) : String(value);

/** PostHog's Activity tab in miniature: recorded events, newest first, and the selected event's properties. */
export function ActivityPreview({ events, selected, onSelect, highlightNew = false, compact = false }: {
  events: readonly ActivityEvent[]; selected: ActivityEvent; onSelect: (id: string) => void;
  /** Tighter rows and a capped properties table, for a lab step that has to fit the dock. */
  compact?: boolean;
  /** Flash rows that arrived since the last render, so a new event is easy to spot. */
  highlightNew?: boolean;
}) {
  // Rows that arrived after the first render keep their marker, so each flash runs to the end.
  // Removing it mid-animation can leave the highlight painted in Chrome.
  const seen = useRef<Set<string> | null>(null);
  const arrived = useRef(new Set<string>());
  if (highlightNew && seen.current) {
    for (const event of events) if (!seen.current.has(event.id)) arrived.current.add(event.id);
  }
  const isNew = (id: string) => arrived.current.has(id);
  useEffect(() => { seen.current = new Set([...(seen.current ?? []), ...events.map((event) => event.id)]); }, [events]);
  return <section className={`vac-activity-preview${compact ? " vac-activity-compact" : ""}`} aria-label="PostHog Activity preview">
    <div className="vac-activity-heading"><strong>Twig playground events</strong></div>
    <div className="vac-activity-list"><table className="vac-lab-table" aria-label="Recorded events"><thead><tr><th scope="col">Event</th><th scope="col">Time</th></tr></thead><tbody>{[...events].reverse().map(event => <tr key={event.id} className={event.id === selected.id ? "is-selected" : undefined} data-new={isNew(event.id) ? "true" : undefined}><td><button type="button" aria-pressed={event.id === selected.id} onClick={() => onSelect(event.id)}><code>{event.event}</code>{event.number !== undefined && <span className="vac-activity-number">#{event.number}</span>}</button></td><td><time dateTime={event.timestamp}>{time(event.timestamp)}</time></td></tr>)}</tbody></table></div>
    <div className="vac-activity-detail"><div className="vac-activity-property-heading">Properties</div><table className="vac-lab-table vac-lab-table-key-value" aria-label="Event properties"><thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead><tbody>{Object.entries(selected.properties).map(([name, value]) => <tr key={name}><td><code>{name}</code></td><td><code>{show(value)}</code></td></tr>)}{!Object.keys(selected.properties).length && <tr><td colSpan={2}>No custom properties</td></tr>}</tbody></table></div>
  </section>;
}
