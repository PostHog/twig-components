"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { AiSearchIcon, SendIcon } from "./TripPlanner.js";
import { CompactTwig } from "./Compact.js";
import { SavedStay } from "./SavedStay.js";
import { StayCardContent } from "./StayCard.js";
import { nightlyPrice, stayLabel, type Stay } from "./catalog.js";

export type CompactChatMessage = {
  id: string;
  speaker: "visitor" | "assistant";
  content: string;
  recommendation?: Stay;
  /** Catalog-backed reason from the same reply as the recommendation. */
  recommendationDescription?: string;
};

export type CompactAiChatProps = {
  title?: string;
  messages: readonly CompactChatMessage[];
  draft?: string;
  /** Show Twig’s existing typing status while the host prepares a reply. */
  pending?: boolean;
  /** Show a non-interactive composer for host-controlled conversation playback. */
  playback?: boolean;
  onDraftChange?: (value: string) => void;
  onSend?: (message: string) => void;
  /** The host supplies the catalog image, including its accessible description. */
  renderImage: (stay: Stay) => ReactNode;
  /** Optional local interaction. Without a callback, View stay is disabled. This component never opens a route itself. */
  onViewStay?: (stay: Stay) => void;
};

/** Fixed, compact Twig chat. The host owns messages, scripted replies, and evidence. */
export function CompactAiChat({ title = "AI trip planner", messages, draft = "", pending = false, playback = false, onDraftChange, onSend, renderImage, onViewStay }: CompactAiChatProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = field.current;
    if (!textarea) return;
    // Runtime height follows wrapping when the host's resizable figure changes width.
    const fit = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    let width = textarea.clientWidth;
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth !== width) {
        width = textarea.clientWidth;
        fit();
      }
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [draft, onSend]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!playback && draft.trim()) onSend?.(draft.trim());
  }
  return <section className="twig-compact twig-compact-chat twig-trip-planner" aria-label={title} data-playback={playback || undefined} data-draft-ready={playback && Boolean(draft) && !pending || undefined}>
    <header className="twig-compact-chat-header"><AiSearchIcon /><h2>{title}</h2></header>
    {messages.length > 0 && <div className="twig-compact-chat-log" role="log" aria-live="polite" aria-label="Conversation">
      {messages.map(message => <div key={message.id} className="twig-compact-chat-turn">
        {message.content && <p className="twig-compact-chat-message" data-speaker={message.speaker}>{message.content}</p>}
        {message.recommendation && <article className="twig-compact-chat-recommendation">
          <div className="twig-compact-chat-stay">
            <div className="twig-compact-chat-photo">{renderImage(message.recommendation)}</div>
            <div><h3>{stayLabel(message.recommendation)}</h3>
              <p>{message.recommendationDescription ?? `${message.recommendation.location} · Sleeps ${message.recommendation.capacity}`}</p>
              <strong>{nightlyPrice(message.recommendation)} USD / night</strong></div>
          </div>
          <button className="twig-compact-chat-view" type="button" disabled={!onViewStay} onClick={() => onViewStay?.(message.recommendation!)}>View stay →</button>
        </article>}
      </div>)}
      {pending && <div className="twig-trip-planner-status" role="status">Twig is typing…</div>}
    </div>}
    {(onSend || playback) && <form className="twig-compact-chat-form" onSubmit={submit}>
      <div className="twig-trip-planner-compose">
        <label className="vac-sr-only" htmlFor={id}>Message {title}</label>
        <textarea ref={field} id={id} value={draft} placeholder="Message Twig…" rows={2} readOnly={playback || !onDraftChange}
          onChange={event => onDraftChange?.(event.target.value)} />
        <button type="submit" aria-label="Send message" disabled={playback || !draft.trim()}><SendIcon /></button>
      </div>
    </form>}
  </section>;
}

/** Compact listing using Twig's existing catalog content and controlled bookmark. */
export function CompactRecommendedStay({ stay, image, saved, onSavedChange }: {
  stay: Stay; image: ReactNode; saved: boolean; onSavedChange: (saved: boolean) => void;
}) {
  return <CompactTwig><article className="twig-compact-stay">
    <StayCardContent stay={stay} image={<div className="vac-image">{image}</div>} compact />
    <span className="twig-compact-save"><SavedStay stayName={stayLabel(stay)} signedIn saved={saved} onSavedChange={onSavedChange} /></span>
  </article></CompactTwig>;
}
