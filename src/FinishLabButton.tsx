"use client";

import { LabPrimaryAction } from "./LabNavigation.js";
import type { ReactElement } from "react";

export function FinishLabButton({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <LabPrimaryAction><button type="button" className="vac-button" onClick={onClick}>
      <span className="vac-os-button-face">Finish lab</span>
    </button></LabPrimaryAction>
  );
}
