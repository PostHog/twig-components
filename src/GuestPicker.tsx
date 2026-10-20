import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type GuestPickerProps = {
  id: string;
  value: string;
  capacity: number;
  onChange: (value: string) => void;
  onClose?: () => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
};

/** A controlled guest menu styled to match Twig's date picker. */
export function GuestPicker({ id, value, capacity, onChange, onClose, invalid, describedBy, disabled }: GuestPickerProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const selected = Number(value);
  const guestLabel = selected ? `${selected} ${selected === 1 ? "guest" : "guests"}` : "Select guests";

  function close(returnFocus = false) {
    setOpen(false);
    onClose?.();
    if (returnFocus) trigger.current?.focus();
  }

  function show(initial: number) {
    if (disabled || capacity < 1) return;
    setActive(initial);
    setOpen(true);
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
    if (open) options.current[active]?.focus();
  }, [open, active]);

  function choose(guests: number) {
    onChange(String(guests));
    close(true);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show(event.key === "ArrowUp" ? capacity - 1 : Math.max(0, selected - 1));
    }
  }

  function onOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(capacity - 1);
      else setActive((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + capacity) % capacity);
    }
  }

  return <div className="vac-guest-picker" ref={root}>
    <button
      ref={trigger}
      id={id}
      type="button"
      className="vac-guest-trigger"
      disabled={disabled || capacity < 1}
      aria-label={`Guests: ${guestLabel}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onClick={() => open ? close() : show(Math.max(0, selected - 1))}
      onKeyDown={onTriggerKeyDown}
    >
      <span className={selected ? undefined : "vac-guest-placeholder"}>{guestLabel}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 9 7 7 7-7" /></svg>
    </button>
    {open && <div id={listId} className="vac-guest-panel" role="listbox" aria-label="Guests">
      {Array.from({ length: capacity }, (_, index) => {
        const guests = index + 1;
        return <button
          key={guests}
          ref={(node) => { options.current[index] = node; }}
          type="button"
          role="option"
          className="vac-guest-option"
          aria-selected={guests === selected}
          tabIndex={index === active ? 0 : -1}
          onClick={() => choose(guests)}
          onKeyDown={onOptionKeyDown}
        >
          <span>{guests} {guests === 1 ? "guest" : "guests"}</span>
          {guests === selected && <span aria-hidden="true">✓</span>}
        </button>;
      })}
    </div>}
  </div>;
}
