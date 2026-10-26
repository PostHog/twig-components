"use client";
import {useExperienceRuntime} from "../Runtime.js";

import Link from "./TwigNavigation.js";

import { useEffect } from "react";
import { Marker, usePlayground } from "./Playground.js";
import { StayCard } from "./StayCard.js";
import { usePlaygroundLab } from "../../PlaygroundController.js";
import { TripPlanner } from "../../TripPlanner.js";
import { TripPlannerWalkthrough, useTripPlannerLab, canSendTripLessonMessage } from "../../TripPlannerLab.js";
import { celebrateCompletion } from "./completion-confetti.js";
import { useLessonScreen } from "./LabChecklist.js";

import { stays, stayLabel } from "../lib/vacation/catalog.js";

export function AiTripPlanner({ hidden = false, onReveal }: { hidden?: boolean; onReveal?: () => void }) {
const {publishPlannerGeneration,trackTwigEvent,trackTwigLabInteraction}=useExperienceRuntime();

  const lab = useTripPlannerLab();
  const { choose, selected } = usePlaygroundLab();
  const { open: playgroundOpen, openPlayground } = usePlayground();
  useEffect(() => {
    if (selected !== "discovery" || !playgroundOpen || !onReveal) return;
    const frame = requestAnimationFrame(onReveal);
    return () => cancelAnimationFrame(frame);
  }, [selected, playgroundOpen, onReveal]);
  const guided = selected === "discovery" || lab.lesson.step > 0;
  const scenario = lab.lesson.capacityFixed ? "capacity-fixed" : undefined;
  const highlightChat = playgroundOpen && selected === "discovery" && (
    (lab.lesson.step === 1 && !lab.lesson.captureVisible && lab.lesson.evidence.length < 2) ||
    (lab.lesson.step === 3 && !lab.lesson.failureEvidence[0]) ||
    (lab.lesson.step === 4 && lab.lesson.investigation === "retry" && lab.lesson.capacityFixed && !lab.lesson.failureEvidence[1])
  );
  function showPlayground() {
    if (selected !== "discovery") choose("discovery");
    openPlayground();
    requestAnimationFrame(() => {
      const dock = document.getElementById("twig-playground");
      dock?.scrollIntoView({ block: "nearest" });
      dock?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    });
  }
  return (
    <div id="trip-planner" hidden={hidden} className={highlightChat ? "vac-trip-planner-target" : undefined}>
      <TripPlanner
        hidden={hidden}
        key={lab.revision}
        scenario={scenario}
        windowClassName="vac-trip-chat"
        windowAction={{ label: "Playground", onSelect: showPlayground }}
        launcherLabel={playgroundOpen ? "Back to chat" : "Continue your conversation"}
        onRequestComplete={request => {
          lab.record(request);
          trackTwigEvent(
            "twig_ai_simulation_run",
            {
              scenario: "success"
            },
            {
              operationId: request.properties.$ai_trace_id
            }
          );
          publishPlannerGeneration(request);
          if (guided) trackTwigLabInteraction("discovery", "ai_simulation_run", "success");
        }}
        canSendMessage={guided ? message => canSendTripLessonMessage(lab.lesson, message) : undefined}
        onReset={guided ? lab.reset : undefined}
        stays={stays}
        inputId="trip-planner-message"
        accessory={<Marker id="discovery" />}
        renderStayLink={(stay) => <Link href={`/stays/${stay.id}`}>View {stayLabel(stay)} →</Link>}
      />
    </div>
  );
}

export function AiLab() {
const {trackTwigLabInteraction,trackTwigLabMilestone,trackTwigLabCompleted}=useExperienceRuntime();

  const lab = useTripPlannerLab();
  const { choose } = usePlaygroundLab();
  useLessonScreen(`ai:${lab.lesson.step}:${lab.lesson.captureVisible}:${lab.lesson.investigation}:${lab.lesson.evidence.length}:${lab.lesson.capacityFixed}:${lab.lesson.failureEvidence.length}`);
  useEffect(() => {
    document.getElementById("guide-panel")?.focus({ preventScroll: true });
  }, [lab.lesson.step, lab.lesson.captureVisible, lab.lesson.investigation, lab.lesson.capacityFixed]);
  useEffect(() => {
    if (lab.lesson.step === 1) trackTwigLabMilestone("discovery", "exercise_started");
    if (lab.lesson.step === 2) trackTwigLabMilestone("discovery", "evidence_reviewed");
    if (lab.lesson.step === 5) trackTwigLabCompleted("discovery");
  }, [lab.lesson.step]);
  useEffect(() => {
    if (lab.lesson.step !== 5) return;
    const heading = document.querySelector<HTMLHeadingElement>("#guide-panel .vac-completion-title");
    heading?.focus({ preventScroll: true });
    if (!heading || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return celebrateCompletion(heading);
  }, [lab.lesson.step]);
  return <TripPlannerWalkthrough stays={stays} onAllLabs={() => choose(null)} onEvaluate={phase => trackTwigLabInteraction("discovery", "ai_evaluation_run", phase)} renderStayCard={stay => <StayCard stay={stay} />} />;
}
