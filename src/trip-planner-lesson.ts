import { tripPlannerPrompts } from "./trip-planner.js";
import { capacityPrompt, evaluateCapacity } from "./trip-planner-capacity.js";
import type { TripPlannerRecord } from "./trip-planner-records.js";

export type TripLessonField = "input" | "output";
export type TripLessonRequest = "first" | "followup";
export type TripLessonState = {
  step: number;
  captureVisible: boolean;
  capacityFixed: boolean;
  conversationVisible: boolean;
  evidence: TripPlannerRecord[];
  failureEvidence: TripPlannerRecord[];
  request: TripLessonRequest;
  field: TripLessonField;
  inspected: string[];
  beforeEvaluation?: ReturnType<typeof evaluateCapacity>;
  afterEvaluation?: ReturnType<typeof evaluateCapacity>;
  investigation: "evaluate-before" | "overview" | "lookup" | "fix" | "retry" | "evaluation";
};
export const initialTripLesson: TripLessonState = {
  step: 0, captureVisible: true, capacityFixed: false, conversationVisible: false, evidence: [], failureEvidence: [],
  request: "first", field: "input", inspected: [], investigation: "evaluate-before",
};
export type TripLessonAction =
  | { type: "record"; record: TripPlannerRecord }
  | { type: "next" | "previous" | "reset" | "apply-capacity-fix" | "run-evaluation" }
  | { type: "field"; value: TripLessonField }
  | { type: "request"; value: TripLessonRequest }
  | { type: "investigation"; value: "lookup" | "fix" };

function inspected(state: TripLessonState, request = state.request, field = state.field) {
  return [...new Set([...state.inspected, `${request}:${field}`])];
}
export function canAdvanceTripLesson(state: TripLessonState): boolean {
  switch (state.step) {
    case 0: return true;
    case 1: return state.captureVisible || !!state.evidence[1] && ["first:input", "first:output"].every(view => state.inspected.includes(view));
    case 2: return true; // Review the successful conversation before starting the failure.
    case 3: return !!state.failureEvidence[0];
    case 4: return !!state.failureEvidence[0] && !!state.beforeEvaluation && (
      state.investigation === "evaluate-before" || state.investigation === "overview" || state.investigation === "lookup"
      || (state.investigation === "retry" && !!state.failureEvidence[1])
      || (state.investigation === "evaluation" && !!state.failureEvidence[1] && !!state.afterEvaluation));
    default: return false;
  }
}

export function tripLessonReducer(state: TripLessonState, action: TripLessonAction): TripLessonState {
  switch (action.type) {
    case "reset": return initialTripLesson;
    case "run-evaluation": {
      if (state.step !== 4 || !["evaluate-before", "evaluation"].includes(state.investigation)) return state;
      const isBefore = state.investigation === "evaluate-before";
      if (!isBefore && !state.beforeEvaluation) return state;
      const record = state.failureEvidence[isBefore ? 0 : 1];
      if (!record?.capacityEvidence) return state;
      const recommendation = record.capacityEvidence.lookup.properties.$ai_output_state
        .find(stay => stay.id === record.properties.selected_stay_id);
      const result = evaluateCapacity(recommendation, 4);
      return { ...state, [isBefore ? "beforeEvaluation" : "afterEvaluation"]: result };
    }
    case "apply-capacity-fix": return state.step === 4 && state.investigation === "fix" && state.beforeEvaluation && state.failureEvidence[0]
      ? { ...state, capacityFixed: true, investigation: "retry" } : state;
    case "previous":
      if (state.step === 1 && !state.captureVisible) return { ...state, captureVisible: true };
      if (state.step === 4 && state.investigation !== "evaluate-before") return {
        ...state, investigation: state.investigation === "evaluation" ? "retry" : state.investigation === "retry" ? "fix" : state.investigation === "fix" ? "lookup" : state.investigation === "lookup" ? "overview" : "evaluate-before",
      };
      return { ...state, step: Math.max(0, state.step - 1) };
    case "next":
      if (state.step === 1 && state.captureVisible) return {
        ...state, captureVisible: false,
        inspected: state.evidence[0] ? inspected(state, "first", "input") : state.inspected,
      };
      if (state.step === 4 && canAdvanceTripLesson(state)) {
        if (state.investigation === "evaluate-before") return { ...state, investigation: "overview" };
        if (state.investigation === "overview") return { ...state, investigation: "lookup" };
        if (state.investigation === "lookup") return { ...state, investigation: "fix" };
        if (state.investigation === "retry") return { ...state, investigation: "evaluation" };
      }
      if (state.step === 1 && canAdvanceTripLesson(state) && !state.conversationVisible) return { ...state, conversationVisible: true };
      return canAdvanceTripLesson(state) ? {
      ...state, step: state.step + 1,
      inspected: state.inspected,
    } : state;
    case "record": {
      const first = state.evidence[0];
      const p = action.record.properties;
      // Website failures can arrive before the learner opens the lab.
      if (action.record.capacityEvidence) {
        if (!state.failureEvidence[0] && p.scenario === "capacity-broken") return { ...state, failureEvidence: [action.record] };
        if (state.failureEvidence[0] && state.capacityFixed && !state.failureEvidence[1] && p.scenario === "capacity-fixed")
          return { ...state, failureEvidence: [state.failureEvidence[0], action.record] };
        return state;
      }
      // Anchor the successful requests to one conversation, including after chat restarts.
      if (!first && p.scenario === "forest") return {
        ...state, evidence: [action.record], request: "first", field: "input",
        inspected: state.step === 1 && !state.captureVisible ? inspected(state, "first", "input") : state.inspected,
      };
      if (first && !state.evidence[1] && p.scenario === "beach" && p.$ai_session_id === first.properties.$ai_session_id)
        return {
          ...state, evidence: [first, action.record],
          conversationVisible: state.step === 1 && !state.captureVisible && ["first:input", "first:output"].every(view => state.inspected.includes(view)),

        };
      return state;
    }
    case "field": return state.step === 1 && !state.captureVisible && state.evidence[state.request === "first" ? 0 : 1]
      ? { ...state, field: action.value, inspected: inspected(state, state.request, action.value) } : state;
    case "request": return state.step === 1 && !state.captureVisible && state.evidence[action.value === "first" ? 0 : 1]
      ? { ...state, request: action.value, field: "input", inspected: inspected(state, action.value, "input") } : state;
    case "investigation": return state.step === 4 && state.beforeEvaluation && state.failureEvidence[0]
      ? { ...state, investigation: action.value } : state;
  }
}

/** Only the scripted prompt belonging to the visible lesson stage may be sent. */
export function canSendTripLessonMessage(state: TripLessonState, message: string): boolean {
  if (state.step === 1) {
    if (state.captureVisible) return false;
    if (!state.evidence[0]) return message === tripPlannerPrompts.forest;
    return !state.evidence[1]
      && ["first:input", "first:output"].every(field => state.inspected.includes(field))
      && message === tripPlannerPrompts.beach;
  }
  if (state.step === 3 && !state.failureEvidence[0])
    return message === tripPlannerPrompts.kitchen || message === capacityPrompt;
  return state.step === 4 && state.investigation === "retry" && state.capacityFixed && !state.failureEvidence[1] && message === capacityPrompt;
}
