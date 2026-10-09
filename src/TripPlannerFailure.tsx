"use client";

import { useTripPlannerLab } from "./TripPlannerLab.js";
import type { ReactNode } from "react";
import type { Stay } from "./catalog.js";
import { TripPlannerStayPreview } from "./TripPlannerStayPreview.js";
import { TripPlannerFailureTrace } from "./TripPlannerFailureTrace.js";
import { LabChecklist } from "./LabChecklist.js";

export function TripPlannerFailure({ stays, renderStayCard }: { stays: readonly Stay[]; renderStayCard?: (stay: Stay) => ReactNode }) {
  const { lesson, records, dispatchLesson: dispatch } = useTripPlannerLab();
  const [before, after] = lesson.failureEvidence;
  const kitchenComplete = records.some(record => record.properties.scenario === "kitchen"
    && record.properties.$ai_session_id === records.at(-1)?.properties.$ai_session_id);
  const lookup = before?.capacityEvidence?.lookup.properties;
  const recommendedStay = stays.find(stay => stay.id === before?.properties.selected_stay_id);
  const correctedLookup = after?.capacityEvidence?.lookup.properties;
  const action = (label: string, onClick: () => void) => <div className="vac-request-next"><button className="vac-button" type="button" onClick={onClick}><span className="vac-os-button-face">{label}</span></button></div>;
  return <section className="vac-lab vac-builder vac-trip-walkthrough">
    {lesson.step === 3 && <>
      {!before ? <>
        <p>The forest and beach requests worked. Now ask the same planner for a city stay for four.</p>
        <LabChecklist label="Next chat actions" items={[
          { done: kitchenComplete, label: <>Send the pre-filled <strong>kitchen question</strong> in Twig’s chat.</> },
          { done: false, label: <>Send <strong>“Find me a city stay for four.”</strong></> },
        ]} />
        <p className="vac-muted vac-trip-mobile-hint">On mobile, tap <strong>Playground</strong> in the chat to return here.</p>
      </> : <>
        <p>PostHog shows the input and output Twig captured for the city request:</p>
        <TripPlannerFailureTrace record={before} />
        {recommendedStay && <>
          <p>Compare that answer with Twig’s listing:</p>
          <TripPlannerStayPreview stay={recommendedStay} renderStayCard={renderStayCard} />
        </>}
        <p>The model returned an answer without an error, so Twig’s capture call records <code>$ai_is_error: false</code>. This tracks whether the call failed, not whether the recommendation is correct:</p>
        <pre><code>{'posthog.capture("$ai_generation", {\n'}<mark>{'  $ai_is_error: false,\n'}</mark>{'  // Other fields omitted\n});'}</code></pre>
        <p>The model’s recommendation looks helpful, but the stay only sleeps two. Inspect the request’s trace in PostHog to find out why.</p>
        {action("Investigate this request →", () => dispatch({ type: "next" }))}
      </>}
    </>}
    {lesson.step === 4 && before && lookup && <>
      {lesson.investigation === "overview" ? <>
        <p>For the city request, Twig’s code searches its listings, then passes the results to the model for a recommendation.</p>
        <p>Twig captures the search as an <code>$ai_span</code> event. A span records one operation within the request.</p>
        <div className="vac-conversation-traces" role="group" aria-label="City request trace and its two operations">
          <div className="vac-conversation-session"><code>$ai_trace_id</code><code>example-9c4a7b2e1d06</code></div>
          <ol aria-label="Operations in the city request">
            <li><strong>search_stays</strong><dl><dt><code>$ai_span</code></dt><dd>Twig’s code searches the listings.</dd></dl></li>
            <li><strong>Recommend a city stay</strong><dl><dt><code>$ai_generation</code></dt><dd>The model uses the results to answer.</dd></dl></li>
          </ol>
        </div>
        <p>Twig gives both events the same <code>$ai_trace_id</code>, so PostHog groups them in one trace.</p>
        {action("Inspect the recorded search →", () => dispatch({ type: "next" }))}
      </> : lesson.investigation === "lookup" ? <>
        <p>Twig captures the search’s filters and results with this call:</p>
        <pre><code>{'posthog.capture("$ai_span", {\n  $ai_trace_id: traceId,\n  $ai_span_name: "search_stays",\n'}<mark>{'  $ai_input_state: filters,\n  $ai_output_state: matches,\n'}</mark>{'});'}</code></pre>
        <p>In PostHog, that event shows:</p>
        <div className="vac-conversation-traces" role="group" aria-label="Recorded catalog search filters and results">
          <div className="vac-conversation-session"><code>$ai_span_name</code><code>{lookup.$ai_span_name}</code></div>
          <ol aria-label="Recorded search properties">
            <li><dl><dt><code>$ai_input_state</code></dt><dd><code>{JSON.stringify(lookup.$ai_input_state)}</code></dd></dl></li>
            <li><dl><dt><code>$ai_output_state</code></dt>{lookup.$ai_output_state.map(stay => <dd key={stay.id}>{stay.name} · <code>capacity: {stay.capacity}</code></dd>)}</dl></li>
          </ol>
        </div>
        <p>Twig’s search code used <code>setting: "City"</code> but omitted <code>guests</code>. Twig passed a two-person stay to the model without checking capacity.</p>
        {action("Fix the search →", () => dispatch({ type: "next" }))}
      </> : lesson.investigation === "fix" ? <>
        <p>In Twig’s search code, add <code>guests: 4</code> to the <code>searchStays</code> call:</p>
        <pre><code>{'searchStays({\n  setting: "City",\n'}<mark>{'  guests: 4,\n'}</mark>{'});'}</code></pre>
        <p>Twig’s search will exclude listings that sleep fewer than four before passing results to the model.</p>
        {action("Apply fix and retry →", () => dispatch({ type: "apply-capacity-fix" }))}
      </> : lesson.investigation === "evaluation" && after ? <>
        <p><code>$ai_is_error</code> reports model-call errors. An evaluation checks the model’s answer against a rule.</p>
        <p>The lab runs <code>evaluateCapacity</code> with this rule: any recommended stay must sleep at least four.</p>
        <pre><code>{'evaluateCapacity(recommendation, 4).result;'}</code></pre>
        <div className="vac-conversation-traces" role="group" aria-label="Capacity evaluation before and after the fix">
          <div className="vac-conversation-session">Capacity check</div>
          <ol aria-label="Evaluation results">
            <li><dl><dt>Before the fix</dt><dd><code>{before.capacityEvidence?.evaluation.result}</code> · Le Nid Chic sleeps two.</dd></dl></li>
            <li><dl><dt>After the fix</dt><dd><code>{after.capacityEvidence?.evaluation.result}</code> · The model recommended no stay.</dd></dl></li>
          </ol>
        </div>
        <p>The corrected answer passes this rule because it recommends no undersized stay. Twig still found no matching listings.</p>
        {action("Finish the lab →", () => dispatch({ type: "next" }))}
      </> : !after ? <>
        <p>Twig’s search now includes the guest filter. Send the city request again, then inspect the events Twig captures.</p>
        <LabChecklist label="Next chat action" items={[{ done: false, label: <>Click <strong>↑ Send</strong> in the highlighted chat bar to send <strong>“Find me a city stay for four.”</strong></> }]} />
        <p className="vac-muted vac-trip-mobile-hint">On mobile, tap <strong>Playground</strong> in the chat to return here.</p>
      </> : <>
        <p>Twig searched with <code>guests: 4</code> and found no matching listings. PostHog shows those results in the new search span:</p>
        <div className="vac-conversation-traces" role="group" aria-label="Corrected catalog search filters and results">
          <div className="vac-conversation-session"><code>$ai_span_name</code><code>search_stays</code></div>
          <ol aria-label="Recorded search properties">
            <li><dl><dt><code>$ai_input_state</code></dt><dd><code>{JSON.stringify(correctedLookup?.$ai_input_state)}</code></dd></dl></li>
            <li><dl><dt><code>$ai_output_state</code></dt><dd><code>{JSON.stringify(correctedLookup?.$ai_output_state)}</code></dd></dl></li>
          </ol>
        </div>
        <p>Twig passes the empty results to the model. PostHog shows the model’s response in the new generation:</p>
        <TripPlannerFailureTrace record={after} />
        {action("Evaluate the answer →", () => dispatch({ type: "next" }))}
      </>}
    </>}
  </section>;
}
