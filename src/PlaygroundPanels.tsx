"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { labsOnOtherPages, type LabStartPage, type PlaygroundPage, type TouchpointId } from "./playground.js";

// Exact SVGs from @posthog/icons 0.36.6, as used by posthog.com.
const productIcons = {
  "Product Analytics": new URL("./assets/posthog-product-analytics.svg", import.meta.url).href,
  "AI Observability": new URL("./assets/posthog-ai-observability.svg", import.meta.url).href,
  "Error Tracking": new URL("./assets/posthog-error-tracking.svg", import.meta.url).href,
  "Session Replay": new URL("./assets/posthog-session-replay.svg", import.meta.url).href,
} as const;

export function LabDirectory({ page, choose, showMarker, onVisitLab }: {
  page: PlaygroundPage;
  choose: (id: TouchpointId) => void;
  showMarker: (id: TouchpointId) => void;
  onVisitLab?: (id: TouchpointId, startPage: LabStartPage) => void;
}) {
  const [query, setQuery] = useState("");
  const localLabs = page.touchpoints.filter((item) =>
    `${item.title} ${item.tool}`.toLowerCase().includes(query.toLowerCase())
  );
  const elsewhere = onVisitLab ? labsOnOtherPages(page) : [];
  const otherLabs = elsewhere.filter((item) =>
    `${item.title} ${item.tool} ${item.location}`.toLowerCase().includes(query.toLowerCase())
  );
  const otherProducts = Array.from(new Set(otherLabs.map((item) => item.tool))).map((tool) => ({
    tool,
    labs: otherLabs.filter((item) => item.tool === tool),
  }));
  const allLabCount = page.touchpoints.length + elsewhere.length;
  return (
      <section
        id="twig-playground-detail"
        className="vac-lab vac-lab-directory"
      >
        <h3>Choose a lab</h3>
        <p>Explore PostHog tools through interactions on this page.</p>
        {allLabCount > 7 && (
          <label className="vac-lab-search">
            Find a lab or PostHog tool
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
            />
          </label>
        )}
        {localLabs.length > 0 && <>
        <ol className="vac-lab-directory-list" aria-label="Labs on this page">
          {localLabs.map((item) => (
            <li key={item.id} data-lab-color={item.color}>
              <div className="vac-lab-card-heading">
                <span className="vac-marker">{item.number}</span>
                <span className="vac-eyebrow">{item.tool}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.lesson}</p>
              <div className="vac-lab-card-actions">
                <button
                  className="vac-text-button"
                  type="button"
                  onClick={() => showMarker(item.id)}
                  aria-label={`Show me where: ${item.title}`}
                >
                  Show me where
                </button>
                {!item.lab && (
                  <span className="vac-muted">Lab not built yet</span>
                )}
                <button
                  className="vac-button"
                  onClick={() => {
                    choose(item.id);
                    showMarker(item.id);
                  }}
                  aria-label={`${item.lab ? "Start lab" : "View details"}: ${
                    item.title
                  }`}
                >
                  <span className="vac-os-button-face">
                    {item.lab ? "Start lab →" : "View details"}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ol>
        </>}
        {otherLabs.length > 0 && <details className="vac-lab-other-pages">
        <summary>
          <span>Explore other PostHog products on Twig</span>
          <span className="vac-lab-menu-end" aria-hidden="true">
            <span className="vac-lab-menu-chevron" />
          </span>
        </summary>
        <nav className="vac-lab-other-pages-menu" aria-label="Labs on other Twig pages">
          {otherProducts.map((group) => <div className="vac-lab-menu-group" key={group.tool} data-product={group.tool.toLowerCase().replaceAll(" ", "-")}>
            <h4><img src={productIcons[group.tool]} className="vac-lab-product-icon" width={16} height={16} alt="" />{group.tool}</h4>
            <ul>
              {group.labs.map((item) => <li key={item.id}>
                <button type="button" onClick={() => onVisitLab?.(item.id, item.page)} aria-label={`Go to ${item.title} lab`}>
                  <span><strong>{item.title}</strong><small>{item.location}</small></span>
                </button>
              </li>)}
            </ul>
          </div>)}
        </nav>
        </details>}
        {!localLabs.length && !otherLabs.length && <p>{allLabCount ? "No labs match your search." : "No labs are available yet."}</p>}
      </section>
    );
}

export function SelectedLabHeader({ current }: { current: PlaygroundPage["touchpoints"][number] }) {
  return (
      <div className="vac-selected-lab">
        <span className="vac-eyebrow">{current.tool}</span>
        <span className="vac-lab-context">{current.title} Lab</span>
      </div>
  );
}

export function PlaygroundMarker({
  touchpoint,
  highlighted,
  onHighlight,
  onChoose,
}: {
  touchpoint: PlaygroundPage["touchpoints"][number];
  highlighted: boolean;
  onHighlight: (id: TouchpointId | null) => void;
  onChoose: (id: TouchpointId) => void;
}) {
  return (
    <button
      id={`twig-marker-${touchpoint.id}`}
      className="vac-marker"
      data-lab-color={touchpoint.color}
      data-highlighted={highlighted}
      onMouseEnter={() => onHighlight(touchpoint.id)}
      onMouseLeave={() => onHighlight(null)}
      onFocus={() => onHighlight(touchpoint.id)}
      onBlur={() => onHighlight(null)}
      type="button"
      onClick={() => onChoose(touchpoint.id)}
      aria-label={`Open lab: ${touchpoint.title}`}
      aria-controls="twig-playground-detail"
    >
      {touchpoint.number}
    </button>
  );
}

export function PlaygroundInvitation({
  dismissed,
  onDismiss,
  onOpen,
  toggleRef,
}: {
  dismissed: boolean;
  onDismiss: () => void;
  onOpen: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <aside
      className={`vac-playground-invite vac-developer-theme${dismissed ? " vac-invite-compact" : ""}`}
      aria-label="Explore PostHog"
      onKeyDown={(event) => {
        if (event.key === "Escape") onDismiss();
      }}
    >
      {!dismissed && (
        <>
          <button
            className="vac-invite-dismiss"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss playground invitation"
          >
            ×
          </button>
          <div className="vac-invite-brand">
            <img
              src={new URL("./assets/posthog-logomark.svg", import.meta.url).href}
              width={38}
              height={28}
              alt=""
            />
            <strong>PostHog Playground</strong>
          </div>
          <h2>Want to explore how PostHog works on this site?</h2>
          <p>Tinker with Twig&apos;s features and learn how to interpret product data.</p>
        </>
      )}
      <button
        ref={toggleRef}
        className="vac-button"
        type="button"
        aria-expanded={false}
        onClick={onOpen}
      >
        <span className="vac-os-button-face">
          {dismissed ? "Explore PostHog ↗" : "Open playground ↗"}
        </span>
      </button>
    </aside>
  );
}

export function PlaygroundDock({
  embedded,
  onClose,
  headingRef,
  logo,
  navigation,
  recordingBar,
  pageKey,
  guide,
}: {
  embedded: boolean;
  onClose: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  logo: ReactNode;
  navigation: ReactNode;
  recordingBar: ReactNode;
  pageKey: string;
  guide: ReactNode;
}) {
  return (
    <aside
      id="twig-playground"
      className="vac-dock vac-developer-theme"
      aria-label="Twig playground"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !embedded) onClose();
      }}
    >
      <div className="vac-dock-header">
        <div className="vac-row">
          <h2 id="twig-playground-heading" ref={headingRef} tabIndex={-1}>
            {logo}
            PostHog Playground
          </h2>
          {!embedded && (
            <button className="vac-text-button" onClick={onClose}>
              Hide
            </button>
          )}
        </div>
        {navigation}
        {recordingBar}
      </div>
      <div
        key={pageKey}
        className="vac-dock-scroll"
        role="region"
        aria-label="Instrumentation touchpoints and details"
        tabIndex={0}
      >
        {guide}
      </div>
    </aside>
  );
}
