export type OnboardingPhase = "idle" | "stay" | "filter" | "another-stay" | "history" | "compare" | "compare-again" | "follow" | "reset" | "complete";
export type OnboardingAction = { type: "start" | "dismiss" | "clear" | "select-earlier" | "follow" } | { type: "activity"; event?: string };

/** Advance from real site interactions and console controls, never elapsed time. */
export function onboardingReducer(phase: OnboardingPhase, action: OnboardingAction): OnboardingPhase {
  if (action.type === "dismiss") return "idle";
  if (action.type === "clear") return phase === "idle" ? "idle" : phase === "reset" || phase === "complete" ? "complete" : "stay";
  if (action.type === "start") return phase === "idle" || phase === "complete" ? "stay" : phase;
  if (action.type === "follow") return phase === "follow" ? "reset" : phase;
  if (action.type === "select-earlier") {
    if (phase === "history") return "compare";
    if (phase === "compare") return "compare-again";
    if (phase === "compare-again") return "follow";
  }
  if (action.type === "activity") {
    if (phase === "stay" && action.event === "twig_stay_viewed") return "filter";
    if (phase === "filter" && action.event === "twig_stay_filter_selected") return "another-stay";
    if (phase === "another-stay" && action.event === "twig_stay_viewed") return "history";
  }
  return phase;
}
