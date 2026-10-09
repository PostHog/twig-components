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
    <p>Follow a chat in Twig's trip planner into PostHog. Learn how it's instrumented, how to interpret the data it collects, and fix things when they go wrong.</p>
    <div className="vac-guide-example vac-guide-lesson vac-trip-overview-card">
      <p><strong>This lab has two parts:</strong></p>
      <ol className="vac-trip-overview">
        <li>Learn how PostHog captures data from Twig's AI chat, and how to interpret the data.</li>
        <li>Investigate a failure in Twig's AI chat.</li>
      </ol>
    </div>
    <Action onClick={next}>Start the lab →</Action>
  </div>;

  return <section ref={view} tabIndex={-1} className="vac-lab vac-builder vac-trip-walkthrough">
    {lesson.step === 1 && <>
      {lesson.captureVisible ? <>
        <p>When you interact with Twig's AI trip planner, Twig’s PostHog capture code captures the model’s input and output and connects the request to its conversation:</p>
        <pre><code>{generationCaptureExample}</code></pre>
        <div className="vac-conversation-traces" role="group" aria-label="Generation event properties">
          <div className="vac-conversation-session"><code>$ai_generation</code></div>
          <ol aria-label="What the event records">
            <li><dl><dt>Input and output</dt><dd>What the model received and returned.</dd></dl></li>
            <li><dl><dt><code>$ai_trace_id</code></dt><dd>Which request this model call belongs to.</dd></dl></li>
            <li><dl><dt><code>$ai_session_id</code></dt><dd>Which conversation the request belongs to.</dd></dl></li>
          </ol>
        </div>
        <p>Now let’s follow a chat to break down each of these properties.</p>
        <Action onClick={next}>Follow the chat →</Action>
      </> : !first ? <>
        <LabChecklist label="Next chat action" items={[{ done: false, label: <>Click <strong>↑ Send</strong> in Twig’s highlighted chat bar to ask for a <strong>forest getaway for four</strong>.</> }]} />
        <p>Each answer from Twig's AI chat records a <code>$ai_generation</code> event in PostHog – the event includes the input sent to the model and the output it returned.</p>
        <p className="vac-muted vac-trip-mobile-hint">On mobile, tap <strong>Playground</strong> in the chat to return here.</p>
      </> : showConversation ? <>
        <TripPlannerConversation />
        <Action onClick={next}>Review what you’ve learned →</Action>
      </> : <>
        <p>PostHog records Twig's AI chats as Traces. The following example shows how the conversation is captured, and how PostHog records it:</p>
        <EvidenceTabs label="Request data" value={lesson.field} onChange={(value) => dispatch({ type: "field", value })} options={[
          { value: "input", label: "Input" }, { value: "output", label: "Output" },
        ]}>
          <p className="vac-capture-context">After the model responds, one capture call records both input and output. This tab highlights the {input ? "input" : "output"}:</p>
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
            "Capture a model’s input and output, then inspect them in a trace.",
            "Group requests into one conversation with an AI session.",
            "Inspect a search span to find the missing guest filter.",
            "Retry the request and check the result with a capacity evaluation.",
          ],
        }}
        onChoose={onAllLabs}
      />
    </>}
  </section>;
}
