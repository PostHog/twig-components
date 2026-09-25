"use client";

import type { ReactElement } from "react";
import type { TouchpointId } from "./playground.js";

export function LabNavigationView({
  selected,
  stage,
  embedded,
  onAllLabs,
  onPrevious,
  onReset,
}: {
  selected: TouchpointId | null;
  stage: number;
  embedded: boolean;
  onAllLabs: () => void;
  onPrevious: () => void;
  onReset: () => void;
}): ReactElement | null {
  if (!selected) return null;
  return (
    <div className="vac-lab-navigation">
      {!embedded && (
        <button className="vac-text-button" onClick={onAllLabs}>
          All labs
        </button>
      )}
      {["replay", "catalog", "discovery", "booking", "stay"].includes(selected) && (
        <>
          {stage > 0 && (!embedded || stage > 1) && (
            <button
              className="vac-text-button"
              title="Go back without clearing your results"
              onClick={onPrevious}
            >
              <span aria-hidden="true">← </span>Previous step
            </button>
          )}
          <button
            className="vac-text-button vac-lab-reset"
            title="Clear this lab’s results and restore its defaults"
            onClick={onReset}
          >
            {embedded ? "Reset exercise" : "Reset lab"}
          </button>
        </>
      )}
    </div>
  );
}
