"use client";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { AiLabProvider } from "./AiLab.js";
import { BookingLabProvider } from "./BookingLab.js";
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
  initialSource,
}: {
  children: ReactNode;
  active: boolean;
  bookingEnabled: boolean;
  initialSource?: "fixed" | "clicked";
}) {
  const replay = useReplay();
  const stayLab = useStayLab();
  const resumeStay = bookingEnabled && stayLab.state.running;
  const [state, dispatch] = useReducer(filterLabReducer, initialLabState);
  const [stage, setStage] = useState(
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
  function choose(id: TouchpointId | null) {
    if (initialSource) return;
    if (id !== "stay") stayLab.dispatch({ type: "pause" });
    if (id !== "replay") replay.stop();
    setSelected(id);
    setStage(0);
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
      <AiLabProvider active={active && selected === "discovery" && stage > 0}>
        <BookingLabProvider
          active={bookingEnabled && selected === "booking" && stage > 0}
        >
          {children}
        </BookingLabProvider>
      </AiLabProvider>
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
