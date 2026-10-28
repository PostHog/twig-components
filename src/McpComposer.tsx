"use client";

import { useEffect, useState } from "react";

/** Local mock-agent input. This is deliberately separate from Playground OS buttons. */
export function McpComposer({ suggested, disabled = false, pending = false, horizontal = false, onSend, onStop }: {
  suggested: string; disabled?: boolean; pending?: boolean; horizontal?: boolean; onSend: (message: string) => void; onStop?: () => void;
}) {
  const [message, setMessage] = useState(suggested);
  useEffect(() => { setMessage(suggested); }, [suggested]);
  function send() { if (!disabled && !pending && message.trim()) { onSend(message.trim()); setMessage(""); } }
  return <form className={`vac-mcp-composer${horizontal ? " vac-mcp-composer-horizontal" : ""}`} aria-label="Message the agent" onSubmit={event => { event.preventDefault(); send(); }}>
    <div className="vac-mcp-prompt"><span aria-hidden="true">❯</span><textarea aria-label="Message the agent" placeholder="Message the agent" value={message} disabled={pending} rows={horizontal ? 1 : 2} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} /></div>
    <div className="vac-mcp-controls">{pending ? <button className="vac-mcp-send" type="button" aria-label="Stop generation" onClick={onStop}>■</button> : <button className="vac-mcp-send" type="submit" aria-label="Send message" disabled={disabled || !message.trim()}>↑</button>}</div>
  </form>;
}
