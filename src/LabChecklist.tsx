"use client";

import type { ReactNode } from "react";

export function LabChecklist({
  label,
  items,
}: {
  label: string;
  items: { label: ReactNode; done: boolean }[];
}) {
  const current = items.findIndex((item) => !item.done);
  const numbered = items.length > 1;
  return (
    <ol className="vac-booking-checklist" aria-label={label}>
      {items.map((item, index) => (
        <li
          key={index}
          data-state={
            item.done ? "done" : index === current ? "current" : "upcoming"
          }
          aria-current={numbered && index === current ? "step" : undefined}
        >
          {numbered && (
            <span
              className="vac-check-status"
              aria-label={
                item.done ? "Complete" : index === current ? "Next" : "Upcoming"
              }
            >
              {item.done ? "✓" : index + 1}
            </span>
          )}
          <span>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}
