"use client";

import { useState } from "react";
import type { TripPlannerRecord } from "./trip-planner-records.js";
import { PlaygroundTraceExplorer } from "./PlaygroundAiEvidence.js";
import { TripPlannerTracePreview, traceForGeneration } from "./TripPlannerTracePreview.js";

/** A generation and its recorded messages, using the session diagram's tree. */
export function TripPlannerFailureTrace({ record }: { record: TripPlannerRecord }) {
  const [field, setField] = useState<"input" | "output">("output");
  return <div className="vac-ai-evidence-stack">
    <PlaygroundTraceExplorer traces={[traceForGeneration(record)]} />
    <TripPlannerTracePreview record={record} field={field} onFieldChange={setField} />
  </div>;
}
