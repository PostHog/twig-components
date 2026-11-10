import type {TwigPageKind} from "../lib/twig-analytics.js";
"use client";
import {useExperienceRuntime} from "../Runtime.js";

import type { ReactNode } from "react";

import { describeInstrumentation, inspectionContexts, replayCaptureSource } from "../lib/twig-instrumentation.js";
import { LabCompletion } from "./LabCompletion.js";
import { StayLab, useStayLab } from "./StayLab.js";
import { useLessonScreen } from "./LabChecklist.js";
import { BookingLab, useBookingLab } from "./BookingLab.js";
import { ReplayLab, useReplay } from "./ReplayLab.js";
import { ErrorTrackingLab, useErrorTrackingLab } from "./ErrorTrackingLab.js";
import { isErrorTrackingLabComplete } from "../../error-tracking-lab.js";
import { AiLab } from "./AiLab.js";
import { useTripPlannerLab } from "../../TripPlannerLab.js";
import { EventsLab, EventsExperienceSwitch } from "../../EventsLab.js";
import { useEventsLab } from "../../EventsLabProvider.js";
import { LabDirectory, ProductLabLanding, PlaygroundInspectionView, replayInspectionGuide, type PlaygroundActivity, type InspectionSessionState, type InspectionSessionAction } from "../../PlaygroundPanels.js";
import { LabNavigationView, LessonActionScope } from "../../LabNavigation.js";
import { usePlaygroundLab } from "../../PlaygroundController.js";
export { PlaygroundLabProvider as FilterLabProvider, useFilterLab } from "../../PlaygroundController.js";
import type { LabStartPage, PlaygroundPage, TouchpointId } from "../lib/vacation/playground.js";
import { touchpointDefinitions } from "../lib/vacation/playground.js";
import { stays } from "../lib/vacation/catalog.js";
import { usePathname, useRouter } from "./TwigNavigation.js";
import {twigPageKind} from "../lib/twig-analytics.js";
import {
  useRef,
  useEffect,
} from "react";

export function LabNavigation({ embedded = false, onResetTwig, returnTo, pageKind, placement = "legacy" }: {
  placement?: "legacy" | "header" | "footer";
  embedded?: boolean;
  onResetTwig?: (id: TouchpointId) => void;
  returnTo?: { label: string; onClick: () => void };
  pageKind: TwigPageKind;
}) {
const {trackTwigLabMilestone,trackTwigLabReset}=useExperienceRuntime();

  const { selected, choose, stage, setStage, dispatch } =
    usePlaygroundLab();
  const pathname = usePathname();
  const router = useRouter();
  const eventsLab = useEventsLab();
  const booking = useBookingLab();
  const stayLab = useStayLab();
  const replay = useReplay();
  const errors = useErrorTrackingLab();
  const ai = useTripPlannerLab();
  if (!selected) return null;
  function returnToTop() {
    const scroller = document.querySelector(".vac-dock-scroll");
    if (scroller) scroller.scrollTop = 0;
    document
      .getElementById("twig-playground-heading")
      ?.focus({ preventScroll: true });
  }
  return (
    <>
    <LabNavigationView
      placement={placement}
      selected={selected}
      stage={selected === "discovery" ? ai.lesson.step : selected === "catalog" ? eventsLab.state.step : stage}
      embedded={embedded}
      returnTo={returnTo}
      resetScope={onResetTwig ? "twig" : "lab"}
      onAllLabs={() => {
        choose(null);
        if (pathname === "/profile/bookings") {
          router.push(`/stays/${errors.state.booking?.stayId ?? stays[0].id}`);
          return;
        }
        returnToTop();
      }}
      onPrevious={() => {
        replay.stop();
        if (selected === "discovery") ai.dispatchLesson({ type: "previous" });
        else if (selected === "catalog") eventsLab.dispatch({ type: "previous" });
        else setStage(stage - 1);
        returnToTop();
      }}
      onReset={() => {
        if (onResetTwig) {
          trackTwigLabReset(selected, pageKind);
          onResetTwig(selected);
          return;
        }
        trackTwigLabReset(selected, pageKind);
        if (selected === "catalog") eventsLab.dispatch({ type: "reset" });
        else if (selected === "replay") replay.reset();
        else if (selected === "stay") stayLab.dispatch({ type: "reset" });
        else if (selected === "booking") booking.dispatch({ type: "reset" });
        else if (selected === "errors") errors.dispatch({ type: "reset" });
        else if (selected === "discovery") ai.reset();
        else dispatch({ type: "reset" });
        if (embedded) {
          trackTwigLabMilestone(selected, "exercise_started");
        }
        setStage(embedded ? 1 : 0);
        returnToTop();
      }}
    />
    {placement !== "footer" && selected === "catalog" && !embedded && <EventsExperienceSwitch state={eventsLab.state} dispatch={eventsLab.dispatch} />}
    </>
  );
}

export function FilterLab() {
const {trackTwigLabCompleted,trackTwigLabMilestone}=useExperienceRuntime();

  const { state, dispatch } = useEventsLab();
  const { choose } = usePlaygroundLab();
  useLessonScreen(`${state.step}:${state.revision}`);
  useEffect(() => {
    if (state.step === 1) trackTwigLabMilestone("catalog", "exercise_started");
    if (state.step === 5 && state.answered) trackTwigLabMilestone("catalog", "evidence_reviewed");
    if (state.step === 6) trackTwigLabCompleted("catalog");
  }, [state.step, state.answered]);
  return <EventsLab state={state} dispatch={dispatch} onChoose={() => choose(null)} />;
}

export function PlaygroundGuide({
  page,
  activity = [],
  inspectionId,
  inspectionSession,
  onInspectionSessionChange,
  exploring = false,
  inspectionOnly = false,
  inspectionIntroduction = true,
  inspectionGuidance,
  onExitTour,
  onInspectionChange,
  onVisitLab,
  onStartLab,
  embedded = false,
}: {
  page: PlaygroundPage;
  activity?: readonly PlaygroundActivity[];
  inspectionId?: TouchpointId | null;
  inspectionSession?: InspectionSessionState;
  onInspectionSessionChange?: (state: InspectionSessionState, action: InspectionSessionAction) => void;
  exploring?: boolean;
  inspectionOnly?: boolean;
  inspectionIntroduction?: boolean;
  inspectionGuidance?: ReactNode;
  onExitTour?: () => void;
  onInspectionChange?: (id: TouchpointId) => void;
  onVisitLab: (id: TouchpointId, startPage: LabStartPage) => void;
  onStartLab: (id: TouchpointId) => void;
  embedded?: boolean;
}) {
const {trackTwigEvent,trackTwigLabCompleted,trackTwigLabMilestone,trackTwigLabStarted}=useExperienceRuntime();

  const booking = useBookingLab();
  const router = useRouter();
  const stayLab = useStayLab();
  const errors = useErrorTrackingLab();
  const replay = useReplay();
  const { resetCount } = replay;
  const replayGuide = replayInspectionGuide(replay.mode ? replay.capturedMasked : replay.masked, Boolean(replay.mode));
  const { stage, setStage, selected, choose } = usePlaygroundLab();
  const markerAnimation = useRef<Animation | null>(null);
  const previousStep = useRef(`${stage}:${selected}`);
  useEffect(() => {
    const step = `${stage}:${selected}`;
    if (embedded && previousStep.current === step) return;
    previousStep.current = step;
    const panel = document.getElementById("guide-panel");
    if (!panel) return;
    const scroller = document.querySelector(".vac-dock-scroll");
    if (scroller) scroller.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }, [stage, selected, embedded]);

  function showMarker(id: TouchpointId) {
    if (id === "discovery") {
      document.querySelector<HTMLButtonElement>('[aria-controls="twig-ai-search"]')?.click();
    } else if (id === "catalog") {
      document.querySelector<HTMLButtonElement>('[aria-controls="twig-destination-search"]')?.click();
      const filters = document.querySelector<HTMLButtonElement>('.vac-browse-toggle');
      if (filters?.getAttribute("aria-expanded") === "false") filters.click();
    }
    const marker = document.getElementById(`twig-marker-${id}`);
    if (!marker) return;
    markerAnimation.current?.cancel();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Scroll the website only. Keep the lab list and keyboard focus in place.
    const bounds = marker.getBoundingClientRect();
    window.scrollTo({
      top: Math.max(
        0,
        window.scrollY + bounds.top - window.innerHeight / 2 + bounds.height / 2
      ),
      behavior: reducedMotion ? "instant" : "smooth",
    });
    if (!reducedMotion)
      markerAnimation.current = marker.animate(
        [
          { transform: "translateY(0)", offset: 0 },
          { transform: "translateY(-10px)", offset: 0.3 },
          { transform: "translateY(0)", offset: 0.6 },
          { transform: "translateY(-4px)", offset: 0.75 },
          { transform: "translateY(0)", offset: 1 },
        ],
        { duration: 700, iterations: 4, delay: 250, easing: "ease-in-out" }
      );
  }
  useEffect(
    () => () => {
      markerAnimation.current?.cancel();
    },
    []
  );
  const current = page.touchpoints.find((item) => item.id === selected)
    ?? (selected ? { id: selected, number: 1, ...touchpointDefinitions[selected] } : undefined);
  function chooseLab(id: TouchpointId) {
    trackTwigLabStarted(id, twigPageKind(page.kind), "directory");
    onStartLab(id);
  }
  if (inspectionOnly) return <PlaygroundInspectionView onExitTour={onExitTour} guidance={inspectionGuidance} showIntroduction={inspectionIntroduction} session={inspectionSession} onSessionChange={onInspectionSessionChange} describe={describeInstrumentation} contexts={{...inspectionContexts,replay:{...replayGuide,sources:[...replayGuide.sources,replayCaptureSource]}}} activity={activity} selectedId={inspectionId} onSelect={id => { onInspectionChange?.(id); trackTwigEvent("twig_playground_inspection_selected", { lab_id: id, source: "console" }); }} choose={id => { if (page.touchpoints.some(point => point.id === id)) chooseLab(id); else onVisitLab(id, id === "catalog" || id === "discovery" || id === "replay" ? "discover" : "stay"); }} />;
  if (!current || exploring) return embedded
    ? <LabDirectory page={page} choose={chooseLab} showMarker={showMarker} onVisitLab={onVisitLab} />
    : <ProductLabLanding selectedId={inspectionId ?? selected ?? "catalog"} choose={(id, startPage) => { if (page.touchpoints.some(point => point.id === id)) chooseLab(id); else onVisitLab(id, startPage); }} />;
  const complete = selected === "errors"
    ? isErrorTrackingLabComplete(stage, errors.state)
    : stage === 3 && current.lab !== "filter-events" && current.lab !== "ai-discovery";
  const currentLab = current;
  function onStage(nextStage: number) {
    if (nextStage === 1 && stage !== 1) {
      trackTwigLabMilestone(currentLab.id, "exercise_started");
    } else if (nextStage === (selected === "errors" ? 3 : 2) && stage !== nextStage) {
      trackTwigLabMilestone(currentLab.id, "evidence_reviewed");
    } else if (nextStage === (selected === "errors" ? 10 : 3) && stage !== nextStage) {
      trackTwigLabCompleted(currentLab.id);
    }
    setStage(nextStage);
  }
  return (
    <div id="twig-playground-detail">
      <div
        id="guide-panel"
        role="region"
        aria-label={`${currentLab.title} lesson`}
        tabIndex={-1}
      >
        {complete && (
          <LabCompletion
            lab={current.id}
            onChoose={() => {
              choose(null);
              if (page.kind === "bookings") router.push(`/stays/${errors.state.booking?.stayId ?? stays[0].id}`);
            }}
            onReview={() => onStage(selected === "errors" ? 9 : 2)}
          />
        )}
        <LessonActionScope visible={!complete}><div hidden={complete}>
          {current.lab === "ai-discovery" ? (
            <AiLab />
          ) : current.lab === "stay-views" ? (
            <StayLab
              key={stayLab.state.revision}
              stage={stage}
              onStage={onStage}
            />
          ) : currentLab.lab === "booking-events" ? (
            <BookingLab
              key={booking.state.revision}
              stage={stage}
              onStage={onStage}
            />
          ) : current.lab === "session-replay" ? (
            <ReplayLab key={resetCount} stage={stage} onStage={onStage} />
          ) : current.lab === "error-tracking" ? (
            <ErrorTrackingLab key={errors.state.revision} stage={stage === 12 && !complete ? 11 : stage} onStage={onStage} />
          ) : current.lab === "filter-events" ? (
            <FilterLab />
          ) : null}
        </div></LessonActionScope>
      </div>
    </div>
  );
}
