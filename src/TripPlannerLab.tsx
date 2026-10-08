"use client";

import { createContext, useCallback, useContext, useReducer, useState, type ReactNode } from "react";
import { initialTripLesson, tripLessonReducer, type TripLessonState, type TripLessonAction } from "./trip-planner-lesson.js";
import type { TripPlannerRecord } from "./trip-planner-records.js";

const TripPlannerLabContext = createContext<{
  records: readonly TripPlannerRecord[];
  record: (record: TripPlannerRecord) => void;
  reset: () => void;
  revision: number;
  lesson: TripLessonState;
  dispatchLesson: (action: TripLessonAction) => void;
} | null>(null);

/** Keep above both the chat and dock so closing either view preserves evidence. */
export function TripPlannerLabProvider({ children }: { children: ReactNode }) {
  const [lesson, reduceLesson] = useReducer(tripLessonReducer, initialTripLesson);
  const dispatchLesson = useCallback((action: TripLessonAction) => {
    reduceLesson(action);
    if (action.type === "reset" ||
      (action.type === "apply-capacity-fix" && !lesson.capacityFixed && lesson.step === 4 && lesson.investigation === "fix" && !!lesson.failureEvidence[0])) {
      setRevision(previous => previous + 1);
    }
  }, [lesson]);
  const [records, setRecords] = useState<TripPlannerRecord[]>([]);
  const [revision, setRevision] = useState(0);
  const record = useCallback((request: TripPlannerRecord) => {
    setRecords((previous) => [...previous, request].slice(-24));
    reduceLesson({ type: "record", record: request });
  }, []);
  const reset = useCallback(() => {
    reduceLesson({ type: "reset" });
    setRecords([]);
    setRevision((previous) => previous + 1);
  }, []);
  return <TripPlannerLabContext.Provider value={{ records, record, reset, revision, lesson, dispatchLesson }}>{children}</TripPlannerLabContext.Provider>;
}

export function useTripPlannerLab() {
  const context = useContext(TripPlannerLabContext);
  if (!context) throw new Error("useTripPlannerLab requires TripPlannerLabProvider");
  return context;
}

export { TripPlannerWalkthrough } from "./TripPlannerWalkthrough.js";

export { canSendTripLessonMessage } from "./trip-planner-lesson.js";
