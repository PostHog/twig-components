"use client";

import { useState, type ReactNode } from "react";
import { EvidenceTabs } from "./TripPlannerEvidenceTabs.js";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { PlaygroundStatus, type PlaygroundStatusValue } from "./PlaygroundStatus.js";

export type GenerationMessage = { role: string; content: string };
export type GenerationFact = { label: string; value: ReactNode };
export type AiTrace = { id: string; title: string; generation: string; toolCall?: string };

/** A conversation and its real nested operations. Selection never implies expansion. */
export function PlaygroundTraceExplorer({ traces, onSelect, selectedId, sessionId }: {
  traces: readonly AiTrace[]; onSelect?: (id: string) => void; selectedId?: string; sessionId?: string;
}) {
  return <div className="vac-ai-trace-tree" role="group" aria-label="AI session and traces">
    <details open>
      <PlaygroundSummary className="vac-ai-session-summary">Session</PlaygroundSummary>
      {traces.map(trace => <details open className="vac-ai-trace" key={trace.id}>
        <PlaygroundSummary><span className="vac-ai-role">Trace · </span>{trace.title}</PlaygroundSummary>
        {trace.toolCall && <div className="vac-ai-operation"><span className="vac-ai-role">Tool call · </span>{trace.toolCall}</div>}
        {onSelect ? <button className="vac-ai-operation" type="button" aria-pressed={selectedId === trace.id} onClick={() => onSelect(trace.id)}>
          <span className="vac-ai-role">Generation · </span>{trace.generation}
        </button> : <div className="vac-ai-operation"><span className="vac-ai-role">Generation · </span>{trace.generation}</div>}
      </details>)}
    </details>
    {sessionId && <details className="vac-ai-evidence-details"><PlaygroundSummary>Session details</PlaygroundSummary><div className="vac-ai-detail-value"><code>{sessionId}</code></div></details>}
  </div>;
}

/** Read-only captured chat evidence, distinct from a message composer. */
export function PlaygroundGeneration({ input, output, facts = [], details, field, onFieldChange }: {
  input: readonly GenerationMessage[]; output: readonly GenerationMessage[]; facts?: readonly GenerationFact[];
  details?: ReactNode; field?: "input" | "output"; onFieldChange?: (value: "input" | "output") => void;
}) {
  const [localField, setField] = useState<"input" | "output">("input");
  const selected = field ?? localField;
  const messages = selected === "input" ? input : output;
  return <section className="vac-ai-generation" aria-label="Chat generation">
    <h4>Chat generation</h4>
    <div className="vac-ai-generation-surface">
      <EvidenceTabs label="Captured chat messages" value={selected} options={[{ value: "input", label: "Input" }, { value: "output", label: "Output" }]}
        onChange={value => { setField(value); onFieldChange?.(value); }}>
        <div className="vac-ai-messages">
          {messages.length ? messages.map((message, i) => <div className="vac-ai-message" key={i}>
            <span className="vac-ai-role">{selected === "output" ? "AI response" : message.role === "user" ? "User message" : "System message"}</span>
            <p>{message.content}</p>
          </div>) : <div className="vac-ai-message"><span className="vac-ai-role">{selected === "input" ? "User message" : "AI response"}</span><p>Not captured</p></div>}
        </div>
      </EvidenceTabs>
      {facts.length > 0 && <table className="vac-lab-table vac-lab-table-key-value" aria-label="Generation properties">
        <thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead>
        <tbody>{facts.map(fact => <tr key={fact.label}><td>{fact.label}</td><td>{fact.value}</td></tr>)}</tbody>
      </table>}
      {details && <details className="vac-ai-evidence-details"><PlaygroundSummary>Generation details</PlaygroundSummary>{details}</details>}
    </div>
  </section>;
}

export function PlaygroundEvaluation({ name = "Guest capacity", status, expected, observed }: {
  name?: string; status: PlaygroundStatusValue; expected: ReactNode; observed?: ReactNode;
}) {
  return <section className="vac-ai-evaluation" aria-label={`Evaluation: ${name}`}>
    <div className="vac-ai-evaluation-header"><strong>Evaluation: {name}</strong><PlaygroundStatus value={status} /></div>
    <table className="vac-lab-table" aria-label={`${name} result`}>
      <thead><tr><th scope="col">Expected</th><th scope="col">Observed</th></tr></thead>
      <tbody><tr><td>{expected}</td><td>{observed ?? (status === "running" ? "Checking…" : "Not evaluated")}</td></tr></tbody>
    </table>
  </section>;
}

export function generationModelLabel(model: string) {
  return model === "claude-haiku-4-5-20251001" ? "Claude Haiku 4.5" : model;
}

/** Captured structured messages stay available in raw details, never treated as UI labels. */
export function generationMessages(value: unknown): GenerationMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is GenerationMessage => !!item && typeof item === "object"
    && typeof item.role === "string" && typeof item.content === "string");
}
