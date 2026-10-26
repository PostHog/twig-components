"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

export function TooltipBubble({ children, className = "vac-control-tooltip", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={className} role="tooltip">{children}</span>;
}

/** Shared neutral hint; feedback stays anchored to its own control. */
export function PlaygroundTooltip({ children, label, open = false, feedbackOnly = false }: { children: ReactNode; label: string; open?: boolean; feedbackOnly?: boolean }) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && (open || (!feedbackOnly && (hovered || focused)));
  useEffect(() => { setDismissed(false); }, [open, label]);
  return <span className="vac-tooltip-control" onMouseEnter={() => { setHovered(true); setDismissed(false); }} onMouseLeave={() => setHovered(false)} onFocus={() => { setFocused(true); setDismissed(false); }} onBlur={() => setFocused(false)} onKeyDown={event => { if (event.key === "Escape") { setDismissed(true); event.stopPropagation(); } }}>
    {Children.map(children, child => isValidElement<HTMLAttributes<HTMLElement>>(child) && child.type === "button" ? cloneElement(child, { "aria-describedby": visible ? id : undefined }) : child)}
    {visible && <TooltipBubble id={id}>{label}</TooltipBubble>}
  </span>;
}

export function useClipboardFeedback() {
  const [feedback, setFeedback] = useState<"" | "Copied!"> ("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef(0);
  useEffect(() => () => { request.current++; clearTimeout(timer.current); }, []);
  async function copy(value: string) {
    const current = ++request.current;
    clearTimeout(timer.current);
    let result: typeof feedback;
    try { await navigator.clipboard.writeText(value); result = "Copied!"; }
    catch { result = ""; }
    if (current !== request.current) return;
    setFeedback(result);
    timer.current = setTimeout(() => setFeedback(""), 500);
  }
  return { feedback, copy };
}

export function CopyControl({ text, label = "Copy code" }: { text: string; label?: string }) {
  const { feedback, copy } = useClipboardFeedback();
  return <PlaygroundTooltip label={feedback || label} open={!!feedback} feedbackOnly>
    <button className="vac-code-copy" type="button" aria-label={label} onClick={() => void copy(text)}><span className="vac-copy-glyph" aria-hidden="true" /></button>
    {feedback && <span className="vac-sr-only" role="status">{feedback}</span>}
  </PlaygroundTooltip>;
}
