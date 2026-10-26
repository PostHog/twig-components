"use client";

import { useEffect } from "react";

export { LabChecklist } from "../../LabChecklist.js";

export function useLessonScreen(screen: string) {
  useEffect(() => {
    const scroller = document.querySelector(".vac-dock-scroll");
    if (scroller) scroller.scrollTop = 0;
  }, [screen]);
}
