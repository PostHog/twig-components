"use client";

import { useId, type ReactNode } from "react";

export function EvidenceTabs<T extends string>({ label, value, options, onChange, children }: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  const id = useId();
  return <>
    <div className="vac-request-tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => <button key={option.value} type="button" role="tab"
        id={`${id}-${option.value}`} data-field={option.value}
        aria-selected={value === option.value} aria-controls={`${id}-panel`}
        tabIndex={value === option.value ? 0 : -1}
        onClick={() => onChange(option.value)}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
            (index + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
          const nextValue = options[nextIndex].value;
          onChange(nextValue);
          event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-field="${nextValue}"]`)?.focus();
        }}
      >{option.label}</button>)}
    </div>
    <div className="vac-request-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0}>{children}</div>
  </>;
}
