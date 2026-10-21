"use client";

import { touchpointDefinitions } from "./playground.js";

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

export function TripPlannerWalkthrough({ stays, onAllLabs, renderStayCard, onEvaluate }: { stays: readonly Stay[]; onAllLabs: () => void; renderStayCard?: (stay: Stay) => ReactNode; onEvaluate?: (phase: "before" | "after") => void }) {
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

  if (lesson.step === 3 || lesson.step === 4) return <TripPlannerFailure stays={stays} renderStayCard={renderStayCard} onEvaluate={onEvaluate} />;
  if (lesson.step === 0) return <div className="vac-guide-intro">
    <h3>{touchpointDefinitions.discovery.title}</h3>
    <p>Follow a chat in Twig's trip planner into PostHog. Learn how it's instrumented, how to interpret the data it collects, and fix things when they go wrong.</p>
    <div className="vac-guide-example vac-guide-lesson vac-trip-overview-card">
      <p><strong>This lab has two parts:</strong></p>
      <ol className="vac-trip-overview">
        <li>Learn how PostHog captures data from Twig's AI chat, and how to interpret the data.</li>
        <li>Investigate a failure in Twig's AI chat.</li>
      </ol>
    </div>
    <Action onClick={next}>Start the lab →</Action>
    <details className="vac-lab-step">
      <summary>How this simulation works</summary>
      <p>Twig’s chat uses preset replies, and this lab builds its PostHog examples locally from the conversation. No model runs and nothing is sent to PostHog.</p>
    </details>
  </div>;

  return <section ref={view} tabIndex={-1} className="vac-lab vac-builder vac-trip-walkthrough">
    {lesson.step === 1 && <>
      {lesson.captureVisible ? <>
        <p>PostHog groups Twig’s chat data into:</p>
        <ul className="vac-trip-definitions">
          <li><strong>Session:</strong> one conversation, containing its request traces.</li>
          <li><strong>Trace:</strong> one request, containing model calls and other operations.</li>
          <li><strong>Generation:</strong> one model call, with its input and output.</li>
        </ul>
        <p>Here’s the hierarchy: sessions contain traces, and traces contain generations.</p>
        <div className="vac-conversation-traces vac-conversation-hierarchy" role="group" aria-label="Session contains traces, each trace contains generations">
          <div className="vac-conversation-session">Session</div>
          <ol aria-label="Traces in the session">
            <li>Trace
              <ol aria-label="Generations in the trace">
                <li>Generation</li>
              </ol>
            </li>
          </ol>
        </div>
        <p>A model response is recorded as a <code>$ai_generation</code> event. In your app, a capture call like this connects it to its trace and session:</p>
        <pre><code>{generationCaptureExample}</code></pre>
        <p>A product event tells you someone used the planner. A generation shows how the model answered.</p>
        <p>Let’s follow a chat to break down this capture call.</p>
        <Action onClick={next}>Follow the chat →</Action>
      </> : !first ? <>
        <LabChecklist label="Next chat action" items={[{ done: false, label: <>Send the pre-filled <strong>forest getaway for four</strong> message in Twig’s highlighted AI trip planner.</> }]} />
        <p>Each answer creates a local <code>$ai_generation</code> example with input and output. The guided chat uses pre-filled messages so you can follow the same conversation.</p>
        <p className="vac-muted vac-trip-mobile-hint">On mobile, tap <strong>Playground</strong> in the chat to return here.</p>
      </> : showConversation ? <>
        <TripPlannerConversation />
        <Action onClick={next}>Review what you’ve learned →</Action>
      </> : <>
        <p>This generation shows the request’s input and output. In your app, PostHog captures both in the same event:</p>
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
        headingRef={completionHeading}
        recap={{
          title: "You followed a conversation into PostHog, found a missing guest filter, and verified the fix.",
          points: [
            "Capture a model’s input and output, then inspect them in a trace.",
            "Group requests into one conversation with an AI session.",
            "Inspect a search span to find the missing guest filter.",
            "Run a capacity evaluation before and after the fix.",
          ],
        }}
        onChoose={onAllLabs}
      />
    </>}
  </section>;
}
