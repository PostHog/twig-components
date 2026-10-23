"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { DatePicker, addDateDays } from "./DatePicker.js";
import { GuestPicker } from "./GuestPicker.js";
import type { TripSelection, TripErrors } from "./trip-dates.js";
import { filterStays, type Stay } from "./catalog.js";
import { StayFilters, type StaySetting } from "./StayFilters.js";

export type BrowseStaysProps = {
  primarySearch?: ReactNode | ((filters: ReactNode) => ReactNode);
  additionalFilters?: ReactNode;
  activeFilterCount?: number;
  results?: readonly Stay[];
  setting: StaySetting;
  search: string;
  onSettingChange: (setting: StaySetting) => void;
  onSearchChange: (search: string) => void;
  onSearchBlur?: () => void;
  renderStay: (stay: Stay) => ReactNode;
  filterAccessory?: ReactNode;
  afterFilters?: ReactNode;
  filtersClassName?: string;
  filtersId?: string;
  id?: string;
  /** Supply both props to offer a compact, controlled search/filter disclosure. */
  controlsExpanded?: boolean;
  onControlsExpandedChange?: (expanded: boolean) => void;
};

/** Twig's real browsing controls and results. The host owns state, navigation, and tracking. */
export function BrowseStays({
  primarySearch,
  additionalFilters,
  activeFilterCount,
  results,
  setting,
  search,
  onSettingChange,
  onSearchChange,
  onSearchBlur,
  renderStay,
  filterAccessory,
  afterFilters,
  filtersClassName = "",
  filtersId,
  id = "browse",
  controlsExpanded = true,
  onControlsExpandedChange,
}: BrowseStaysProps) {
  const visible = results ?? filterStays(setting, search);
  const searchId = `${id}-search`;
  const titleId = `${id}-title`;
  const controlsId = `${id}-controls`;
  const activeCount = activeFilterCount ?? (Number(setting !== "All") + (primarySearch ? 0 : Number(Boolean(search.trim()))));

  const integrated = typeof primarySearch === "function";
  const filterToggle = onControlsExpandedChange && <button
    type="button" className="vac-filter vac-browse-toggle" data-replay-label="Open filters"
    aria-expanded={controlsExpanded} aria-controls={controlsId}
    onClick={() => onControlsExpandedChange(!controlsExpanded)}
  >
    {primarySearch ? "Filters" : "Search & filters"}{activeCount > 0 ? ` (${activeCount})` : ""} <span aria-hidden="true">{controlsExpanded ? "−" : "+"}</span>
  </button>;
  const filterPanel = <div id={controlsId} className={integrated ? "vac-trip-filter-panel" : undefined} hidden={!controlsExpanded}>
    {!primarySearch && <div className="vac-browse-search">
      <label htmlFor={searchId}>Search stays</label>
      <input id={searchId} className="vac-stay-search" type="search" placeholder="Name, region, or setting" value={search} onChange={event => onSearchChange(event.target.value)} onBlur={onSearchBlur} />
    </div>}
    <StayFilters
      id={filtersId ?? `${id}-filters`} value={setting} onChange={onSettingChange}
      buttonClassName="vac-filter" legendClassName={integrated ? undefined : "vac-sr-only"}
      legend={integrated ? "Setting" : undefined}
      className={`vac-filters${filtersClassName ? ` ${filtersClassName}` : ""}`}
    >{filterAccessory}</StayFilters>
    {additionalFilters}
  </div>;
  return (
    <section id={id} className="vac-catalog" aria-labelledby={titleId}>
      {integrated ? primarySearch(<div className="vac-trip-filter-controls">{filterToggle}{filterPanel}</div>) : primarySearch}
      <div className="vac-browse-toolbar">
        <div><h2 id={titleId}>Browse stays</h2></div>
        {!integrated && filterToggle}
      </div>
      {!integrated && filterPanel}
      {afterFilters}
      <p className="vac-sr-only" role="status">
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


export type TripSearchValue = TripSelection & { destination: string };

/** A controlled trip search. Hosts own filtering, validation, booking state, and analytics. */
export function TripSearch({ value, minDate, capacity, errors = {}, destinations = [], onDestinationSelect, filters, onChange, onSubmit }: {
  destinations?: readonly string[];
  onDestinationSelect?: (destination: string) => void;
  filters?: ReactNode;
  value: TripSearchValue;
  minDate: string;
  capacity: number;
  errors?: TripErrors;
  onChange: (value: TripSearchValue) => void;
  onSubmit: () => void;
}) {
  return <form className="vac-trip-search" aria-label="Find a stay" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
    <div className="vac-trip-search-destination">
      <DestinationSearch value={value.destination} destinations={destinations}
        onChange={destination => onChange({ ...value, destination })}
        onSelect={onDestinationSelect} />
    </div>
    <div id="trip-search-options" className="vac-trip-search-options">
    <div>
      <label htmlFor="trip-search-check-in">Check in</label>
      <DatePicker id="trip-search-check-in" label="Check in" value={value.checkIn} minDate={minDate}
        invalid={!!errors.checkIn} describedBy={errors.checkIn ? "trip-search-check-in-error" : undefined}
        onChange={checkIn => { onChange({ ...value, checkIn, checkOut: value.checkOut && value.checkOut <= checkIn ? "" : value.checkOut }); }} />
      {errors.checkIn && <p className="vac-field-error" id="trip-search-check-in-error">{errors.checkIn}</p>}
    </div>
    <div>
      <label htmlFor="trip-search-check-out">Check out</label>
      <DatePicker id="trip-search-check-out" label="Check out" value={value.checkOut} minDate={value.checkIn ? addDateDays(value.checkIn, 1) : minDate}
        invalid={!!errors.checkOut} describedBy={errors.checkOut ? "trip-search-check-out-error" : undefined}
        onChange={checkOut => { onChange({ ...value, checkOut }); }} />
      {errors.checkOut && <p className="vac-field-error" id="trip-search-check-out-error">{errors.checkOut}</p>}
    </div>
    <div>
      <label htmlFor="trip-search-guests">Guests</label>
      <GuestPicker id="trip-search-guests" value={value.guests} capacity={capacity}
        invalid={!!errors.guests} describedBy={errors.guests ? "trip-search-guests-error" : undefined}
        onChange={guests => { onChange({ ...value, guests }); }} />
      {errors.guests && <p className="vac-field-error" id="trip-search-guests-error">{errors.guests}</p>}
    </div>
    </div>
    {filters}
    <button className="vac-trip-search-submit" type="submit">Search stays</button>
  </form>;
}


function DestinationSearch({ value, destinations, onChange, onSelect }: {
  value: string; destinations: readonly string[]; onChange: (value: string) => void; onSelect?: (value: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const options = [...new Set(destinations)].filter(destination => destination.toLowerCase().includes(value.trim().toLowerCase()));
  function choose(destination: string) {
    onChange(destination); onSelect?.(destination); setOpen(false); setActive(-1); input.current?.focus();
  }
  return <div className="vac-destination-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor="trip-search-destination">Destination</label>
    <input ref={input} id="trip-search-destination" type="text" role="combobox" autoComplete="off" placeholder="City or region"
      value={value} aria-autocomplete="list" aria-expanded={open} aria-controls={open ? id : undefined}
      aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
      onFocus={() => setOpen(true)}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); setOpen(true);
          setActive(previous => !options.length ? -1 : previous < 0 ? (event.key === "ArrowDown" ? 0 : options.length - 1) : (previous + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
        }
        if (event.key === "Enter" && open && options[active]) { event.preventDefault(); choose(options[active]); }
      }} />
    {open && <div className="vac-destination-panel twig-dropdown-menu">
      <ul id={id} role="listbox" aria-label="Destinations">
        {options.map((destination, index) => <li key={destination} role="presentation">
          <button type="button" className="twig-dropdown-item" role="option" id={`${id}-${index}`} aria-selected={active === index} tabIndex={-1} data-replay-label={`Destination: ${destination}`}
            onMouseDown={event => event.preventDefault()} onClick={() => choose(destination)}>{destination}</button>
        </li>)}
      </ul>
      {!options.length && <p role="status">No matching destinations.</p>}
    </div>}
  </div>;
}
