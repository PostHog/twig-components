"use client";

import { useId, type ReactNode } from "react";

export function LabChoices<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: ReactNode;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="vac-source-picker">
      <legend>{label}</legend>
      <div className="vac-lab-choice-list">
        {options.map((option) => (
          <label key={option.value} data-selected={value === option.value}>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
