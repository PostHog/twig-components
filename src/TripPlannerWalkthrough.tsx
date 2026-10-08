"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { generationCaptureExample } from "./trip-planner-capture-example.js";
import { LabCompletionView } from "./LabCompletionView.js";
import { TripPlannerMilestone } from "./TripPlannerMilestone.js";
import { TripPlannerConversation } from "./TripPlannerConversation.js";
import { TripPlannerTracePreview } from "./TripPlannerTracePreview.js";
import { TripPlannerFailure } from "./TripPlannerFailure.js";
import { LabChecklist } from "./LabChecklist.js";
import { EvidenceTabs } from "./TripPlannerEvidenceTabs.js";
import { useTripPlannerLab } from "./TripPlannerLab.js";
import type { Stay } from "./catalog.js";

const inputField = '  $ai_input: messages,\n';
const outputField = '  $ai_output_choices: [{\n    role: "assistant",\n    content: response\n  }],\n';

function Action({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <div className="vac-request-next"><button type="button" className="vac-button" onClick={onClick}><span className="vac-os-button-face">{children}</span></button></div>;
}

export function TripPlannerWalkthrough({ stays, onAllLabs, renderStayCard }: { stays: readonly Stay[]; onAllLabs: () => void; renderStayCard?: (stay: Stay) => ReactNode }) {
  const lab = useTripPlannerLab();
  const view = useRef<HTMLElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const { lesson, dispatchLesson: dispatch } = lab;
  const [first, second] = lesson.evidence;
  const input = lesson.field === "input";
  const next = () => dispatch({ type: "next" });
  const firstInspected = ["first:input", "first:output"].every(field => lesson.inspected.includes(field));
  const showConversation = !!second && lesson.conversationVisible;
  useEffect(() => {
    if (showConversation) view.current?.focus({ preventScroll: true });
  }, [showConversation, lesson.step]);
  const inspectOutput = () => {
    dispatch({ type: "field", value: "output" });
    requestAnimationFrame(() => view.current?.querySelector<HTMLButtonElement>('[role="tab"][data-field="output"]')?.focus());
  };
  const resetConversation = first && lab.records.at(-1)?.properties.$ai_session_id !== first.properties.$ai_session_id;

  if (lesson.step === 3 || lesson.step === 4) return <TripPlannerFailure stays={stays} renderStayCard={renderStayCard} />;
  if (lesson.step === 0) return <div className="vac-guide-intro">
    <h3>AI Observability lab</h3>
    <p>Follow a chat in Twig’s trip planner. Inspect the data Twig sends to PostHog, then fix a bug in Twig’s search code.</p>
    <p><strong>This lab has two parts:</strong></p>
    <ol className="vac-trip-overview">
      <li>Learn how Twig captures AI chat data and how to interpret it in PostHog.</li>
      <li>Investigate a failure in Twig's AI chat.</li>
    </ol>
    <Action onClick={next}>Start the lab →</Action>
  </div>;

  return <section ref={view} tabIndex={-1} className="vac-lab vac-builder vac-trip-walkthrough">
    {lesson.step === 1 && <>
      {lesson.captureVisible ? <>
        <p>Twig calls <code>posthog.capture</code> to send the model’s input and output to PostHog. Twig includes IDs so PostHog can group model calls by request and conversation:</p>
        <ul className="vac-trip-definitions">
          <li><code>$ai_generation</code>: an event recording one model call.</li>
          <li><code>$ai_input</code>: messages Twig sends to the model.</li>
          <li><code>$ai_output_choices</code>: the model’s response.</li>
          <li><code>$ai_trace_id</code>: ID PostHog uses to group events for one request.</li>
          <li><code>$ai_session_id</code>: ID PostHog uses to group requests into a conversation.</li>
        </ul>
        <pre><code>{generationCaptureExample}</code></pre>
        <p>Let’s follow a chat to break down this capture call.</p>
        <Action onClick={next}>Follow the chat →</Action>
      </> : !first ? <>
        <LabChecklist label="Next chat action" items={[{ done: false, label: <>Click <strong>↑ Send</strong> in Twig’s highlighted chat bar to ask for a <strong>forest getaway for four</strong>.</> }]} />
        <p>After the model responds, Twig captures an <code>$ai_generation</code> event with the model’s input and output.</p>
        <p className="vac-muted vac-trip-mobile-hint">On mobile, tap <strong>Playground</strong> in the chat to return here.</p>
      </> : showConversation ? <>
        <TripPlannerConversation />
        <Action onClick={next}>Continue →</Action>
      </> : <>
        <p>PostHog groups the events for each request into a <strong>trace</strong>. Here’s Twig’s capture call for the forest request:</p>
        <EvidenceTabs label="Request data" value={lesson.field} onChange={(value) => dispatch({ type: "field", value })} options={[
          { value: "input", label: "Input" }, { value: "output", label: "Output" },
        ]}>
          <p className="vac-capture-context">Twig sends both input and output in this call. The {input ? "input" : "output"} property is highlighted:</p>
          <pre><code>{'posthog.capture("$ai_generation", {\n  $ai_trace_id: traceId,\n  $ai_session_id: sessionId,\n'}{input ? <mark>{inputField}</mark> : inputField}{input ? outputField : <mark>{outputField}</mark>}{'  // Other fields omitted\n});'}</code></pre>
          <TripPlannerTracePreview record={first} field={lesson.field} />
          {input && <Action onClick={inspectOutput}>Inspect output →</Action>}
        </EvidenceTabs>
        {!second && firstInspected && <LabChecklist label="Next chat action" items={[{ done: false, label: <>Next, send the pre-filled <strong>beach access question</strong> in Twig’s chat.</> }]} />}
        {second && firstInspected && <Action onClick={next}>Connect the requests →</Action>}
        {!second && resetConversation && <p>The chat was restarted. Use <strong>Reset lab</strong> to follow a fresh conversation.</p>}
      </>}
    </>}
    {lesson.step === 2 && <TripPlannerMilestone onContinue={next} />}
    {lesson.step === 5 && <>
      <LabCompletionView
        lab="discovery"
        title="You’ve completed the lab"
        headingRef={completionHeading}
        recap={{
          title: "You followed a conversation into PostHog, found a missing guest filter, and verified the fix.",
          points: [
            "Capture the model’s input and output in Twig, then inspect them in PostHog.",
            "Use an AI session ID to group Twig’s requests into a conversation in PostHog.",
            "Inspect Twig’s search span in PostHog to find the missing guest filter.",
            "Fix Twig’s search filter, then use the lab’s capacity evaluation to check the recommendation.",
          ],
        }}
        onChoose={onAllLabs}
      />
    </>}
  </section>;
}
