"use client";
import {useExperienceRuntime} from "../Runtime.js";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "./TwigNavigation.js";
import {replayInspectionActivity} from "../lib/twig-inspection.js";
import { usePathname } from "./TwigNavigation.js";
import { useLessonScreen } from "./LabChecklist.js";
import { SessionPlayer } from "./SessionPlayer.js";
import {
  ReplayProvider as SharedReplayProvider,
  useReplay,
} from "../../ReplayRecorder.js";
import {
  ReplayLab as SharedReplayLab,
  ReplayRecordingBar as SharedReplayRecordingBar,
} from "../../ReplayLab.js";

export { useReplay } from "../../ReplayRecorder.js";

export function ReplayProvider({ children, open }: { children: ReactNode; open: boolean }) {
  const pathname = usePathname();
  return <SharedReplayProvider open={open} pathname={pathname}><ReplayInspectionBridge />{children}</SharedReplayProvider>;
}

function ReplayInspectionBridge() {
const {publishLocalInspectionActivity}=useExperienceRuntime();

  const replay = useReplay();
  const snapshot = { mode: replay.mode, masked: replay.masked, capturedMasked: replay.capturedMasked, count: replay.recording.length };
  const previous = useRef(snapshot);
  useEffect(() => {
    const current = { mode: replay.mode, masked: replay.masked, capturedMasked: replay.capturedMasked, count: replay.recording.length };
    const activity = replayInspectionActivity(previous.current, current);
    previous.current = current;
    if (activity) publishLocalInspectionActivity(activity);
  }, [replay.mode, replay.masked, replay.capturedMasked, replay.recording.length]);
  return null;
}

export function ReplayRecordingBar() {
  return <SharedReplayRecordingBar replay={useReplay()} />;
}

export function ReplayLab({ stage, onStage }: { stage: number; onStage: (stage: number) => void }) {
  const replay = useReplay();
  const pathname = usePathname();
  useLessonScreen(`${stage}:${replay.exercise}:${!!replay.mode}:${replay.recording.length > 1}`);
  return <SharedReplayLab
    stage={stage}
    onStage={onStage}
    replay={replay}
    pathname={pathname}
    returnHome={<Link href="/" className="vac-button"><span className="vac-os-button-face">Return to Find a stay →</span></Link>}
    sessionPlayer={<SessionPlayer events={replay.recording} />}
  />;
}
