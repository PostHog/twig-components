"use client";

import { useEffect, useRef, useState } from "react";
import type { eventWithTime } from "@rrweb/types";
import type { Replayer } from "@rrweb/replay";
import "@rrweb/replay/dist/style.css";

export function SessionPlayer({ events }: { events: eventWithTime[] }) {
  const container = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<Replayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("Loading recording…");
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let ticker: ReturnType<typeof setInterval> | undefined;
    let instance: Replayer | undefined;
    let onFullscreen: (() => void) | undefined;
    void import("@rrweb/replay")
      .then(({ Replayer }) => {
        if (disposed || !root.current || !viewport.current) return;
        instance = new Replayer(events, {
          root: root.current,
          mouseTail: false,
          showWarning: false,
          showDebug: false,
          // Preserve layout when hiding overlays so recorded pointer coordinates stay aligned.
          insertStyleRules: [
            ".vac-dock, .vac-playground-invite, .vac-replay-stop, .vac-ghost-cursor { visibility: hidden !important; }",
          ],
        });
        player.current = instance;
        const total = instance.getMetaData().totalTime;
        setDuration(total);
        setPosition(0);
        setPlaying(false);
        setStatus("");
        instance.pause(0);
        const resize = () => {
          if (!instance || !viewport.current) return;
          const iframe = instance.iframe;
          const width = Number(iframe.getAttribute("width")) || 1280;
          const height = Number(iframe.getAttribute("height")) || 800;
          const scale =
            document.fullscreenElement === container.current
              ? Math.min(
                  viewport.current.clientWidth / width,
                  Math.max(
                    80,
                    window.innerHeight -
                      (controls.current?.offsetHeight ?? 140) -
                      48
                  ) / height
                )
              : viewport.current.clientWidth / width;
          instance.wrapper.style.transformOrigin = "top left";
          instance.wrapper.style.transform = `scale(${scale})`;
          viewport.current.style.height = `${height * scale}px`;
        };
        onFullscreen = () => {
          setFullscreen(document.fullscreenElement === container.current);
          resize();
        };
        document.addEventListener("fullscreenchange", onFullscreen);
        instance.on("resize", resize);
        observer = new ResizeObserver(resize);
        observer.observe(viewport.current);
        if (controls.current) observer.observe(controls.current);
        resize();
        ticker = setInterval(() => {
          if (!instance) return;
          const time = Math.min(total, Math.max(0, instance.getCurrentTime()));
          setPosition(time);
          if (time >= total) setPlaying(false);
        }, 100);
      })
      .catch(() => {
        if (!disposed)
          setStatus(
            "Could not load this recording. Try recording a new visit."
          );
      });
    return () => {
      disposed = true;
      if (onFullscreen)
        document.removeEventListener("fullscreenchange", onFullscreen);
      observer?.disconnect();
      if (ticker) clearInterval(ticker);
      instance?.destroy();
      player.current = null;
    };
  }, [events]);
  return (
    <div ref={container} className="vac-session-player">
      {status && <p role="status">{status}</p>}
      <div ref={viewport} className="vac-session-viewport">
        <div ref={root} />
      </div>
      <div ref={controls} className="vac-session-controls">
        <label htmlFor="session-playhead">
          {(position / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s
        </label>
        <input
          id="session-playhead"
          aria-label="Replay position"
          type="range"
          min={0}
          max={duration || 1}
          step={100}
          value={position}
          disabled={!!status}
          onChange={(event) => {
            const time = Number(event.target.value);
            player.current?.pause(time);
            setPosition(time);
            setPlaying(false);
          }}
        />
        <button
          className="vac-button"
          disabled={!!status}
          onClick={() => {
            if (playing) {
              player.current?.pause();
              setPlaying(false);
            } else {
              player.current?.play(position >= duration ? 0 : position);
              setPlaying(true);
            }
          }}
        >
          <span className="vac-os-button-face">
            {playing
              ? "Pause"
              : position >= duration
              ? "Replay visit"
              : "Play visit"}
          </span>
        </button>
        <button
          className="vac-text-button"
          disabled={!!status}
          onClick={async () => {
            setFullscreenError("");
            try {
              if (document.fullscreenElement === container.current)
                await document.exitFullscreen();
              else await container.current?.requestFullscreen();
            } catch {
              setFullscreenError(
                "Full screen is unavailable. You can still play the recording here."
              );
            }
          }}
        >
          {fullscreen ? "Exit full screen" : "View full screen"}
        </button>
        {fullscreenError && <p role="status">{fullscreenError}</p>}
      </div>
    </div>
  );
}
