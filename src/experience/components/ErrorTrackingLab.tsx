"use client";

import { ErrorTrackingLab as SharedErrorTrackingLab, useErrorTrackingLab } from "../../ErrorTrackingLab.js";
import { useLessonScreen } from "./LabChecklist.js";
import { usePathname, useRouter } from "./TwigNavigation.js";

export { useErrorTrackingLab } from "../../ErrorTrackingLab.js";

export function ErrorTrackingLab({ stage, onStage }: { stage: number; onStage: (stage: number) => void }) {
  const { state, dispatch } = useErrorTrackingLab();
  const pathname = usePathname();
  const router = useRouter();
  const location = pathname.startsWith("/stays/") ? "stay" : pathname === "/profile/bookings" ? "bookings" : "other";
  useLessonScreen(`${stage}:${pathname}:${state.booking?.id}:${state.occurrences.length}:${state.caught}:${state.fingerprinted}:${state.repaired}:${state.verified}:${state.resolved}`);
  const focusBooking = () => {
    const form = document.querySelector<HTMLElement>(".vac-booking");
    form?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    form?.querySelector<HTMLElement>("#stay-check-in")?.focus({ preventScroll: true });
  };
  const focusDetails = () => {
    if (pathname !== "/profile/bookings") {
      router.push("/profile/bookings");
      return;
    }
    const button = [...document.querySelectorAll<HTMLButtonElement>(".twig-booking-details")]
      .find((item) => item.dataset.bookingId === state.booking?.id);
    const target = (stage === 4 || stage === 10) && button?.getAttribute("aria-expanded") === "true"
      ? button.closest(".twig-booking-card")?.querySelector<HTMLButtonElement>(".twig-trip-error-actions button:not(:disabled)") ?? button
      : button;
    target?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  };
  return <SharedErrorTrackingLab stage={stage} onStage={onStage} location={location} onFocusBooking={focusBooking} onFocusDetails={focusDetails} onBookNew={() => router.push("/")} onTriggerNoise={() => dispatch({ type: "capture", exception: { outcome: "dropped", type: "Error", value: "ResizeObserver loop completed with undelivered notifications.", handled: false, mechanism: "generic", frames: [] } })} />;
}
