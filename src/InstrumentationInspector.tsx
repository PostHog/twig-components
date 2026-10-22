"use client";

import { Fragment, type ReactNode } from "react";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";

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
  const generationDetails = guide?.method === "generation" ? <div className="vac-inspector-context">
        {drilldown ? <table className="vac-lab-table vac-lab-table-key-value" aria-label="Generation details">
          <tbody>
            <tr><th scope="row">Model</th><td><code>{String(properties.$ai_model ?? "Unknown")}</code></td></tr>
            {typeof properties.$ai_latency === "number" && <tr><th scope="row">Duration</th><td>{properties.$ai_latency}s</td></tr>}
            {typeof properties.$ai_input_tokens === "number" && typeof properties.$ai_output_tokens === "number" && <tr><th scope="row">Tokens</th><td>{properties.$ai_input_tokens} in / {properties.$ai_output_tokens} out</td></tr>}
            {typeof properties.$ai_total_cost_usd === "number" && <tr><th scope="row">Cost</th><td>${properties.$ai_total_cost_usd.toFixed(6)}</td></tr>}
            {typeof properties.$ai_trace_id === "string" && <tr><th scope="row">Trace ID</th><td><code>{properties.$ai_trace_id}</code></td></tr>}
            {typeof properties.$ai_span_id === "string" && <tr><th scope="row">Generation ID</th><td><code>{properties.$ai_span_id}</code></td></tr>}
            {generationFields.map(([name,value]) => <tr key={name}><th scope="row">{generationLabels[name] ?? <code>{name}</code>}</th><td>{value !== null && typeof value === "object" ? <details><InspectorSummary>{Array.isArray(value) ? `${value.length} ${value.length === 1 ? "item" : "items"}` : "View fields"}</InspectorSummary><pre className="vac-lab-table-value"><code>{JSON.stringify(value,null,2)}</code></pre></details> : <code>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</code>}</td></tr>)}
          </tbody>
        </table> : <>        <dl className="vac-inspector-facts">
          <div><dt>Model</dt><dd>{String(properties.$ai_model ?? "Unknown")}</dd></div>
          {typeof properties.$ai_latency === "number" && <div><dt>Duration</dt><dd>{properties.$ai_latency}s</dd></div>}
          {typeof properties.$ai_input_tokens === "number" && typeof properties.$ai_output_tokens === "number" && <div><dt>Tokens</dt><dd>{properties.$ai_input_tokens} in / {properties.$ai_output_tokens} out</dd></div>}
          {typeof properties.$ai_total_cost_usd === "number" && <div><dt>Cost</dt><dd>${properties.$ai_total_cost_usd.toFixed(6)}</dd></div>}
        </dl>
        {typeof properties.$ai_trace_id === "string" && <ol className="vac-inspector-trace"><li><span>Trace</span><code>{properties.$ai_trace_id}</code><ol><li><span>Generation</span><code>{String(properties.$ai_span_id ?? "")}</code></li></ol></li></ol>}</>}

      </div> : null;
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
      {drilldown && generationDetails && <section aria-label="Generation details"><details className="vac-inspector-source"><InspectorSummary>Generation details</InspectorSummary>{generationDetails}</details></section>}
      {drilldown && guide.sources.length > 1 && <section aria-label="Twig source code">
        <details className="vac-inspector-source">
          <InspectorSummary>Twig source code</InspectorSummary>
          {guide.sources.slice(1).map(source => <details className="vac-inspector-source-extra" key={source.path + source.line}><InspectorSummary>{source.label ?? "PostHog configuration"}</InspectorSummary>{source.description && <div className="vac-inspector-context"><p>{source.description}</p></div>}<Source source={source} wrap /></details>)}
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
  const code = <pre aria-label={compact ? "Instrumentation source code" : undefined}><code><CodeSyntax value={source.code} wrap={wrap} highlightLines={wrap ? source.highlightLines : undefined} /></code></pre>;
  return <div className="vac-inspector-source-code">{compact ? <>{code}{location}</> : <>{location}{code}</>}</div>;
}

export function Payload({ event, properties }: {event: string; properties: Record<string, InspectorValue>}) {
  return <div className="vac-inspector-tree"><details><InspectorSummary>Event data</InspectorSummary><div className="vac-inspector-tree-branch"><Value name="event" value={event} /><Value name="properties" value={properties} /></div></details></div>;
}

function CodeSyntax({ value, wrap = false, highlightLines = [] }: {value: string; wrap?: boolean; highlightLines?: readonly number[]}) {
  const lines = value.split("\n");
  const indentation = Math.min(...lines.slice(1).filter(line => line.trim()).map(line => line.match(/^ */)![0].length));
  const formatted = [lines[0]!, ...lines.slice(1).map(line => Number.isFinite(indentation) ? line.slice(indentation) : line)];
  const syntax = (text: string) => text.split(/("[^"\n]*"|'[^'\n]*'|\b(?:const|let|if|return|function|true|false|null)\b)/g).map((token,index) =>
    <span key={index} className={/^["']/.test(token) ? "vac-inspector-string" : /^(const|let|if|return|function|true|false|null)$/.test(token) ? "vac-inspector-key" : undefined}>
      {wrap ? token.split(/([_./])/g).map((part,partIndex) => <Fragment key={partIndex}>{part}{/^[_./]$/.test(part) && <wbr />}</Fragment>) : token}
    </span>
  );
  if (!wrap) return <>{syntax(formatted.join("\n"))}</>;
  return <>{formatted.map((line,index) => {
    const indent = line.match(/^ */)![0];
    return <Fragment key={index}><span className="vac-inspector-code-line" data-highlighted={highlightLines.includes(index + 1) ? "true" : undefined}><span className="vac-inspector-code-indent">{indent}</span><span className="vac-inspector-code-content">{syntax(line.slice(indent.length))}</span></span>{index < formatted.length - 1 ? "\n" : null}</Fragment>;
  })}</>;
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
