"use client";
import {useExperienceRuntime} from "../Runtime.js";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "./TwigNavigation.js";
import { usePathname } from "./TwigNavigation.js";
import { stays, stayLabel } from "../lib/vacation/catalog.js";
import { useLessonScreen } from "./LabChecklist.js";
import {
  StayLab as SharedStayLab,
  StayLabProvider as SharedStayLabProvider,
  useStayLab,
} from "../../StayLab.js";


export { useStayLab } from "../../StayLab.js";

export function StayLabProvider({ children, open }: { children: ReactNode; open: boolean }) {
  return (
    <SharedStayLabProvider>
      <StayNavigationCapture open={open} />
      {children}
    </SharedStayLabProvider>
  );
}

function StayNavigationCapture({ open }: { open: boolean }) {
const {trackTwigEvent,trackTwigLabInteraction}=useExperienceRuntime();

  const pathname = usePathname();
  const { dispatch } = useStayLab();
  const previous = useRef(pathname);
  const lastTrackedPath = useRef<string | null>(null);
  useEffect(() => {
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    const stay = stays.find((item) => pathname === `/stays/${item.id}`);
    if (stay) trackTwigEvent(
      "twig_stay_viewed",
      {
        stay_id: stay.id
      }
    );
  }, [pathname]);
  useEffect(() => {
    const changed = previous.current !== pathname;
    previous.current = pathname;
    if (!open || !changed) return;
    const stay = stays.find((stay) => pathname === `/stays/${stay.id}`);
    if (stay) {
      trackTwigLabInteraction("stay", "stay_viewed");
      dispatch({ type: "view", id: stay.id, title: stayLabel(stay) });
    }
  }, [pathname, open, dispatch]);
  useEffect(() => {
    if (!open) dispatch({ type: "pause" });
  }, [open, dispatch]);
  return null;
}
export function StayLab({ stage, onStage }: { stage: number; onStage: (value: number) => void }) {
  const pathname = usePathname();
  const { state } = useStayLab();
  const distinct = new Set(state.events.map((event) => event.actualStayId));
  useLessonScreen(`${stage}:${!!state.applied}:${distinct.size >= 2}`);
  return (
    <SharedStayLab
      stage={stage}
      onStage={onStage}
      pathname={pathname}
      renderStayLink={(stay) => (
        <Link href={`/stays/${stay.id}`} className="vac-button">
          <span className="vac-os-button-face">Open {stayLabel(stay)} →</span>
        </Link>
      )}
    />
  );
}
