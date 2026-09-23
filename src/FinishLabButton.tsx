"use client";

export function FinishLabButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="vac-button" onClick={onClick}>
      <span className="vac-os-button-face">Finish lab</span>
    </button>
  );
}
