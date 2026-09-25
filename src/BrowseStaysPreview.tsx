import type { ReactElement } from "react";
import { staySettings, type StaySetting } from "./settings.js";

export type BrowseStaysPreviewProps = {
  selected: Exclude<StaySetting, "All">;
  className?: string;
};

/** A read-only excerpt of Twig's Browse stays view for editorial contexts. */
export function BrowseStaysPreview({
  selected,
  className = "",
}: BrowseStaysPreviewProps): ReactElement {
  return (
    <div
      className={`twig-stays-preview ${className}`.trim()}
      role="img"
      aria-label={`Twig Browse stays with the ${selected} filter selected and one ${selected} stay`}
    >
      <div className="twig-stays-preview-inner">
        <span className="twig-stays-preview-kicker">Explore</span>
        <h3>Browse stays</h3>
        <div className="twig-stays-preview-filters" aria-hidden="true">
          {staySettings.map((setting) => (
            <span
              key={setting}
              className="twig-stays-preview-filter"
              data-twig-filter={setting}
              data-selected={setting === selected}
            >
              {setting === "All" ? "All locations" : setting}
            </span>
          ))}
        </div>
        <p className="twig-stays-preview-count">1 stay</p>
        <div className="twig-stays-preview-stay">
          <span className="twig-stays-preview-image" aria-hidden="true" />
          <span data-twig-stay={selected}>{selected} stay</span>
        </div>
      </div>
    </div>
  );
}
