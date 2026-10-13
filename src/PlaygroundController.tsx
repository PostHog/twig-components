"use client";

import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { AiLabProvider } from "./AiLab.js";
import { BookingLabProvider } from "./BookingLab.js";
import { ErrorTrackingLabProvider } from "./ErrorTrackingLab.js";
import type { ErrorTrackingAction, ErrorTrackingState } from "./error-tracking-lab.js";
import { useStayLab } from "./StayLab.js";
import { useReplay } from "./ReplayRecorder.js";
import { filterLabReducer, initialLabState, type LabAction, type LabState } from "./filter-lab.js";
import type { TouchpointId } from "./playground.js";

const PlaygroundLabContext = createContext<{
  embedSource?: "fixed" | "clicked";
  state: LabState;
  dispatch: (action: LabAction) => void;
  active: boolean;
  stage: number;
  setStage: (stage: number) => void;
  selected: TouchpointId | null;
  choose: (id: TouchpointId | null) => void;
  highlighted: TouchpointId | null;
  highlight: (id: TouchpointId | null) => void;
}>({
  state: initialLabState,
  dispatch: () => {},
  active: false,
  stage: 0,
  setStage: () => {},
  selected: null,
  choose: () => {},
  highlighted: null,
  highlight: () => {},
});

export function PlaygroundLabProvider({
  children,
  active,
  bookingEnabled,
  errorTrackingEnabled = false,
  errorTrackingSession,
  onErrorTrackingAction,
  onErrorTrackingStageChange,
  pendingSelection,
  onPendingSelectionConsumed,
  initialSource,
}: {
  children: ReactNode;
  active: boolean;
  bookingEnabled: boolean;
  errorTrackingEnabled?: boolean;
  errorTrackingSession?: { state: ErrorTrackingState; stage: number };
  onErrorTrackingAction?: (action: ErrorTrackingAction) => void;
  onErrorTrackingStageChange?: (stage: number) => void;
  /** @deprecated Fresh starts and resets are owned by the host. */
  onRestartErrorLab?: () => void;
  /** @deprecated Route changes no longer reset lab progress. */
  pageKey?: string;
  pendingSelection?: TouchpointId | null;
  onPendingSelectionConsumed?: () => void;
  initialSource?: "fixed" | "clicked";
}) {
  const replay = useReplay();
  const stayLab = useStayLab();
  const resumeStay = bookingEnabled && stayLab.state.running;
  const [state, dispatch] = useReducer(filterLabReducer, initialLabState);
  const [localStage, setLocalStage] = useState(
    initialSource || replay.mode || resumeStay ? 1 : 0
  );
  const [selected, setSelected] = useState<TouchpointId | null>(
    initialSource
      ? "catalog"
      : replay.mode
      ? "replay"
      : resumeStay
      ? "stay"
      : null
  );
  const [highlighted, highlight] = useState<TouchpointId | null>(null);
  const stage = selected === "errors" && errorTrackingSession ? errorTrackingSession.stage : localStage;
  function setStage(nextStage: number) {
    if (selected === "errors" && onErrorTrackingStageChange) onErrorTrackingStageChange(nextStage);
    else setLocalStage(nextStage);
  }
  useEffect(() => {
    if (!pendingSelection) return;
    setSelected(pendingSelection);
    if (pendingSelection !== "errors") setLocalStage(0);
    highlight(null);
    dispatch({ type: "cancel" });
    onPendingSelectionConsumed?.();
  }, [pendingSelection, onPendingSelectionConsumed]);
  function choose(id: TouchpointId | null) {
    if (initialSource) return;
    if (id !== "stay") stayLab.dispatch({ type: "pause" });
    if (id !== "replay") replay.stop();
    setSelected(id);
    setLocalStage(0);
    dispatch({ type: "cancel" });
  }
  return (
    <PlaygroundLabContext.Provider
      value={{
        embedSource: initialSource,
        state,
        dispatch,
        active: active && selected === "catalog" && stage > 0,
        stage,
        setStage,
        selected,
        choose,
        highlighted,
        highlight,
      }}
    >
      <ErrorTrackingLabProvider active={errorTrackingEnabled && selected === "errors" && stage > 0} state={errorTrackingSession?.state} onAction={onErrorTrackingAction}>
        <AiLabProvider active={active && selected === "discovery" && stage > 0}>
          <BookingLabProvider active={bookingEnabled && selected === "booking" && stage > 0}>
            {children}
          </BookingLabProvider>
        </AiLabProvider>
      </ErrorTrackingLabProvider>
    </PlaygroundLabContext.Provider>
  );
}

export function usePlaygroundLab() {
  return useContext(PlaygroundLabContext);
}

export function useFilterLab() {
  const {
    state,
    dispatch,
    active,
    stage,
    selected,
    choose,
    highlighted,
    highlight,
  } = useContext(PlaygroundLabContext);
  return {
    selected,
    choose,
    highlighted,
    highlight,
    active: active && (state.selecting || !!state.applied),
    selecting: active && state.selecting,
    stage,
    recordFilter: (setting: string) => {
      if (!active) return false;
      if (state.selecting) {
        dispatch({ type: "target" });
        return true;
      }
      dispatch({ type: "filter", setting });
      return false;
    },
  };
}
