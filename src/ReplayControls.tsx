"use client";

import type { CSSProperties } from "react";
import { PlaygroundTooltip } from "./PlaygroundTooltip.js";

export function replayTime(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export type ReplayControlsProps = {
  position: number;
  duration: number;
  playing: boolean;
  disabled?: boolean;
  fullscreen?: boolean;
  fullscreenUnavailable?: boolean;
  onToggle: () => void;
  onSeek: (position: number) => void;
  onFullscreen: () => void;
};

/** Controlled transport: recording and playback remain separate interactions. */
export function ReplayControls({ position, duration, playing, disabled = false, fullscreen = false, fullscreenUnavailable = false, onToggle, onSeek, onFullscreen }: ReplayControlsProps) {
  const ended = duration > 0 && position >= duration;
  const action = playing ? "Pause" : ended ? "Replay" : "Play";
  const progress = duration > 0 ? Math.min(100, Math.max(0, position / duration * 100)) : 0;
  return <div className="vac-replay-transport"><div className="vac-replay-controls" role="group" aria-label="Replay controls">
    <PlaygroundTooltip label={action}>
      <button type="button" className="vac-replay-control" aria-label={action} disabled={disabled} onClick={onToggle}>
        <span className="vac-replay-icon" data-icon={action.toLowerCase()} aria-hidden="true" />
      </button>
    </PlaygroundTooltip>
    <span className="vac-replay-time">{disabled ? "–:–– / –:––" : `${replayTime(position)} / ${replayTime(duration)}`}</span>
    {/* The measured playback position is runtime data; all track styling lives in CSS. */}
    <input className="vac-replay-seek" aria-label="Replay position" aria-valuetext={`${replayTime(position)} of ${replayTime(duration)}`} type="range" min={0} max={duration || 1} step={1} value={Math.min(position, duration || 1)} disabled={disabled} style={{ "--replay-progress": `${progress}%` } as CSSProperties} onChange={event => onSeek(Number(event.target.value))} onKeyDown={event => {
      const targets: Record<string, number> = { Home: 0, End: duration, ArrowLeft: position - 1000, ArrowDown: position - 1000, ArrowRight: position + 1000, ArrowUp: position + 1000, PageDown: position - duration / 10, PageUp: position + duration / 10 };
      if (event.key in targets) { event.preventDefault(); onSeek(Math.round(Math.max(0, Math.min(duration, targets[event.key])))); }
    }} />
    <PlaygroundTooltip label={fullscreenUnavailable ? "Full screen unavailable" : fullscreen ? "Exit full screen" : "Full screen"}>
      <button type="button" className="vac-replay-control" aria-label={fullscreen ? "Exit full screen" : "Full screen"} disabled={disabled || fullscreenUnavailable} onClick={onFullscreen}>
        <span className="vac-replay-icon" data-icon="fullscreen" aria-hidden="true" />
      </button>
    </PlaygroundTooltip>
  </div></div>;
}

export function RecordingControls({ elapsedMs, onStop }: { elapsedMs: number; onStop: () => void }) {
  return <div className="vac-recording-controls" role="group" aria-label="Recording in progress">
    <PlaygroundTooltip label="Stop recording">
      <button type="button" className="vac-replay-control" aria-label="Stop recording" onClick={onStop}>
        <span className="vac-recording-stop-ring" aria-hidden="true"><span /></span>
      </button>
    </PlaygroundTooltip>
    <span className="vac-recording-time" aria-label={`Recording ${replayTime(elapsedMs)}`}>{replayTime(elapsedMs)}</span>
  </div>;
}
