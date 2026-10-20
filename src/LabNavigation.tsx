"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import type { TouchpointId } from "./playground.js";

export function LabNavigationView({
  selected,
  stage,
  embedded,
  onAllLabs,
  onPrevious,
  onReset,
  returnTo,
  resetScope = "lab",
}: {
  selected: TouchpointId | null;
  stage: number;
  embedded: boolean;
  onAllLabs: () => void;
  onPrevious: () => void;
  onReset: () => void;
  returnTo?: { label: string; onClick: () => void };
  resetScope?: "lab" | "twig";
}): ReactElement | null {
  const [confirmingFor, setConfirmingFor] = useState<TouchpointId | null>(null);
  const confirmationId = useId();
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmingFor === selected) confirmButtonRef.current?.focus();
  }, [confirmingFor, selected]);
  function dismissConfirmation() {
    setConfirmingFor(null);
    resetButtonRef.current?.focus();
  }
  if (!selected) return null;
  const canGoPrevious = stage > 0 && (selected !== "errors" || stage > 1) && (!embedded || stage > 1);
  const resetLabel = embedded && resetScope === "lab" ? "Reset exercise" : "Reset lab";
  const previousButton = <button
    className="vac-text-button"
    type="button"
    title="Go back without clearing your results"
    onClick={() => { setConfirmingFor(null); onPrevious(); }}
  >
    <span aria-hidden="true">← </span><span className="vac-lab-previous-full">Previous step</span><span className="vac-lab-previous-short">Back</span>
  </button>;
  const allLabsButton = <button type="button" className="vac-text-button" onClick={() => { setConfirmingFor(null); onAllLabs(); }}>
    All labs
  </button>;
  const resetButton = <button
    ref={resetButtonRef}
    className="vac-lab-reset-icon"
    type="button"
    aria-label={resetLabel}
    title={resetLabel}
    onClick={() => {
      if (resetScope === "twig") setConfirmingFor(selected);
      else onReset();
    }}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.75 3C5.16421 3 5.5 3.33579 5.5 3.75V5.71122C7.1554 4.03743 9.4791 3 12 3C16.9706 3 21 7.02944 21 12C21 12.3803 20.9764 12.7555 20.9304 13.1241C20.8792 13.5351 20.5044 13.8267 20.0934 13.7755C19.6823 13.7242 19.3907 13.3495 19.4419 12.9384C19.4802 12.6313 19.5 12.3181 19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C9.77612 4.5 7.73561 5.46681 6.3448 7H8.75C9.16421 7 9.5 7.33579 9.5 7.75C9.5 8.16421 9.16421 8.5 8.75 8.5H5.25C4.55964 8.5 4 7.94036 4 7.25V3.75C4 3.33579 4.33579 3 4.75 3ZM3.90663 10.2245C4.31766 10.2758 4.60932 10.6505 4.55806 11.0616C4.51977 11.3687 4.5 11.6819 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5C14.2239 19.5 16.2644 18.5332 17.6552 17H15.2618C14.8476 17 14.5118 16.6642 14.5118 16.25C14.5118 15.8358 14.8476 15.5 15.2618 15.5H18.7618C19.4522 15.5 20.0118 16.0596 20.0118 16.75V20.25C20.0118 20.6642 19.6761 21 19.2618 21C18.8476 21 18.5118 20.6642 18.5118 20.25V18.2768C16.8557 19.9576 14.5269 21 12 21C7.02944 21 3 16.9706 3 12C3 11.6197 3.02364 11.2445 3.06959 10.8759C3.12085 10.4649 3.4956 10.1733 3.90663 10.2245Z" />
    </svg>
  </button>;
  return (
    <div className="vac-lab-navigation">
      <div className="vac-lab-navigation-links">
        {!embedded && allLabsButton}
        {canGoPrevious && previousButton}
      </div>
      <div className="vac-lab-navigation-actions">
        {returnTo && <button type="button" className="vac-text-button" aria-label={`Return to lab on ${returnTo.label}`} onClick={returnTo.onClick}>
          Return to lab
        </button>}
        {resetButton}
      </div>
      {resetScope === "twig" && confirmingFor === selected && <div className="vac-reset-confirm" role="alertdialog" aria-labelledby={`${confirmationId}-title`} aria-describedby={`${confirmationId}-description`} onKeyDown={(event) => { if (event.key === "Escape") dismissConfirmation(); }}>
        <h3 id={`${confirmationId}-title`}>Reset Twig data?</h3>
        <p id={`${confirmationId}-description`}>Signs you out and clears bookings, saved stays, settings, and all lab progress in this browser.</p>
        <div className="vac-reset-confirm-actions">
          <button ref={confirmButtonRef} type="button" className="vac-button" onClick={onReset}><span className="vac-os-button-face">Reset everything</span></button>
          <button type="button" className="vac-text-button" onClick={dismissConfirmation}>Cancel</button>
        </div>
      </div>}
    </div>
  );
}
