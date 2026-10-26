"use client";

import { useEffect } from "react";
import {
  BookingLab as SharedBookingLab,
  useBookingLab,
} from "../../BookingLab.js";

export { BookingLabProvider, useBookingLab } from "../../BookingLab.js";

export function BookingLab({
  stage,
  onStage,
}: {
  stage: number;
  onStage: (stage: number) => void;
}) {
  const { state } = useBookingLab();
  useEffect(() => {
    if (stage !== 1 || !state.applied) return;
    const scroller = document.querySelector(".vac-dock-scroll");
    if (scroller) scroller.scrollTop = 0;
  }, [stage, state.applied, state.latest]);
  const onFocusBooking = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("booking-title")?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "center",
    });
  };
  return <SharedBookingLab stage={stage} onStage={onStage} onFocusBooking={onFocusBooking} />;
}
