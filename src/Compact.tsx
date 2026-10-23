import type { ReactNode } from "react";
import type { StaySetting } from "./settings.js";

/** Focused Twig surface. State and instrumentation belong to the host. */
export function CompactTwig({ children, headerActions }: { children: ReactNode; headerActions?: ReactNode }) {
  return <section className="twig-compact" aria-label="Twig">
    <header className="twig-compact-header"><TwigWordmark />{headerActions}</header>
    <div className="twig-compact-body">{children}</div>
  </section>;
}
export function TwigWordmark() {
  return <span className="twig-compact-wordmark" aria-label="Twig">twig</span>;
}
export function CompactStayFilters({ value, onChange, options = ["Forest", "Coast", "City"], id }: {
  value: StaySetting | null;
  onChange: (value: StaySetting) => void;
  options?: readonly StaySetting[];
  id?: string;
}) {
  return <fieldset id={id} className="twig-compact-filters">
    <legend className="vac-sr-only">Filter by destination type</legend>
    {options.map(valueOption => <button key={valueOption} type="button" data-replay-label={`Filter: ${valueOption}`}
      aria-pressed={value === valueOption} onClick={() => onChange(valueOption)}>{valueOption === "All" ? "All locations" : valueOption}</button>)}
  </fieldset>;
}
