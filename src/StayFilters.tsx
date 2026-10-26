"use client";

import type { ReactNode } from "react";
import { staySettings, type StaySetting } from "./settings.js";

export { staySettings } from "./settings.js";
export type { StaySetting } from "./settings.js";

export type StayFiltersProps = {
  legend?: string;
  value: StaySetting;
  onChange: (value: StaySetting) => void;
  id?: string;
  className?: string;
  buttonClassName?: string;
  legendClassName?: string;
  children?: ReactNode;
};

export function StayFilters({
  legend = "Filter by destination type",
  value,
  onChange,
  id,
  className,
  buttonClassName,
  legendClassName,
  children,
}: StayFiltersProps) {
  return (
    <fieldset id={id} className={className}>
      <legend className={legendClassName}>{legend}</legend>
      {children}
      {staySettings.map((setting) => (
        <button
          key={setting}
          data-replay-label={`Filter: ${setting}`}
          type="button"
          aria-pressed={value === setting}
          className={buttonClassName}
          onClick={() => onChange(setting)}
        >
          {setting === "All" ? "All locations" : setting}
        </button>
      ))}
    </fieldset>
  );
}


export const amenityOptions = [
  { value: "beach-access", label: "Beach access" },
  { value: "fire-pit", label: "Fire pit" },
  { value: "lake-access", label: "Lake access" },
] as const;
export type StayAmenity = typeof amenityOptions[number]["value"];

export function matchesStayAmenities(amenities: readonly string[], selected: readonly StayAmenity[]) {
  const patterns: Record<StayAmenity, RegExp> = { "beach-access": /beach access/i, "fire-pit": /fire pit/i, "lake-access": /lake access/i };
  return selected.every(value => amenities.some(amenity => patterns[value].test(amenity)));
}

export function AmenityFilters({ value, onChange }: { value: readonly StayAmenity[]; onChange: (value: StayAmenity, selected: boolean) => void }) {
  return <fieldset className="vac-amenity-filters"><legend>Amenities</legend>
    {amenityOptions.map(option => <label key={option.value}>
      <input type="checkbox" checked={value.includes(option.value)} data-replay-label={`Amenity: ${option.label}`} onChange={event => onChange(option.value, event.target.checked)} />
      {option.label}
    </label>)}
  </fieldset>;
}
