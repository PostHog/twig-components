"use client";

import { TooltipBubble } from "./PlaygroundTooltip.js";

import { LessonNavigationProvider } from "./LabNavigation.js";
import { DisclosureIcon } from "./PlaygroundDisclosure.js";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { InspectorAiExample } from "./InspectorAiExample.js";
import { InstrumentationInspector, type InspectorValue, type InspectionGuide } from "./InstrumentationInspector.js";
import { initialInspectionSession, inspectionSessionReducer, selectedInspectionRecord, type InspectionSessionState, type InspectionSessionAction } from "./InspectorSession.js";
export { initialInspectionSession, type InspectionSessionState, type InspectionSessionAction } from "./InspectorSession.js";
import { LabChecklist } from "./LabChecklist.js";
import { labsOnOtherPages, labsForProduct, touchpointDefinitions, type LabStartPage, type PlaygroundPage, type TouchpointId } from "./playground.js";

// Exact SVGs from @posthog/icons 0.36.6, as used by posthog.com.
const productIcons = {
  "Product Analytics": new URL("./assets/posthog-product-analytics.svg", import.meta.url).href,
  "AI Observability": new URL("./assets/posthog-ai-observability.svg", import.meta.url).href,
  "Error Tracking": new URL("./assets/posthog-error-tracking.svg", import.meta.url).href,
  "Session Replay": new URL("./assets/posthog-session-replay.svg", import.meta.url).href,
} as const;

function InspectorCursorIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height={size} aria-hidden="true"><path d="M3 4.75C3 3.784 3.784 3 4.75 3h14.5c.966 0 1.75.784 1.75 1.75v6a.75.75 0 0 1-1.5 0v-6a.25.25 0 0 0-.25-.25H4.75a.25.25 0 0 0-.25.25v14.5c0 .138.112.25.25.25h6a.75.75 0 0 1 0 1.5h-6A1.75 1.75 0 0 1 3 19.25V4.75Z"></path><path d="M12.374 11.143a1 1 0 0 0-1.23 1.23l2.48 9.019c.233.844 1.361 1.003 1.818.256l2.355-3.852 3.852-2.355c.747-.457.588-1.585-.256-1.817l-9.02-2.48Z"></path></svg>;
}

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
            <DisclosureIcon />
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

/** First-visit orientation. Hosts own navigation and analytics. */
export function PlaygroundHome({ onInspect, onStart, onSelect, onVisitLab }: {
  onInspect: () => void;
  onStart?: () => void;
  onSelect?: (id: TouchpointId) => void;
  onVisitLab?: (id: TouchpointId, page: LabStartPage) => void;
}) {
  const products = ["catalog", "discovery", "replay", "errors"] as const;
  return <section className="vac-lab vac-playground-home" aria-label="Playground Home">
    <h3>Meet Twig</h3>
    <p>Twig is a demo vacation rental site. The PostHog Playground reveals the PostHog events and code behind it.</p>
    <div className="vac-home-panel">
      <button type="button" className="vac-home-tour" onClick={onStart ?? onInspect}>
        <strong>Take a tour</strong>
        <span aria-hidden="true">→</span>
      </button>
    </div>
    <div className="vac-home-panel">
      <button type="button" className="vac-home-explore" onClick={onInspect}>
        <strong>Explore on your own</strong>
        <span aria-hidden="true">→</span>
      </button>
    </div>
    <section className="vac-home-panel vac-home-labs" aria-label="Learn with labs">
      <div className="vac-home-panel-intro">
        <h4>Learn with labs</h4>
        <p>Go deeper with guided, hands-on lessons for each PostHog product.</p>
      </div>
      <nav aria-label="Playground labs">
      {products.map(id => {
        const product = touchpointDefinitions[id].tool;
        return <details className="vac-lab-other-pages" key={id}>
          <summary aria-label={`${product} labs`}>
            <span className="vac-lab-menu-end"><img src={productIcons[product]} className="vac-lab-product-icon" width={16} height={16} alt="" />{product} labs</span>
            <span className="vac-lab-menu-end" aria-hidden="true"><DisclosureIcon /></span>
          </summary>
          <div className="vac-lab-other-pages-menu"><div className="vac-lab-menu-group"><ul>
            {labsForProduct(id).map(lab => <li key={lab.id}><button type="button" aria-label={`Start lab: ${lab.title}`} onClick={() => onVisitLab ? onVisitLab(lab.id, lab.page) : onSelect?.(lab.id)}>{lab.title}</button></li>)}
          </ul></div></div>
        </details>;
      })}
      </nav>
    </section>
  </section>;
}

/** A compact tour inside the live Inspector; the newest event remains selected automatically. */
export function PlaygroundOnboarding({ phase }: {
  phase: "stay" | "filter" | "another-stay" | "history" | "compare" | "compare-again" | "follow" | "reset" | "complete";
}) {
  return <section aria-label="Guided tour">
    {phase === "stay" ? <LabChecklist label="Your first interaction" items={[{ label: <>Open a <strong>stay</strong> on Twig.</>, done: false }]} />
      : phase === "filter" ? <LabChecklist label="Build your event history" items={[{ label: <>Go <strong>Back</strong> to Browse stays, then choose a <strong>setting</strong> in <strong>Filters</strong>.</>, done: false }]} />
      : phase === "another-stay" ? <LabChecklist label="Build your event history" items={[{ label: <>Open a stay from the <strong>filtered results</strong>.</>, done: false }]} />
      : phase === "history" ? <><p>The latest event’s details are already shown below.</p><LabChecklist label="Explore your event history" items={[{ label: <>Select earlier entries in the <strong>console</strong> to compare their details and tracking code.</>, done: false }]} /></>
      : phase === "compare" || phase === "compare-again" ? <LabChecklist label="Explore your event history" items={[{ label: <>Keep selecting entries to compare their event details.</>, done: false }]} />
      : phase === "follow" ? <LabChecklist label="Resume live tracking" items={[{ label: <>Click the <strong>play button</strong> in the console to resume live tracking.</>, done: false }]} />
      : phase === "reset" ? <LabChecklist label="Reset the console" items={[{ label: <>Click the <strong>reset icon</strong> to reset the console.</>, done: false }]} />
      : <LabChecklist label="Inspect new events" items={[{ label: <>Click around the site a few times to inspect <strong>new events</strong>.</>, done: false }]} />}
  </section>;
}

/** One product landing page, using the established directory cards and start controls. */
export function ProductLabLanding({ selectedId, choose }: {
  selectedId: TouchpointId;
  choose: (id: TouchpointId, page: LabStartPage) => void;
}) {
  const product = touchpointDefinitions[selectedId].tool;
  return <section id="twig-playground-detail" className="vac-lab vac-lab-directory" aria-label={`${product} labs`}>
    <h3>{product} labs</h3>
    <ol className="vac-lab-directory-list" aria-label={`${product} labs`}>
      {labsForProduct(selectedId).map(lab => <li key={lab.id} data-lab-color={lab.color}>
        <h4>{lab.title}</h4>
        <p>{lab.lesson}</p>
        <div className="vac-lab-card-actions"><button type="button" className="vac-button" aria-label={`Start lab: ${lab.title}`} onClick={() => choose(lab.id, lab.page)}><span className="vac-os-button-face">Start lab →</span></button></div>
      </li>)}
    </ol>
  </section>;
}

export function SelectedLabHeader({ current }: { current: PlaygroundPage["touchpoints"][number] }) {
  return (
      <div className="vac-selected-lab">
        <span className="vac-eyebrow">{current.tool}</span>
        <span className="vac-lab-context">{current.title} Lab</span>
      </div>
  );
}

const instrumentationSummaries: Record<TouchpointId, ReactNode> = {
  evaluations: <>The support agent records a policy lookup and generation. Offline and online evals attach scores to that answer.</>,
  catalog: <>Filter changes call <code>trackTwigEvent</code> with <code>twig_stay_filter_selected</code>, the setting, and the matching-stay count.</>,
  discovery: <>The AI lab links model inputs and outputs using <code>$ai_trace_id</code> on <code>$ai_generation</code> records.</>,
  replay: <>The <code>rrweb</code> recorder captures clicks, navigation, and input changes with input masking.</>,
  stay: <>Opening a stay records <code>twig_stay_viewed</code> with its <code>stay_id</code>.</>,
  booking: <>The booking flow records <code>twig_demo_booking_saved</code> after confirmation.</>,
  errors: <>Trip-detail failures call <code>posthog.captureException</code> with the page surface and stay ID.</>,
};

/** Contextual product help. Only viewport measurements are calculated inline. */
export function PlaygroundInstrumentationTooltip({ touchpoint, anchor, id, onPointerEnter, onPointerLeave }: {
  touchpoint: Pick<PlaygroundPage["touchpoints"][number], "id" | "tool">;
  anchor: Element;
  id?: string;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const tooltipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Local coordination only: show one instrumentation explanation at a time.
    window.dispatchEvent(new CustomEvent("twig-instrumentation-tooltip-opened", { detail: tooltipId }));
  }, [tooltipId]);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    function place() {
      if (!tooltipRef.current) return;
      const rect = anchor.getBoundingClientRect();
      const box = tooltipRef.current.getBoundingClientRect();
      const gap = 8;
      const maxTop = Math.max(gap, window.innerHeight - box.height - gap);
      const top = rect.top - box.height - gap;
      setPosition({
        left: Math.max(gap, Math.min(rect.left, window.innerWidth - box.width - gap)),
        top: Math.max(gap, Math.min(top >= gap ? top : rect.bottom + gap, maxTop)),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const observer = new ResizeObserver(place);
    if (tooltipRef.current) observer.observe(tooltipRef.current);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); observer.disconnect(); };
  }, [anchor]);
  const root = anchor.closest(".vac-app");
  if (!root) return null;
  return createPortal(<div ref={tooltipRef} id={tooltipId} role="tooltip"
    className="vac-instrumentation-tooltip vac-developer-theme" data-positioned={Boolean(position)}
    // Runtime viewport coordinates keep the tooltip beside its target and inside narrow screens.
    style={position ?? undefined} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
    <strong className="vac-instrumentation-product"><img src={productIcons[touchpoint.tool]} width={18} height={18} alt="" />{touchpoint.tool}</strong>
    <p>{instrumentationSummaries[touchpoint.id]}</p>
    <span className="vac-instrumentation-instruction">Click marker to open lab <span aria-hidden="true">→</span></span>
  </div>, root);
}

export function PlaygroundMarker({ touchpoint, highlighted, onHighlight, onChoose }: {
  touchpoint: PlaygroundPage["touchpoints"][number];
  highlighted: boolean;
  onHighlight: (id: TouchpointId | null) => void;
  onChoose: (id: TouchpointId) => void;
}) {
  const markerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [show, setShow] = useState(false);
  const tooltipId = useId();
  const reveal = () => { clearTimeout(timer.current); setShow(true); onHighlight(touchpoint.id); };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { if (document.activeElement !== markerRef.current) { setShow(false); onHighlight(null); } }, 120); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!show) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); clearTimeout(timer.current); setShow(false); onHighlight(null); }
    };
    const replace = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== tooltipId) { clearTimeout(timer.current); setShow(false); }
    };
    window.addEventListener("keydown", dismiss, true);
    window.addEventListener("twig-instrumentation-tooltip-opened", replace);
    return () => { window.removeEventListener("keydown", dismiss, true); window.removeEventListener("twig-instrumentation-tooltip-opened", replace); };
  }, [show, onHighlight, tooltipId]);
  return <>
    <button ref={markerRef} id={`twig-marker-${touchpoint.id}`} className="vac-marker"
      data-lab-color={touchpoint.color} data-highlighted={highlighted}
      onMouseEnter={reveal} onMouseLeave={hide} onFocus={reveal} onBlur={hide}
      type="button" onClick={() => { clearTimeout(timer.current); setShow(false); onChoose(touchpoint.id); }}
      aria-label={`Open lab: ${touchpoint.title}`} aria-controls="twig-playground-detail"
      aria-describedby={show ? tooltipId : undefined}>{touchpoint.number}</button>
    {show && markerRef.current && <PlaygroundInstrumentationTooltip touchpoint={touchpoint} anchor={markerRef.current} id={tooltipId} onPointerEnter={reveal} onPointerLeave={hide} />}
  </>;
}

export function PlaygroundInvitation({
  dismissed,
  onDismiss,
  onOpen,
  toggleRef,
  resumeLab,
}: {
  dismissed: boolean;
  onDismiss: () => void;
  onOpen: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  resumeLab?: string;
}) {
  return (
    <aside
      className={`vac-playground-invite vac-developer-theme${dismissed ? " vac-invite-compact" : ""}`}
      aria-label={resumeLab ? `Resume ${resumeLab} lab` : "Explore PostHog"}
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
          {resumeLab ? `Resume ${resumeLab} lab →` : dismissed ? "Explore PostHog ↗" : "Open playground ↗"}
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
  footer,
  pageKey,
  guide,
  placement = "inline",
  open = true,
  joinedBranding = false,
}: {
  embedded: boolean;
  onClose: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  logo: ReactNode;
  navigation: ReactNode;
  recordingBar: ReactNode;
  footer?: ReactNode;
  pageKey: string;
  guide: ReactNode;
  placement?: "inline" | "edge";
  open?: boolean;
  joinedBranding?: boolean;
}) {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) { setPresent(true); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPresent(false); return; }
    // Match the shared edge transition; cancel this removal if opening reverses it.
    const timeout = window.setTimeout(() => setPresent(false), 240);
    return () => window.clearTimeout(timeout);
  }, [open]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (placement !== "edge" || !open || !headerRef.current || !scrollRef.current) return;
    const header = headerRef.current, scroll = scrollRef.current;
    // Runtime header height keeps focused content clear of sticky navigation/recording controls.
    const measure = () => scroll.style.setProperty("--ph-dock-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => { observer.disconnect(); scroll.style.removeProperty("--ph-dock-header-height"); };
  }, [placement, open]);

  const previousPage = useRef(pageKey);
  useEffect(() => {
    if (previousPage.current !== pageKey) scrollRef.current?.scrollTo({ top: 0 });
    previousPage.current = pageKey;
  }, [pageKey]);
  const header = (<div ref={headerRef} className="vac-dock-header">
        <div className="vac-row">
          <h2 id="twig-playground-heading" ref={headingRef} tabIndex={-1}>
            {joinedBranding && placement === "edge" ? null : logo}
            PostHog Playground
          </h2>
          {!embedded && placement !== "edge" && (
            <button className="vac-text-button" aria-label="Hide" title="Collapse Playground" onClick={onClose}>
              Hide
            </button>
          )}
        </div>
        {navigation}
        {recordingBar}
      </div>);
  if (!present && !open) return null;
  return (
    <LessonNavigationProvider active={Boolean(footer)}><aside
      id="twig-playground"
      data-open={open}
      aria-hidden={!open || undefined}
      inert={!open}
      className={`vac-dock vac-developer-theme${placement === "edge" ? " vac-edge-inspector" : ""}${joinedBranding ? " vac-joined-branding" : ""}${footer ? " vac-lesson-shell" : ""}`}
      aria-label="Twig playground"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !embedded) onClose();
      }}
    >
      {placement !== "edge" && header}
      <div
        ref={scrollRef}
        className="vac-dock-scroll"
        role="region"
        aria-label="Instrumentation touchpoints and details"
        tabIndex={0}
      >
        {placement === "edge" ? <>{header}<div className="vac-dock-content">{guide}</div></> : guide}
      </div>
      {footer}
    </aside></LessonNavigationProvider>
  );
}


export type { InspectionGuide, InspectionSource } from "./InstrumentationInspector.js";

export type PlaygroundActivity = { id: number; operationId?: string; kind: TouchpointId; label: string; detail: string; event?: string; timestamp?: string; properties?: Record<string, InspectorValue>; element?: string };

/** Compact terminal controls share accessible hover/focus tooltips. */
function ConsoleControl({ label, disabled, onClick, children, surface = false }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode; surface?: boolean }) {
  const tipId = useId();
  const [visible, setVisible] = useState(false);
  return <span className="vac-inspector-control-anchor" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
    <button type="button" className="vac-inspector-control" data-surface={surface || undefined} aria-label={label} aria-describedby={visible ? tipId : undefined} disabled={disabled} onClick={onClick} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)} onKeyDown={event => { if (event.key === "Escape" && visible) { event.preventDefault(); event.stopPropagation(); setVisible(false); } }}>{children}</button>
    {visible && <TooltipBubble role="tooltip" id={tipId} className="vac-inspector-control-tooltip">{label}</TooltipBubble>}
  </span>;
}

/** Persistent tools rail. Hosts own picking, placement, and analytics. */
export function PlaygroundToolRail({ open, picking, selectedId, page, onOpen, onCollapse, onPick, onSelect, toggleRef, pickerRef, onHomeOpened, homeOpen, onHelpOpened, helpOpen = false, joinedBranding = false }: {
  joinedBranding?: boolean;
  homeOpen?: boolean;
  onHomeOpened?: () => void;
  /** @deprecated Use homeOpen. */
  helpOpen?: boolean;
  /** @deprecated Use onHomeOpened. */
  onHelpOpened?: (trigger: "hover" | "focus" | "click") => void;
  open: boolean; picking: boolean; selectedId?: TouchpointId | null; page: PlaygroundPage;
  onOpen: () => void; onCollapse: () => void; onPick: () => void; onSelect: (id: TouchpointId) => void;
  toggleRef: RefObject<HTMLButtonElement | null>; pickerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const tipId = useId();
  const [tipsDismissed, setTipsDismissed] = useState(false);
  useEffect(() => {
    function dismissTips(event: KeyboardEvent) { if (event.key === "Escape") setTipsDismissed(true); }
    window.addEventListener("keydown", dismissTips);
    return () => window.removeEventListener("keydown", dismissTips);
  }, []);
  const tools = [
    { tool: "Product Analytics", id: page.kind === "stay" ? "stay" : "catalog" },
    { tool: "AI Observability", id: "discovery" },
    { tool: "Session Replay", id: "replay" },
    { tool: "Error Tracking", id: "errors" },
  ] as const;
  const homeActive = homeOpen ?? helpOpen;
  const selectedTool = selectedId ? touchpointDefinitions[selectedId].tool : null;
  return <aside className={`vac-tool-rail vac-developer-theme${joinedBranding ? " vac-joined-branding" : ""}`} data-open={open} data-tips-dismissed={tipsDismissed}
    onPointerLeave={() => setTipsDismissed(false)} onFocusCapture={() => setTipsDismissed(false)}
    onPointerOver={event => {
      const tool = (event.target as Element).closest("button");
      const previous = event.relatedTarget instanceof Element ? event.relatedTarget.closest("button") : null;
      if (tool && tool !== previous) setTipsDismissed(false);
    }}
    aria-label="PostHog website tools">
    <div className="vac-tool-rail-logo">
      <button type="button" aria-label="Playground Home" aria-describedby={`${tipId}-home`} aria-pressed={open && homeActive} aria-controls="twig-playground" onClick={() => { if (onHomeOpened) onHomeOpened(); else onHelpOpened?.("click"); }}>
        <img src={new URL("./assets/posthog-logomark.svg", import.meta.url).href} width={28} height={24} alt="" />
        <TooltipBubble id={`${tipId}-home`} role="tooltip" className="vac-tool-tip">Home</TooltipBubble>
      </button>
    </div>
    <div className="vac-tool-rail-group" role="group" aria-label="Inspection tools">
      <button ref={pickerRef} type="button" aria-label="Inspect an element" aria-describedby={`${tipId}-inspect`} aria-pressed={open && !homeActive && picking} onClick={open && !homeActive && picking ? onCollapse : onPick}>
        {/* Exact IconCursorBox from @posthog/icons, matching the existing product asset source. */}
        <InspectorCursorIcon /><TooltipBubble id={`${tipId}-inspect`} role="tooltip" className="vac-tool-tip">Inspect Twig</TooltipBubble>
      </button>
      {tools.map(item => <button key={item.tool} type="button" aria-label={`Open ${item.tool} labs`} aria-describedby={`${tipId}-${item.id}`} aria-pressed={open && !homeActive && !picking && selectedTool === item.tool} onClick={() => { if (open && !homeActive && !picking && selectedTool === item.tool) onCollapse(); else onSelect(item.id); }}>
        <img src={productIcons[item.tool]} width={22} height={22} alt="" /><TooltipBubble id={`${tipId}-${item.id}`} role="tooltip" className="vac-tool-tip">{item.tool} labs</TooltipBubble>
      </button>)}
    </div>
    <div className="vac-tool-rail-footer">
    <button ref={toggleRef} className="vac-tool-rail-toggle" type="button" aria-label={open ? "Collapse Playground" : "Expand Playground"} aria-expanded={open} aria-describedby={`${tipId}-toggle`} aria-controls="twig-playground" onClick={open ? onCollapse : onOpen}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={open ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} /></svg><TooltipBubble id={`${tipId}-toggle`} role="tooltip" className="vac-tool-tip">{open ? "Collapse" : "Expand"}</TooltipBubble>
    </button>
    </div>
  </aside>;
}

/** Toolbar orientation uses the same shared panel typography as product landings. */
export function PlaygroundHelp() {
  return <section className="vac-lab" aria-label="Using the toolbar">
    <h3>Using the toolbar</h3>
    <p>Explore how PostHog works on Twig, then try it yourself in an interactive lab.</p>
    <h4>Inspect Twig</h4>
    <p>Open Inspect and use the site. The console records your interactions. Select any earlier event to see its instrumentation code and data.</p>
    <h4>Explore a lab</h4>
    <p>Choose a product icon to browse its labs. Each lab guides you through an exercise on Twig, step by step.</p>
    <h4>Follow the markers</h4>
    <p>Colored circles mark instrumented features. Hover over a marker to see how it is tracked, or click it to open its lab.</p>
    <p>Click the active toolbar icon again to close the panel. Switching tools keeps your current lab progress.</p>
  </section>;
}

export function PlaygroundPickerHint({ label, onCancel }: { label?: string; onCancel: () => void }) {
  return <div className="vac-picker-hint vac-developer-theme" role="status"><span>{label ?? "Select a feature on Twig. Tab to move, Enter to inspect."}</span><button type="button" onClick={onCancel}>Cancel <kbd>Esc</kbd></button></div>;
}

/** Right-edge tool tab. Hosts own placement and analytics. */
export function PlaygroundLauncher({ onOpen, toggleRef, resumeLab }: {
  onOpen: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  resumeLab?: string;
}) {
  return <aside className="vac-inspect-launcher vac-developer-theme" aria-label="PostHog Playground">
    <button ref={toggleRef} type="button" className="vac-button" aria-label={resumeLab ? `Resume ${resumeLab} in PostHog Playground` : "Open PostHog Playground"} title={resumeLab ? `Resume ${resumeLab}` : "Inspect Twig"} aria-expanded={false} aria-controls="twig-playground" onClick={onOpen}>
      <span className="vac-os-button-face">
        <img src={new URL("./assets/posthog-logomark.svg", import.meta.url).href} width={28} height={22} alt="" />
        <strong>Playground</strong>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m14 6-6 6 6 6M4 4v16" /></svg>
      </span>
    </button>
  </aside>;
}

/** A local interaction preview, separate from the guided labs' captured events. */
export function PlaygroundExplorer({ page, activity, choose, showMarker, onInspect, onVisitLab, selectedId }: {
  selectedId?: TouchpointId | null;
  page: PlaygroundPage;
  activity: readonly PlaygroundActivity[];
  choose: (id: TouchpointId) => void;
  showMarker: (id: TouchpointId) => void;
  onInspect?: (id: TouchpointId) => void;
  onVisitLab?: (id: TouchpointId, startPage: LabStartPage) => void;
}) {
  const [selected, setSelected] = useState<TouchpointId>(page.touchpoints.some(point => point.id === "catalog") ? "catalog" : page.touchpoints[0]?.id ?? "catalog");
  const current = page.touchpoints.find(point => point.id === (selectedId ?? selected)) ?? page.touchpoints[0];
  const otherLabs = labsOnOtherPages(page);
  const products = Array.from(new Set(otherLabs.map(lab => lab.tool)));
  const instruction = current?.id === "catalog" ? "Open Filters and choose a setting on Twig."
    : current?.id === "discovery" ? "Send a message through AI trip planner on Twig."
    : current?.id === "stay" ? "Open another stay on Twig."
    : current?.id === "replay" ? "Interact with Twig, then start the lab to record a visit."
    : "Start the lab to explore this interaction on Twig.";
  return <section id="twig-playground-detail" className="vac-lab vac-inspect-explorer">
    <h3>Inspect Twig</h3>
    <p>Use the site. See what happens behind the scenes.</p>
    {current && <>
      <div className="vac-inspect-options" role="group" aria-label="Features to inspect">
        {page.touchpoints.map(point => <button key={point.id} type="button" data-lab-color={point.color} aria-pressed={point.id === current.id} aria-label={`Inspect ${point.title}`} onClick={() => { setSelected(point.id); onInspect?.(point.id); }}>
          <span className="vac-inspect-product"><img src={productIcons[point.tool]} width={20} height={20} alt="" /></span>
          <span><strong>{point.title}</strong><small>{point.tool}</small></span>
          <span aria-hidden="true">→</span>
        </button>)}
      </div>
      <div className="vac-inspect-focus">
        <LabChecklist label="Try it on Twig" items={[{ label: instruction, done: current.id === "replay" ? activity.length > 0 : activity.some(item => item.kind === current.id) }]} />
        <button className="vac-text-button" type="button" onClick={() => showMarker(current.id)} aria-label={`Show me where: ${current.title}`}>Show me where ↗</button>
      </div>
    </>}
    <div className="vac-inspect-activity" role="region" aria-label="Local interaction preview">
      <div className="vac-inspect-activity-header"><strong>Activity on Twig</strong><span>{activity.length ? `${activity.length} recent ${activity.length === 1 ? "action" : "actions"}` : "Ready"}</span></div>
      <ol aria-live="polite" aria-relevant="additions">
        {activity.length ? activity.map(item => <li key={item.id}><span aria-hidden="true">↳</span><span><strong>{item.label}</strong><code>{item.detail}</code></span></li>) : <li className="vac-inspect-empty">Your interactions will appear here.</li>}
      </ol>
      <p>Local preview. Guided labs teach you what to capture.</p>
    </div>
    {current && <div className="vac-inspect-next">
      <p>{current.lesson}</p>
      <button type="button" className="vac-button" aria-label={`Start lab: ${current.title}`} onClick={() => { choose(current.id); showMarker(current.id); }}><span className="vac-os-button-face">Start lab →</span></button>
    </div>}
    {onVisitLab && otherLabs.length > 0 && <details className="vac-lab-other-pages">
      <summary><span>{current ? "Labs on other pages" : "Explore the labs"}</span><span className="vac-lab-menu-end" aria-hidden="true"><DisclosureIcon /></span></summary>
      <nav className="vac-lab-other-pages-menu" aria-label="Labs on other Twig pages">
        {products.map(tool => <div className="vac-lab-menu-group" key={tool} data-product={tool.toLowerCase().replaceAll(" ", "-")}>
          <h4><img src={productIcons[tool]} className="vac-lab-product-icon" width={16} height={16} alt="" />{tool}</h4>
          <ul>{otherLabs.filter(item => item.tool === tool).map(item => <li key={item.id}><button type="button" aria-label={`Go to ${item.title} lab`} onClick={() => onVisitLab(item.id, item.page)}><span><strong>{item.title}</strong><small>{item.location}</small></span></button></li>)}</ul>
        </div>)}
      </nav>
    </details>}
  </section>;
}


/** Live local instrumentation, intentionally separate from the guided lesson directory. */
export function PlaygroundInspectionView({ activity, selectedId, onSelect, describe, contexts, session, onSessionChange, showIntroduction = true, guidance, onExitTour }: {
  onExitTour?: () => void;
  guidance?: ReactNode;
  showIntroduction?: boolean;
  describe?: (activity: PlaygroundActivity) => InspectionGuide | undefined;
  contexts?: Partial<Record<TouchpointId, InspectionGuide>>;
  activity: readonly PlaygroundActivity[];
  selectedId?: TouchpointId | null;
  onSelect: (id: TouchpointId) => void;
  choose?: (id: TouchpointId) => void;
  session?: InspectionSessionState;
  onSessionChange?: (state: InspectionSessionState, action: InspectionSessionAction) => void;
}) {
  const [localSession, setLocalSession] = useState(initialInspectionSession);
  const state = session ?? localSession;
  const change = (action: InspectionSessionAction) => {
    const next = inspectionSessionReducer(state, action);
    setLocalSession(next);
    onSessionChange?.(next, action);
  };
  const [exampleFor, setExampleFor] = useState<number | string | null>(null);
  const selectedEvent = selectedInspectionRecord(activity, state);
  const guide = selectedEvent ? describe?.(selectedEvent) : !state.consoleAfterId && selectedId === "replay" ? contexts?.replay : undefined;
  const selectedPreview = selectedEvent ? consolePreview(selectedEvent) : undefined;
  const hasDetails = Boolean(guide || selectedEvent?.element || Object.keys(selectedPreview?.additionalProperties ?? {}).length);
  const evidenceKey = selectedEvent?.id ?? selectedId ?? "empty";
  const showExample = guide?.aiExample && exampleFor === evidenceKey;
  const consoleRecords = activity.filter(item => item.id > state.consoleAfterId);
  const records = consoleRecords;
  const streamRef = useRef<HTMLOListElement>(null);
  const latestConsoleId = consoleRecords.at(-1)?.id;
  useEffect(() => {
    if (state.followLatest && streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [state.followLatest, latestConsoleId]);
  function select(item: PlaygroundActivity) {
    setExampleFor(null);
    change({ type: "select", id: item.id });
    onSelect(item.kind);
  }
  return <section id="twig-playground-detail" className="vac-lab vac-inspector" aria-label={onExitTour ? "Tour" : "Inspector"}>
    {showIntroduction && <><div className="vac-inspector-heading">
      <h3 tabIndex={-1} className="vac-inspector-title">{onExitTour ? "Tour" : "Inspector"}</h3>
      {onExitTour && <ConsoleControl label="Exit tour" disabled={false} surface onClick={onExitTour}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </ConsoleControl>}
    </div>
    {!guidance && <p className="vac-inspector-introduction">Interact with Twig to explore its PostHog instrumentation.</p>}</>}
    {guidance}
    <div className="vac-inspector-stream-browser">
      <div className="vac-inspector-stream-controls" role="group" aria-label="Console controls">
        <ConsoleControl label="Track live events" disabled={state.followLatest || !consoleRecords.length} onClick={() => { change({type:"follow"}); setExampleFor(null); const latest=consoleRecords.at(-1); if(latest) onSelect(latest.kind); }}>
          <span className="vac-replay-icon" data-icon="play" aria-hidden="true" />
        </ConsoleControl>
        <ConsoleControl label="Clear console" disabled={!consoleRecords.length} onClick={() => { change({type:"clear",latestId:activity.at(-1)?.id ?? 0}); setExampleFor(null); }}><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.75 3C5.16421 3 5.5 3.33579 5.5 3.75V5.71122C7.1554 4.03743 9.4791 3 12 3C16.9706 3 21 7.02944 21 12C21 12.3803 20.9764 12.7555 20.9304 13.1241C20.8792 13.5351 20.5044 13.8267 20.0934 13.7755C19.6823 13.7242 19.3907 13.3495 19.4419 12.9384C19.4802 12.6313 19.5 12.3181 19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C9.77612 4.5 7.73561 5.46681 6.3448 7H8.75C9.16421 7 9.5 7.33579 9.5 7.75C9.5 8.16421 9.16421 8.5 8.75 8.5H5.25C4.55964 8.5 4 7.94036 4 7.25V3.75C4 3.33579 4.33579 3 4.75 3ZM3.90663 10.2245C4.31766 10.2758 4.60932 10.6505 4.55806 11.0616C4.51977 11.3687 4.5 11.6819 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5C14.2239 19.5 16.2644 18.5332 17.6552 17H15.2618C14.8476 17 14.5118 16.6642 14.5118 16.25C14.5118 15.8358 14.8476 15.5 15.2618 15.5H18.7618C19.4522 15.5 20.0118 16.0596 20.0118 16.75V20.25C20.0118 20.6642 19.6761 21 19.2618 21C18.8476 21 18.5118 20.6642 18.5118 20.25V18.2768C16.8557 19.9576 14.5269 21 12 21C7.02944 21 3 16.9706 3 12C3 11.6197 3.02364 11.2445 3.06959 10.8759C3.12085 10.4649 3.4956 10.1733 3.90663 10.2245Z" />
    </svg></ConsoleControl>
      </div>
      <div className="vac-agent-terminal vac-inspector-console" aria-label="Event console">
          <ol ref={streamRef} className="vac-inspector-stream" aria-label="Console events" aria-live="polite" aria-relevant="additions">
            {records.map((item,index) => <li key={item.id}>
              <button type="button" className="vac-inspect-event" aria-label={`Inspect event: ${item.event ?? item.label}`} aria-pressed={selectedEvent?.id === item.id} data-highlighted={selectedEvent?.id === item.id || Boolean(selectedEvent?.operationId && item.operationId === selectedEvent.operationId)} tabIndex={selectedEvent?.id === item.id || (!selectedEvent && index === 0) ? 0 : -1} onClick={() => select(item)} onKeyDown={event => {
                if (!["ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
                event.preventDefault();
                const nextIndex=event.key === "Home" ? 0 : event.key === "End" ? records.length-1 : Math.max(0,Math.min(records.length-1,index+(event.key === "ArrowDown" ? 1 : -1)));
                select(records[nextIndex]!);
                event.currentTarget.closest("ol")?.querySelectorAll<HTMLButtonElement>("li > button")[nextIndex]?.focus();
              }}>
                <span className="vac-inspector-record-heading"><img src={productIcons[inspectionProduct(item)]} width={14} height={14} alt="" />{item.timestamp && <time dateTime={item.timestamp}>{item.timestamp.slice(11, 23)}</time>}<code>{item.event ?? item.label}</code></span>
                <span className="vac-inspector-record-preview">{consolePreview(item).text}</span>
              </button>
            </li>)}
          </ol>
          {!records.length && <p className="vac-inspector-stream-empty">No events yet.</p>}
        </div>
    </div>
    {showExample ? <InspectorAiExample onBack={() => { setExampleFor(null); onSelect(selectedEvent?.kind ?? selectedId ?? "discovery"); }} /> : selectedEvent || guide ? <>
      {hasDetails && <InstrumentationInspector drilldown additionalProperties={selectedPreview?.additionalProperties} key={evidenceKey} label={selectedEvent && inspectionProduct(selectedEvent) === "Product Analytics" ? "Event" : selectedEvent?.label} guide={guide} event={selectedEvent?.event} timestamp={selectedEvent?.timestamp} properties={selectedEvent?.properties ?? {}} element={selectedEvent?.element} />}
      {guide?.aiExample && <button type="button" className="vac-text-button vac-inspector-related" onClick={() => { setExampleFor(evidenceKey); onSelect("discovery"); }}>Inspect a model-call example →</button>}
    </> : null}
  </section>;
}

/** One preview recipe keeps the console and supplemental data in agreement. */
function consolePreview(item: PlaygroundActivity) {
  const properties = item.properties ?? {};
  if (item.event === "$ai_generation") {
    return {
      text: `{ model: ${JSON.stringify(properties.$ai_model ?? "Unknown")}, latency: ${JSON.stringify(properties.$ai_latency ?? null)}s }`,
      additionalProperties: Object.fromEntries(Object.entries(properties).filter(([key]) => key !== "$ai_model" && key !== "$ai_latency")),
    };
  }
  const entries = Object.entries(properties).map(([key,value]) => ({key,value,json:JSON.stringify(value)}));
  return {
    text: entries.length ? `{ ${entries.slice(0,2).map(({key,json}) => `${key}: ${json.slice(0,80)}${json.length > 80 ? "…" : ""}`).join(", ")}${entries.length>2 ? ", …" : ""} }` : "{}",
    additionalProperties: Object.fromEntries(entries.filter(({json},index) => index >= 2 || json.length > 80).map(({key,value}) => [key,value])),
  };
}

/** Classify the instrumentation, not the website feature that happened to emit it. */
export function inspectionProduct(activity: Pick<PlaygroundActivity, "event" | "kind">) {
  if (activity.event?.startsWith("$ai_")) return "AI Observability";
  if (activity.event === "$exception") return "Error Tracking";
  if (activity.kind === "replay") return "Session Replay";
  return "Product Analytics";
}

/** Current local replay settings, without recording contents. */
export function replayInspectionGuide(masked: boolean, recording: boolean): InspectionGuide {
  return {
    method: "replay",
    description: "The recording captures a visit’s sequence.",
    instrumentationDescription: `Twig records this visit locally. Search input is ${masked ? "masked" : "visible"}.`,
    question: "What happened before a visitor got stuck?",
    sources: [{path:"twig-components/src/ReplayRecorder.tsx", line:335, code:"maskAllInputs: true,\n        maskInputFn: (text, element) =>\n          element.matches(searchSelector) && !masked ? text : \"[masked]\",\n        recordCanvas: false,\n        collectFonts: true,\n        sampling: { mousemove: 100, scroll: 200 },"}],
    configuration: { maskAllInputs: true, search_input_masked: masked, recording, recordCanvas: false },
  };
}
