import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const dayMs = 86_400_000;
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayNumber(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) / dayMs;
}

export function addDateDays(value: string, days: number): string {
  return new Date((dayNumber(value) + days) * dayMs).toISOString().slice(0, 10);
}

function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function moveMonth(value: string, amount: number): string {
  const date = new Date(`${monthStart(value)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 10);
}

function label(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`)
  );
}

export type DatePickerProps = {
  id: string;
  label: string;
  value: string;
  minDate: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
};

/** A controlled date-only picker. Dates use ISO strings so host timezones cannot shift them. */
export function DatePicker({ id, label: fieldLabel, value, minDate, onChange, onClose, invalid, describedBy, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value || minDate);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const first = monthStart(cursor);
  const offset = new Date(`${first}T00:00:00Z`).getUTCDay();
  const gridStart = addDateDays(first, -offset);
  const month = first.slice(0, 7);
  const dayCount = Math.ceil((offset + Number(addDateDays(moveMonth(first, 1), -1).slice(-2))) / 7) * 7;

  function close(returnFocus = false) {
    setOpen(false);
    onClose?.();
    if (returnFocus) trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      if (window.innerWidth > 600) panel.current?.scrollIntoView({ block: "nearest" });
      root.current?.querySelector<HTMLButtonElement>(`.vac-date-day[data-date="${cursor}"]`)?.focus();
    }
  }, [open, cursor]);

  function choose(date: string) {
    onChange(date);
    close(true);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { event.preventDefault(); close(true); return; }
    let next: string | undefined;
    if (event.key === "ArrowLeft") next = addDateDays(cursor, -1);
    if (event.key === "ArrowRight") next = addDateDays(cursor, 1);
    if (event.key === "ArrowUp") next = addDateDays(cursor, -7);
    if (event.key === "ArrowDown") next = addDateDays(cursor, 7);
    if (event.key === "Home") next = addDateDays(cursor, -new Date(`${cursor}T00:00:00Z`).getUTCDay());
    if (event.key === "End") next = addDateDays(cursor, 6 - new Date(`${cursor}T00:00:00Z`).getUTCDay());
    if (event.key === "PageUp") next = moveMonth(cursor, -1);
    if (event.key === "PageDown") next = moveMonth(cursor, 1);
    if (next) {
      event.preventDefault();
      setCursor(next < minDate ? minDate : next);
    }
  }

  return <div className="vac-date-picker" ref={root}>
    <button
      ref={trigger}
      id={id}
      type="button"
      className="vac-date-trigger"
      disabled={disabled}
      aria-label={`${fieldLabel}: ${value ? label(value, { month: "long", day: "numeric", year: "numeric" }) : "Choose a date"}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onClick={() => {
        if (open) close();
        else { setCursor(value && value >= minDate ? value : minDate); setOpen(true); }
      }}
    >
      <span className={value ? undefined : "vac-date-placeholder"}>{value ? label(value, { month: "short", day: "numeric", year: "numeric" }) : "Choose date"}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>
    </button>
    {open && <div ref={panel} id={panelId} className="vac-date-panel" role="dialog" aria-label={`Choose ${fieldLabel.toLowerCase()} date`} onKeyDown={keyboard}>
      <div className="vac-date-heading">
        <button type="button" aria-label="Previous month" disabled={moveMonth(first, -1).slice(0, 7) < minDate.slice(0, 7)} onClick={() => setCursor(moveMonth(first, -1) < minDate ? minDate : moveMonth(first, -1))}>‹</button>
        <strong aria-live="polite">{label(first, { month: "long", year: "numeric" })}</strong>
        <button type="button" aria-label="Next month" onClick={() => setCursor(moveMonth(first, 1))}>›</button>
      </div>
      <div className="vac-date-grid" aria-label={label(first, { month: "long", year: "numeric" })}>
        {weekdays.map((day) => <span key={day} className="vac-date-weekday">{day}</span>)}
        {Array.from({ length: dayCount }, (_, index) => {
          const date = addDateDays(gridStart, index);
          const isCurrent = date.slice(0, 7) === month;
          return <button key={date} type="button" className="vac-date-day" data-date={date} disabled={!isCurrent || date < minDate} aria-label={label(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} aria-pressed={date === value} tabIndex={date === cursor ? 0 : -1} onClick={() => choose(date)}>{Number(date.slice(-2))}</button>;
        })}
      </div>
    </div>}
  </div>;
}
