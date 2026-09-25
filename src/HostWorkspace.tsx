"use client";

import { stayLabel, type Stay } from "./catalog.js";

export type HostWorkspaceProps = {
  hostId: string;
  personId: string;
  stay: Stay;
  available: boolean;
  onAvailabilityChange: (available: boolean) => void;
};

/** The Twig host-side control. The host supplies an authenticated person and host. */
export function HostWorkspace({
  hostId,
  personId,
  stay,
  available,
  onAvailabilityChange,
}: HostWorkspaceProps) {
  return (
    <section className="vac-host-workspace" aria-label="Host workspace">
      <span className="vac-eyebrow">Host workspace</span>
      <h2>{stayLabel(stay)}</h2>
      <dl className="vac-host-workspace-identity">
        <div><dt>Host ID</dt><dd>{hostId}</dd></div>
        <div><dt>Team member</dt><dd>{personId}</dd></div>
      </dl>
      <div className="vac-host-workspace-actions">
        <span>Availability</span>
        <button
          type="button"
          aria-pressed={available}
          onClick={() => onAvailabilityChange(!available)}
        >
          {available ? "Available" : "Unavailable"}
        </button>
      </div>
    </section>
  );
}
