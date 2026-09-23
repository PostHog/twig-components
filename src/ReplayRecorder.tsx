"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { REPLAY_LIMIT, replayPage, searchValue, type ReplayFrame } from "./replay-lab.js";
import type { eventWithTime } from "@rrweb/types";

type Mode = "ghost" | "manual" | null;
type ReplayContextValue = {
  exercise: "ghost" | "manual";
  setExercise: (value: "ghost" | "manual") => void;
  recording: eventWithTime[];
  starting: boolean;
  frames: ReplayFrame[];
  mode: Mode;
  masked: boolean;
  setMasked: (value: boolean) => void;
  capturedMasked: boolean;
  message: string;
  start: (mode: Exclude<Mode, null>) => void;
  stop: () => void;
  clear: () => void;
  reset: () => void;
  resetCount: number;
};
const ReplayContext = createContext<ReplayContextValue>({
  exercise: "ghost",
  setExercise: () => {},
  recording: [],
  starting: false,
  frames: [],
  mode: null,
  masked: true,
  setMasked: () => {},
  capturedMasked: true,
  message: "",
  start: () => {},
  stop: () => {},
  clear: () => {},
  reset: () => {},
  resetCount: 0,
});
export const useReplay = () => useContext(ReplayContext);

export function ReplayProvider({
  children,
  open,
  pathname,
}: {
  children: ReactNode;
  open: boolean;
  pathname: string;
}) {
  const [exercise, setExercise] = useState<"ghost" | "manual">("ghost");
  const [resetCount, setResetCount] = useState(0);
  const [recording, setRecording] = useState<eventWithTime[]>([]);
  const [starting, setStarting] = useState(false);
  const captured = useRef<eventWithTime[]>([]);
  const stopRecorder = useRef<(() => void) | undefined>(undefined);
  const [frames, setFrames] = useState<ReplayFrame[]>([]);
  const [mode, setMode] = useState<Mode>(null);
  const [masked, setMasked] = useState(true);
  const [capturedMasked, setCapturedMasked] = useState(true);
  const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const session = useRef<{
    mode: Mode;
    start: number;
    masked: boolean;
    count: number;
  }>({ mode: null, start: 0, masked: true, count: 0 });
  const abort = useRef<AbortController | null>(null);
  const pageRef = useRef(pathname);
  function stop() {
    session.current.mode = null;
    abort.current?.abort();
    stopRecorder.current?.();
    stopRecorder.current = undefined;
    setRecording([...captured.current]);
    setStarting(false);
    setMode(null);
    setCursor(null);
  }
  function reset() {
    stop();
    captured.current = [];
    setRecording([]);
    setFrames([]);
    setMessage("");
    setExercise("ghost");
    setMasked(true);
    setCapturedMasked(true);
    setResetCount((value) => value + 1);
  }
  function add(frame: Omit<ReplayFrame, "at" | "page">) {
    const current = session.current;
    if (!current.mode) return;
    if (current.count >= REPLAY_LIMIT) {
      stop();
      setMessage("Recording limit reached. Your visit is ready to inspect.");
      return;
    }
    current.count++;
    setFrames((previous) => [
      ...previous,
      {
        ...frame,
        at: Math.round(performance.now() - current.start),
        page: pageRef.current,
      },
    ]);
  }
  useEffect(() => {
    pageRef.current = pathname;
    if (!replayPage(pathname)) stop();
    else
      add({
        kind: "page",
        label: pathname === "/" ? "Find a stay" : "Stay details",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Record route changes only.
  }, [pathname]);
  useEffect(() => {
    if (!open) stop();
  }, [open]);
  useEffect(() => {
    if (!mode) return;
    let lastMove = 0,
      lastScroll = 0;
    const scope = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest(".vac-content, .vac-header");
    const coords = (event: MouseEvent) => ({
      x: Math.round((event.clientX / window.innerWidth) * 100),
      y: Math.round((event.clientY / window.innerHeight) * 100),
    });
    const move = (event: PointerEvent) => {
      if (
        session.current.mode !== "manual" ||
        !scope(event.target) ||
        performance.now() - lastMove < 150
      )
        return;
      lastMove = performance.now();
      add({ kind: "move", label: "Pointer moved", ...coords(event) });
    };
    const click = (event: MouseEvent) => {
      if (!scope(event.target)) return;
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-replay-label]"
      );
      if (target) {
        const rect = target.getBoundingClientRect();
        add({
          kind: "click",
          label: target.dataset.replayLabel!.slice(0, 100),
          ...(event.detail
            ? coords(event)
            : {
                x: Math.round(
                  ((rect.left + rect.width / 2) / innerWidth) * 100
                ),
                y: Math.round(
                  ((rect.top + rect.height / 2) / innerHeight) * 100
                ),
              }),
        });
      }
    };
    const input = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.id === "stay-search"
      )
        add({
          kind: "input",
          label: "Search stays",
          value: searchValue(event.target.value, session.current.masked),
        });
    };
    const scroll = () => {
      if (performance.now() - lastScroll < 350) return;
      lastScroll = performance.now();
      add({ kind: "scroll", label: "Scrolled the page" });
    };
    const interrupt = (event: PointerEvent | KeyboardEvent) => {
      if (event.isTrusted && session.current.mode === "ghost") {
        stop();
        setMessage(
          "Ghost visit stopped because you took control. Inspect it or record your own visit."
        );
      }
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("click", click, true);
    document.addEventListener("input", input, true);
    window.addEventListener("scroll", scroll);
    document.addEventListener("pointerdown", interrupt, true);
    document.addEventListener("keydown", interrupt, true);
    const timeout = window.setTimeout(() => {
      stop();
      setMessage("Two-minute limit reached. Your visit is ready to inspect.");
    }, 120000);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("click", click, true);
      document.removeEventListener("input", input, true);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("pointerdown", interrupt, true);
      document.removeEventListener("keydown", interrupt, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Handlers read the current session ref.
  }, [mode]);
  useEffect(
    () => () => {
      session.current.mode = null;
      abort.current?.abort();
      stopRecorder.current?.();
    },
    []
  );
  async function ghost(signal: AbortSignal) {
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
          reject(new Error("stopped"));
          return;
        }
        const cancel = () => {
          clearTimeout(timer);
          reject(new Error("stopped"));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", cancel);
          resolve();
        }, ms);
        signal.addEventListener("abort", cancel, { once: true });
      });
    const target = async (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error("missing target");
      element.scrollIntoView({ block: "center", behavior: "instant" });
      await wait(300);
      const rect = element.getBoundingClientRect();
      const point = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setCursor(point);
      element.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: point.x,
          clientY: point.y,
        })
      );
      add({
        kind: "move",
        label: "Ghost pointer moved",
        x: Math.round((point.x / innerWidth) * 100),
        y: Math.round((point.y / innerHeight) * 100),
      });
      await wait(700);
      return element;
    };
    const click = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        })
      );
    };
    try {
      await wait(500);
      click(await target('[data-replay-label="Filter: Forest"]'));
      await wait(900);
      click(await target('[data-replay-label="Filter: Coast"]'));
      await wait(900);
      click(await target('[data-replay-label="Filter: All"]'));
      const input = (await target("#stay-search")) as HTMLInputElement;
      input.focus({ preventScroll: true });
      for (const value of ["A", "Ad", "Adi", "Adir", "Adiro", "Adiron"]) {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )!.set!.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(220);
      }
      await wait(900);
      click(await target('[data-replay-label="Open stay: stay-01"]'));
      await wait(1200);
      stop();
      setMessage(
        "Ghost visit complete. Inspect the sequence to see how it reached a stay."
      );
    } catch {
      if (!signal.aborted) {
        stop();
        setMessage(
          "The page changed before the ghost finished. You can inspect the captured portion or try again."
        );
      }
    }
  }
  async function start(next: Exclude<Mode, null>) {
    stop();
    if (!replayPage(pathname) || (next === "ghost" && pathname !== "/")) {
      setMessage("Return to Find a stay to run the ghost visit.");
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    setStarting(true);
    try {
      const { record } = await import("@rrweb/record");
      if (controller.signal.aborted) return;
      captured.current = [];
      setRecording([]);
      let bytes = 0;
      const cleanup = record({
        blockSelector:
          "#twig-playground, .vac-playground-invite, .vac-replay-stop, .vac-ghost-cursor, input:not(#stay-search), textarea, select",
        maskAllInputs: true,
        maskInputFn: (text, element) =>
          element.id === "stay-search" && !masked ? text : "[masked]",
        recordCanvas: false,
        collectFonts: true,
        sampling: { mousemove: 100, scroll: 200 },
        emit: (event) => {
          if (controller.signal.aborted) return;
          bytes += JSON.stringify(event).length;
          if (bytes > 8_000_000 || captured.current.length >= 3000) {
            queueMicrotask(() => {
              stop();
              setMessage(
                "Recording limit reached. Your visit is ready to inspect."
              );
            });
            return;
          }
          captured.current.push(event);
        },
      });
      if (!cleanup) throw new Error("Recorder unavailable");
      stopRecorder.current = cleanup;
      if (controller.signal.aborted) {
        cleanup();
        return;
      }
    } catch {
      setStarting(false);
      setMessage("Could not start the page recorder. Please try again.");
      return;
    }
    setStarting(false);
    session.current = {
      mode: next,
      start: performance.now(),
      masked,
      count: 0,
    };
    setFrames([]);
    setCapturedMasked(masked);
    setMessage("");
    setMode(next);
    add({
      kind: "page",
      label: pathname === "/" ? "Find a stay" : "Stay details",
    });
    const activeFilter = document.querySelector<HTMLElement>(
      '#stay-setting-filters [aria-pressed="true"]'
    );
    if (activeFilter?.dataset.replayLabel)
      add({ kind: "state", label: activeFilter.dataset.replayLabel });
    const search = document.querySelector<HTMLInputElement>("#stay-search");
    if (search?.value)
      add({
        kind: "input",
        label: "Initial search",
        value: searchValue(search.value, masked),
      });
    if (next === "ghost") void ghost(controller.signal);
  }
  return (
    <ReplayContext.Provider
      value={{
        exercise,
        setExercise,
        reset,
        resetCount,
        recording,
        starting,
        frames,
        mode,
        masked,
        setMasked,
        capturedMasked,
        message,
        start,
        stop,
        clear: () => {
          stop();
          captured.current = [];
          setRecording([]);
          setFrames([]);
          setMessage("");
        },
      }}
    >
      {children}
      {mode === "manual" && (
        <div className="vac-replay-stop">
          <strong>Recording your visit</strong>
          <span>Local only</span>
          <button type="button" onClick={stop}>
            End recording and review
          </button>
        </div>
      )}
      {cursor && (
        <div
          className="vac-ghost-cursor"
          style={{ left: cursor.x, top: cursor.y }}
          aria-hidden="true"
        >
          <svg width="24" height="30" viewBox="0 0 24 30">
            <path
              d="M2 2v23l6-6 5 9 4-2-5-9h9Z"
              fill="var(--ph-neutral-ink)"
              stroke="var(--ph-neutral-background)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span>Ghost visitor</span>
        </div>
      )}
    </ReplayContext.Provider>
  );
}
