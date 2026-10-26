import confetti from "canvas-confetti";

// Burst settings from posthog.com/src/components/PlatformInstall/confetti.ts.
export function celebrateCompletion(element: HTMLElement) {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "200000",
  });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const burst = confetti.create(canvas, { resize: true });
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  const base = {
    origin: {
      x: (rect.left + rect.width / 2) / innerWidth,
      y: (rect.top + rect.height / 2) / innerHeight,
    },
    disableForReducedMotion: true,
    colors: [
      "--ph-brand-cobalt",
      "--ph-brand-yellow",
      "--ph-brand-tangerine",
    ].map((token) => styles.getPropertyValue(token).trim()),
  };
  burst({
    ...base,
    angle: 76,
    particleCount: 72,
    spread: 92,
    startVelocity: 26,
    ticks: 260,
    gravity: 1.16,
  });
  burst({
    ...base,
    angle: 80,
    particleCount: 64,
    spread: 138,
    startVelocity: 22,
    ticks: 250,
    decay: 0.92,
    gravity: 1.1,
  });
  burst({
    ...base,
    angle: 78,
    particleCount: 98,
    spread: 198,
    startVelocity: 18,
    ticks: 240,
    scalar: 0.85,
    decay: 0.87,
    gravity: 1.1,
  });
  burst({
    ...base,
    angle: 78,
    particleCount: 48,
    spread: 220,
    startVelocity: 14,
    ticks: 220,
    scalar: 0.78,
    decay: 0.86,
    gravity: 1.08,
  });
  const timer = window.setTimeout(() => {
    burst.reset();
    canvas.remove();
  }, 6000);
  return () => {
    clearTimeout(timer);
    burst.reset();
    canvas.remove();
  };
}
