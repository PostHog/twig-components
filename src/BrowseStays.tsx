"use client";

import type { ReactNode } from "react";
import { filterStays, type Stay } from "./catalog.js";
import { StayFilters, type StaySetting } from "./StayFilters.js";

export type BrowseStaysProps = {
  setting: StaySetting;
  search: string;
  onSettingChange: (setting: StaySetting) => void;
  onSearchChange: (search: string) => void;
  onSearchBlur?: () => void;
  renderStay: (stay: Stay) => ReactNode;
  filterAccessory?: ReactNode;
  filtersClassName?: string;
  filtersId?: string;
  id?: string;
};

/** Twig's real browsing controls and results. The host owns state, navigation, and tracking. */
export function BrowseStays({
  setting,
  search,
  onSettingChange,
  onSearchChange,
  onSearchBlur,
  renderStay,
  filterAccessory,
  filtersClassName = "",
  filtersId,
  id = "browse",
}: BrowseStaysProps) {
  const visible = filterStays(setting, search);
  const searchId = `${id}-search`;
  const titleId = `${id}-title`;

  return (
    <section id={id} className="vac-catalog" aria-labelledby={titleId}>
      <div>
        <span className="vac-eyebrow">Explore</span>
        <h2 id={titleId}>Browse stays</h2>
      </div>
      <label htmlFor={searchId}>Search stays</label>
      <input
        id={searchId}
        className="vac-stay-search"
        type="search"
        placeholder="Name, region, or setting"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onBlur={onSearchBlur}
      />
      <StayFilters
        id={filtersId ?? `${id}-filters`}
        value={setting}
        onChange={onSettingChange}
        buttonClassName="vac-filter"
        legendClassName="vac-sr-only"
        className={`vac-filters${filtersClassName ? ` ${filtersClassName}` : ""}`}
      >
        {filterAccessory}
      </StayFilters>
      <p className="vac-muted" role="status">
        {visible.length} {visible.length === 1 ? "stay" : "stays"}
      </p>
      {visible.length ? (
        <div className="vac-stay-grid">{visible.map(renderStay)}</div>
      ) : (
        <p className="vac-empty-stays">No stays match this search.</p>
      )}
    </section>
  );
}
