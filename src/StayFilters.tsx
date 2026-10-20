"use client";

import type { ReactNode } from "react";
import { staySettings, type StaySetting } from "./settings.js";

export { staySettings } from "./settings.js";
export type { StaySetting } from "./settings.js";

export type StayFiltersProps = {
  value: StaySetting;
  onChange: (value: StaySetting) => void;
  id?: string;
  className?: string;
  buttonClassName?: string;
  legendClassName?: string;
  children?: ReactNode;
};

export function StayFilters({
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
      <legend className={legendClassName}>Filter by destination type</legend>
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
