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
  resetScope = "lab",
}: {
  selected: TouchpointId | null;
  stage: number;
  embedded: boolean;
  onAllLabs: () => void;
  onPrevious: () => void;
  onReset: () => void;
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
  return (
    <div className="vac-lab-navigation">
      {!embedded && (
        <button type="button" className="vac-text-button" onClick={() => { setConfirmingFor(null); onAllLabs(); }}>
          All labs
        </button>
      )}
      {["replay", "catalog", "discovery", "booking", "stay", "errors"].includes(selected) && (
        <>
          {stage > 0 && (selected !== "errors" || stage > 1) && (!embedded || stage > 1) && (
            <button
              className="vac-text-button"
              type="button"
              title="Go back without clearing your results"
              onClick={() => { setConfirmingFor(null); onPrevious(); }}
            >
              <span aria-hidden="true">← </span>Previous step
            </button>
          )}
          <button
            ref={resetButtonRef}
            className="vac-text-button vac-lab-reset"
            type="button"
            title={resetScope === "twig" ? "Restart this lab and clear Twig activity in this browser" : "Clear this lab’s results and restore its defaults"}
            onClick={() => resetScope === "twig" ? setConfirmingFor(selected) : onReset()}
          >
            {embedded && resetScope === "lab" ? "Reset exercise" : "Reset lab"}
          </button>
          {resetScope === "twig" && confirmingFor === selected && <div className="vac-reset-confirm" role="alertdialog" aria-labelledby={`${confirmationId}-title`} aria-describedby={`${confirmationId}-description`} onKeyDown={(event) => { if (event.key === "Escape") dismissConfirmation(); }}>
            <h3 id={`${confirmationId}-title`}>Start this lab over?</h3>
            <p id={`${confirmationId}-description`}>This signs you out and clears bookings, saved stays, settings, and progress in every Twig lab in this browser.</p>
            <div className="vac-reset-confirm-actions">
              <button ref={confirmButtonRef} type="button" className="vac-button" onClick={onReset}><span className="vac-os-button-face">Reset everything</span></button>
              <button type="button" className="vac-text-button" onClick={dismissConfirmation}>Keep my progress</button>
            </div>
          </div>}
        </>
      )}
    </div>
  );
}
