"use client";

import { type ReactNode } from "react";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { PlaygroundGeneration, generationMessages, generationModelLabel } from "./PlaygroundAiEvidence.js";
import { PlaygroundCodeBlock, codeLanguage } from "./PlaygroundCodeBlock.js";

export type InspectorValue = string | number | boolean | null | InspectorValue[] | { [key: string]: InspectorValue };

export type InspectionSource = { path: string; line: number; code: string; label?: string; description?: string; caption?: string; highlightLines?: readonly number[] };
export type InspectionGuide = {
  description: string;
  question: string;
  sources: readonly InspectionSource[];
  method: "capture" | "exception" | "replay" | "generation" | "autocapture";
  aiExample?: boolean;
  instrumentationDescription?: string;
  configuration?: Record<string, InspectorValue>;
};

export function InspectorSummary({ children }: { children: ReactNode }) {
  return <PlaygroundSummary className="vac-inspector-disclosure">{children}</PlaygroundSummary>;
}

/** One evidence frame: interaction, implementation, then expandable data. */
export function InstrumentationInspector({ event, timestamp, properties, element, guide, label, drilldown = false, additionalProperties }: {
  event?: string; timestamp?: string; properties: Record<string, InspectorValue>; element?: string;
  guide?: InspectionGuide; label?: string; drilldown?: boolean;
  additionalProperties?: Record<string, InspectorValue>;
}) {
  const additionalOnly = additionalProperties !== undefined;
  const summarizedGenerationProperties = new Set(["$ai_model"]);
  if (typeof properties.$ai_latency === "number") summarizedGenerationProperties.add("$ai_latency");
  if (typeof properties.$ai_input_tokens === "number" && typeof properties.$ai_output_tokens === "number") {
    summarizedGenerationProperties.add("$ai_input_tokens"); summarizedGenerationProperties.add("$ai_output_tokens");
  }
  if (typeof properties.$ai_total_cost_usd === "number") summarizedGenerationProperties.add("$ai_total_cost_usd");
  if (typeof properties.$ai_trace_id === "string") {
    summarizedGenerationProperties.add("$ai_trace_id");
  }
  if (typeof properties.$ai_span_id === "string") summarizedGenerationProperties.add("$ai_span_id");
  const generationDrilldown = drilldown && guide?.method === "generation";
  const generationFields = Object.entries(properties).filter(([key]) => !summarizedGenerationProperties.has(key));
  const generationLabels: Record<string,string> = { $ai_provider:"Provider", $ai_session_id:"Session ID", $ai_span_name:"Generation name", $ai_input:"Input", $ai_output_choices:"Output", $ai_input_tokens:"Input tokens", $ai_output_tokens:"Output tokens", $ai_is_error:"Error", demo_data:"Simulated data", usage_source:"Usage source" };
  const dataProperties = additionalProperties ?? properties;
  const hasData = !generationDrilldown && Boolean(guide?.configuration || (event && (!additionalOnly || Object.keys(dataProperties).length)));
  const dataLabel = guide?.configuration ? "Recording configuration" : additionalOnly ? "More event data" : "Event data";
  const generationDetails = guide?.method === "generation" ? <PlaygroundGeneration
    input={generationMessages(properties.$ai_input).filter(message => message.role === "user").slice(-1)}
    output={generationMessages(properties.$ai_output_choices)}
    facts={[
      { label: "Model", value: generationModelLabel(String(properties.$ai_model ?? "Unknown")) },
      ...(typeof properties.$ai_latency === "number" ? [{ label: "Duration", value: `${properties.$ai_latency}s` }] : []),
    ]}
    details={<table className="vac-lab-table vac-lab-table-key-value" aria-label="Captured generation details"><tbody>
      <tr><th scope="row">Model ID</th><td><code>{String(properties.$ai_model ?? "Unknown")}</code></td></tr>
      {typeof properties.$ai_input_tokens === "number" && typeof properties.$ai_output_tokens === "number" && <tr><th scope="row">Tokens</th><td>{properties.$ai_input_tokens} in / {properties.$ai_output_tokens} out</td></tr>}
      {typeof properties.$ai_total_cost_usd === "number" && <tr><th scope="row">Cost</th><td>${properties.$ai_total_cost_usd.toFixed(6)}</td></tr>}
      {typeof properties.$ai_trace_id === "string" && <tr><th scope="row">Trace ID</th><td><code>{properties.$ai_trace_id}</code></td></tr>}
      {typeof properties.$ai_span_id === "string" && <tr><th scope="row">Generation ID</th><td><code>{properties.$ai_span_id}</code></td></tr>}
      {generationFields.map(([name,value]) => <tr key={name}><th scope="row">{generationLabels[name] ?? <code>{name}</code>}</th><td>{value !== null && typeof value === "object" ? <details><InspectorSummary>{Array.isArray(value) ? `${value.length} ${value.length === 1 ? "item" : "items"}` : "View fields"}</InspectorSummary><PlaygroundCodeBlock label="JSON">{JSON.stringify(value,null,2)}</PlaygroundCodeBlock></details> : name.endsWith("_id") || !generationLabels[name] ? <code>{String(value)}</code> : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</td></tr>)}
    </tbody></table>} /> : null;
  return <div className={`vac-instrumentation-inspector${drilldown ? " vac-inspector-drilldown" : ""}${drilldown && guide?.method === "generation" ? " vac-inspector-generation" : ""}`} role={drilldown ? "region" : undefined} aria-label={drilldown ? "Selected event details" : undefined}>
    {guide ? <>
      <section aria-label="Interaction">
        {(label || guide.method === "replay") && <h4 className="vac-inspector-section-title">{label ?? "Session Replay"}{event && !drilldown && <code className="vac-inspector-selected-name">{event}</code>}</h4>}
        <div className="vac-inspector-context"><p>{guide.description}</p></div>
      </section>
      {!drilldown && generationDetails && <section aria-label="AI generation">{generationDetails}</section>}
      {guide.sources.length > 0 && <section aria-label="Instrumentation code">
        <details className="vac-inspector-source" open>
          <InspectorSummary>{drilldown ? "How it’s tracked" : "Instrumentation"}</InspectorSummary>
          {guide.instrumentationDescription && <div className="vac-inspector-context"><p>{guide.instrumentationDescription}</p></div>}
          <Source source={guide.sources[0]!} compact={drilldown} />
          {!drilldown && guide.sources.length > 1 && <details className="vac-inspector-source-extra"><InspectorSummary>Handler &amp; setup</InspectorSummary>
            {guide.sources.slice(1).map(source => <details className="vac-inspector-source-extra" key={source.path + source.line}><InspectorSummary>{source.label ?? "Configuration"}</InspectorSummary>{source.description && <div className="vac-inspector-context"><p>{source.description}</p></div>}<Source source={source} wrap={drilldown} /></details>)}
          </details>}
        </details>
      </section>}
      {drilldown && generationDetails && <section aria-label="AI generation">{generationDetails}</section>}
      {drilldown && guide.sources.length > 1 && <section aria-label="Twig source code">
        <details className="vac-inspector-source">
          <InspectorSummary>Twig source code</InspectorSummary>
          {guide.sources.slice(1).map(source => <details className="vac-inspector-source-extra" key={source.path + source.line}><InspectorSummary>{source.label ?? "Capture settings"}</InspectorSummary>{source.description && <div className="vac-inspector-context"><p>{source.description}</p></div>}<Source source={source} wrap /></details>)}
        </details>
      </section>}
    </> : element ? <section aria-label="Elements"><h4 className="vac-inspector-section-title">Elements</h4><div className="vac-inspector-node"><span aria-hidden="true">1</span><samp><ElementSyntax value={element} /></samp></div></section> : null}
    {hasData && <section aria-label={dataLabel}>
      <div className="vac-inspector-tree"><details><InspectorSummary>{dataLabel}</InspectorSummary><div className="vac-inspector-tree-branch">
        {event && !additionalOnly && <Value name="event" value={event} />}
        {timestamp && !additionalOnly && <Value name="timestamp" value={timestamp} />}
        {drilldown && additionalOnly && !guide?.configuration ? Object.entries(dataProperties).map(([name,value]) => <Value key={name} name={name} value={value} expanded={false} />) : <Value name={guide?.configuration ? "configuration" : "properties"} value={guide?.configuration ?? dataProperties} />}
      </div></details></div>
    </section>}
  </div>;
}

export function Source({ source, compact = false, wrap = compact }: { source: InspectionSource; compact?: boolean; wrap?: boolean }) {
  const location = source.caption === "" ? null : <small title={source.caption ? undefined : source.path}>{source.caption ?? `${compact ? source.path.split("/").at(-1) : source.path}:${source.line}`}</small>;
  return <div className="vac-inspector-source-code"><PlaygroundCodeBlock code={source.code} label={source.caption === "" ? "JavaScript" : codeLanguage(source.path)} highlightLines={source.highlightLines} aria-label={compact ? "Instrumentation source code" : "Source code"} />{location}</div>;
}

export function Payload({ event, properties }: {event: string; properties: Record<string, InspectorValue>}) {
  return <div className="vac-inspector-tree"><details><InspectorSummary>Event data</InspectorSummary><div className="vac-inspector-tree-branch"><Value name="event" value={event} /><Value name="properties" value={properties} /></div></details></div>;
}


function Value({ name, value, expanded = true }: { name: string; value: InspectorValue; expanded?: boolean }) {
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    return <details open={expanded} className="vac-inspector-tree-object"><InspectorSummary><span className="vac-inspector-key">{name}</span> <span className="vac-inspector-count">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span></InspectorSummary><div className="vac-inspector-tree-branch">
      {entries.length ? entries.map(([key, item]) => <Value key={key} name={key} value={item} expanded={expanded} />) : <span className="vac-inspector-count">{Array.isArray(value) ? "[]" : "{}"}</span>}
    </div></details>;
  }
  return <div className="vac-inspector-tree-value"><span className="vac-inspector-key">{name}</span>: <span className={typeof value === "string" ? "vac-inspector-string" : "vac-inspector-literal"}>{JSON.stringify(value)}</span></div>;
}

function ElementSyntax({ value }: { value: string }) {
  // Render tokens as text, never HTML. Source supplies only allowlisted snapshots.
  return <>{value.split(/("[^"]*"|<\/?[\w-]+|[\w-]+(?==))/g).map((token, index) => <span key={index} className={token.startsWith('"') ? "vac-inspector-string" : token.startsWith("<") ? "vac-inspector-tag" : /^[\w-]+$/.test(token) ? "vac-inspector-key" : undefined}>{token}</span>)}</>;
}
