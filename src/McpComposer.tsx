"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Local mock-agent input. This is deliberately separate from Playground OS buttons. */
export function McpComposer({ suggested, disabled = false, pending = false, horizontal = false, onSend, onStop }: {
  suggested: string; disabled?: boolean; pending?: boolean; horizontal?: boolean; onSend: (message: string) => void; onStop?: () => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState(suggested);
  useEffect(() => { setMessage(suggested); }, [suggested]);
  useLayoutEffect(() => {
    const input = textarea.current;
    if (!input) return;
    // Runtime text and wrapping determine height; all visual styling stays in CSS.
    const fit = () => { input.style.height = "auto"; input.style.height = `${input.scrollHeight}px`; };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => { if (input.clientWidth !== width) { width = input.clientWidth; fit(); } });
    observer.observe(input);
    return () => observer.disconnect();
  }, [message]);
  function send() { if (!disabled && !pending && message.trim()) { onSend(message.trim()); setMessage(""); } }
  return <form className={`vac-mcp-composer${horizontal ? " vac-mcp-composer-horizontal" : ""}`} aria-label="Message the agent" onSubmit={event => { event.preventDefault(); send(); }}>
    <div className="vac-mcp-prompt"><span aria-hidden="true">❯</span><textarea ref={textarea} aria-label="Message the agent" placeholder="Message the agent" value={message} disabled={pending} rows={1} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} /></div>
    <div className="vac-mcp-controls">{pending ? <button className="vac-mcp-send" type="button" aria-label="Stop generation" onClick={onStop}>■</button> : <button className="vac-mcp-send" type="submit" aria-label="Send message" disabled={disabled || !message.trim()}>↑</button>}</div>
  </form>;
}
