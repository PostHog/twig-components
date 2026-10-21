"use client";

import { aiReducer, aiCode, fixtureRequest, initialAiState } from "./ai-lab.js";
import { InspectorSummary, Payload, Source, type InspectorValue } from "./InstrumentationInspector.js";
const configured = aiReducer(aiReducer(initialAiState, { type:"edit", config:{input:true,output:true,linked:true,errors:true} }), {type:"apply"});
const run = aiReducer(configured, { type:"run", prompt:fixtureRequest, scenario:"success" }).runs[0]!;

/** The existing lab fixture, never a claimed capture of the visitor's model request. */
export function InspectorAiExample({ onBack }: { onBack: () => void }) {
  const p = run.event.properties;
  return <div className="vac-instrumentation-inspector vac-inspector-ai-example">
    <div className="vac-inspector-context"><button type="button" className="vac-text-button" onClick={onBack}>← Back to interaction</button></div>
    <section aria-label="Example generation">
      <h4 className="vac-inspector-section-title vac-inspector-evidence-title"><img src={new URL("./assets/posthog-ai-observability.svg", import.meta.url).href} width={16} height={16} alt="" />Example generation</h4>
      <div className="vac-inspector-context"><p>A model-call example from the AI Observability lab.</p>
        <ol className="vac-inspector-trace"><li><span>Trace</span><code>{run.traceId}</code><ol><li><span>Generation</span><code>{String(p.$ai_span_id)}</code><span>Recommend a stay</span></li></ol></li></ol>
        <dl className="vac-inspector-facts"><div><dt>Model</dt><dd>{String(p.$ai_model)}</dd></div><div><dt>Duration</dt><dd>{String(p.$ai_latency)}s</dd></div><div><dt>Provider</dt><dd>{String(p.$ai_provider)}</dd></div></dl>
      </div>
    </section>
    <section aria-label="Example instrumentation"><details className="vac-inspector-source"><InspectorSummary>Instrumentation</InspectorSummary><Source source={{path:"AI Observability lab · Node.js example",line:1,code:aiCode(run.config)}} /></details></section>
    <section aria-label="Example event data"><Payload event={run.event.event} properties={p as Record<string,InspectorValue>} /></section>
  </div>;
}
