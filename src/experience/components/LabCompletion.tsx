"use client";

import { useEffect, useRef } from "react";
import type { TouchpointId } from "../lib/vacation/playground.js";
import { celebrateCompletion } from "./completion-confetti.js";
import { useLessonScreen } from "./LabChecklist.js";
import { LabCompletionView } from "../../LabCompletionView.js";
export { FinishLabButton } from "../../FinishLabButton.js";

export function LabCompletion({ lab, onChoose, onReview }: {
  lab: TouchpointId;
  onChoose: () => void;
  onReview: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLessonScreen("complete");
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (!heading.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return celebrateCompletion(heading.current);
  }, []);
  return <LabCompletionView lab={lab} onChoose={onChoose} onReview={onReview} headingRef={heading} />;
}
