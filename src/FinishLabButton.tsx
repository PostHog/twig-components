"use client";

import type { ReactElement } from "react";

export function FinishLabButton({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <button type="button" className="vac-button" onClick={onClick}>
      <span className="vac-os-button-face">Finish lab</span>
    </button>
  );
}
