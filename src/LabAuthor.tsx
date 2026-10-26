"use client";
import { AuthorBrand } from "./AuthorBrand.js";
import { AuthorPreviewHeader } from "./AuthorPreviewHeader.js";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { AuthorRichTextEditor, RichTextView } from "./AuthorRichText.js";
import { TripPlanner } from "./TripPlanner.js";
import { stays } from "./catalog.js";
import { LabAuthorPageRow } from "./LabAuthorPageRow.js";
import { LabChecklist } from "./LabChecklist.js";
import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";
import { PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { StayFilters, type StaySetting } from "./StayFilters.js";
import { advanceAuthorProgress, authorProducts, authorActions, authorComponents, authorStepComplete, createEmptyAuthorBlock, createEmptyAuthorPage, validateLabDraft, type AuthorAction, type AuthorBlock, type AuthorBlockType, type LabDraft } from "./lab-author.js";

export { createLabDraft, createEmptyLabDraft, parseLabDraft, authorHandoff } from "./lab-author.js";
export type { LabDraft } from "./lab-author.js";
export { LabPublishing } from "./LabPublishing.js";
export type AuthorInteraction = { action: "component_added" | "component_removed" | "component_moved" | "step_added" | "step_removed" | "step_moved" | "preview_started" | "preview_completed" | "tutorial_opened" | "tutorial_completed" | "tutorial_closed" | "product_changed" | "context_changed"; component?: AuthorBlockType };
const mark = new URL("./assets/posthog-logomark.svg", import.meta.url).href;
const products = [
  ["Product Analytics", new URL("./assets/posthog-product-analytics.svg", import.meta.url).href],
  ["AI Observability", new URL("./assets/posthog-ai-observability.svg", import.meta.url).href],
  ["Session Replay", new URL("./assets/posthog-session-replay.svg", import.meta.url).href],
  ["Error Tracking", new URL("./assets/posthog-error-tracking.svg", import.meta.url).href],
];
function AuthorMenuSummary({ children }: { children: ReactNode }) {
  return <summary className="ph-author-menu-summary"><span>{children}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg></summary>;
}
function Button({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="vac-button" disabled={disabled} onClick={onClick}><span className="vac-os-button-face">{children}</span></button>;
}
function Field({ label, value, onChange, multiline = false, code = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; code?: boolean }) {
  const id = useId();
  return <div className="ph-author-field"><label htmlFor={id}>{label}</label>{multiline ? <textarea id={id} className={code ? "ph-author-code-input" : undefined} value={value} maxLength={20000} rows={code ? 5 : 3} onChange={e => onChange(e.target.value)} /> : <input id={id} value={value} maxLength={20000} onChange={e => onChange(e.target.value)} />}</div>;
}
function BlockFields({ block, onChange, planner, fullSite }: { fullSite?: boolean; planner: boolean; block: AuthorBlock; onChange: (block: AuthorBlock) => void }) {
  if (block.type === "context") return <AuthorRichTextEditor label="Plain text" text={block.text} richText={block.richText} onChange={(text, richText) => onChange({ ...block, text, richText })} />;
  if (block.type === "code") return <><Field label="Language or filename" value={block.label} onChange={label => onChange({ ...block, label })} /><Field label="Code" value={block.code} multiline code onChange={code => onChange({ ...block, code })} /></>;
  if (block.type === "detail") return <><Field label="Disclosure title" value={block.title} onChange={title => onChange({ ...block, title })} /><AuthorRichTextEditor label="Detail" text={block.text} richText={block.richText} onChange={(text, richText) => onChange({ ...block, text, richText })} /></>;
  if (block.type === "evidence") return <p>The lab preview shows example events. In Test lab and the live lab, this inspector shows events captured from the learner’s Twig interactions. No setup needed.</p>;
  return <div className="ph-author-checklist-fields">{block.items.map((item, index) => <div key={index} className="ph-author-instruction"><AuthorRichTextEditor label={`Action ${index + 1}`} text={item.text} richText={item.richText} onChange={(text, richText) => onChange({ ...block, items: block.items.map((value, i) => i === index ? { ...value, text, richText } : value) })} /><label className="ph-author-field">Complete when<select value={item.action} onChange={e => onChange({ ...block, items: block.items.map((value, i) => i === index ? { ...value, action: e.target.value as AuthorAction } : value) })}>{authorActions.filter(action => fullSite || action.value === "event_selected" || (planner ? action.value === "trip_request_sent" : action.value !== "trip_request_sent") || (block.type === "checklist" && block.items.some(item => item.action === action.value))).map(action => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label><button type="button" className="ph-author-quiet" disabled={block.items.length === 1} onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}>Remove action {index + 1}</button></div>)}<button type="button" className="ph-author-quiet" disabled={block.items.length >= 12} onClick={() => onChange({ ...block, items: [...block.items, { text: "", action: planner ? "trip_request_sent" : "filter_any" }] })}>+ Add action</button></div>;
}
type CapturedEvent = { id: number; setting: string; planner?: boolean; name?: string };
const exampleEvents: CapturedEvent[] = [
  { id: 1, setting: "Forest", name: "twig_stay_filter_selected" },
  { id: 2, setting: "Coast", name: "twig_stay_filter_selected" },
];
function EventInspector({ events: capturedEvents, selected: capturedSelection, onSelect, example = false }: { events: CapturedEvent[]; selected: number | null; onSelect: (id: number) => void; example?: boolean }) {
  const [exampleSelection, setExampleSelection] = useState(1);
  const events = example ? exampleEvents : capturedEvents;
  const selected = example ? exampleSelection : capturedSelection;
  const id = useId();
  const current = events.find(event => event.id === selected);
  return <section className="ph-author-evidence" aria-label="Event inspector"><div className="ph-author-panel-heading">Events{example ? " (example)" : ""} <span>{events.length}</span></div>{events.length ? <><div className="ph-author-event-list">{events.map(event => <button key={event.id} type="button" aria-pressed={selected === event.id} aria-controls={id} onClick={() => example ? setExampleSelection(event.id) : onSelect(event.id)}><code>{event.name ?? (event.planner ? "trip_request_sent" : "filter_clicked")}</code><span>{event.setting}</span></button>)}</div><div id={id}>{current ? <><div className="ph-author-panel-heading">Properties</div><dl className="ph-author-properties"><div><dt>{current.planner ? "context" : "setting"}</dt><dd>{current.setting}</dd></div></dl></> : <p>Select an event to inspect its properties.</p>}</div></> : <p>No events yet. Interact with Twig to capture one.</p>}</section>;
}

/** Controlled authoring view. Hosts own persistence, import/export, routing and telemetry. */
export function LabAuthor({ draft, onChange, onInteraction, navigation, toolbar, publishing, saveStatus, error, onDismissError, onUndo, onRedo, canUndo, canRedo, previewPhotos, renderTwig }: {
  draft: LabDraft; onChange: (draft: LabDraft) => void; onInteraction?: (event: AuthorInteraction) => void;
  navigation?: ReactNode; toolbar?: ReactNode; publishing?: ReactNode; saveStatus?: string; error?: string; onDismissError?: () => void;
  renderTwig?: (options: { running: boolean; run: number; lab?: { content: ReactNode; footer: ReactNode; progress: string }; onAction: (action: AuthorAction, label: string, eventName: string) => void; onReset: () => void }) => ReactNode;
  previewPhotos?: { Forest: string; Coast: string; City: string };
  onUndo?: () => void; onRedo?: () => void; canUndo?: boolean; canRedo?: boolean;
}) {
  const planner = draft.context === "ai-trip-planner";
  const [previewRun, setPreviewRun] = useState(0);
  const [stepId, setStepId] = useState(draft.steps[0].id);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [runIndex, setRunIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [setting, setSetting] = useState<StaySetting>("All");
  const [viewport, setViewport] = useState("desktop");
  const [notice, setNotice] = useState("");
  const drag = useRef<{ type: "add"; component: AuthorBlockType } | { type: "move"; id: string } | null>(null);
  const pagesMenu = useRef<HTMLDetailsElement>(null);
  const componentsMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeMenus(event: PointerEvent) {
      for (const menu of [pagesMenu.current, componentsMenu.current]) if (menu && !event.composedPath().includes(menu)) menu.open = false;
    }
    document.addEventListener("pointerdown", closeMenus);
    return () => document.removeEventListener("pointerdown", closeMenus);
  }, []);
  function closeMenuOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false;
    event.currentTarget.querySelector<HTMLElement>("summary")?.focus();
  }
  const draggedPage = useRef<string | null>(null);
  const pageList = useRef<HTMLElement>(null);
  const editor = useRef<HTMLElement>(null);
  const [editorHeight, setEditorHeight] = useState<number | null>(null);
  const resizeOrigin = useRef<{ y: number; height: number } | null>(null);
  function resizeEditor(height: number) { setEditorHeight(Math.min(1200, Math.max(240, height))); }
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const activeStep = draft.steps.find(step => step.id === stepId) ?? draft.steps[0];
  const step = running ? draft.steps[runIndex] ?? draft.steps[0] : activeStep;
  const index = draft.steps.indexOf(step);
  const actions = progress[step.id] ?? [];
  const complete = authorStepComplete(step, actions);
  const issues = validateLabDraft(renderTwig ? { ...draft, startingPath: draft.startingPath ?? "/" } : draft);
  const pageIndex = draft.steps.indexOf(activeStep);
  function removePage(id: string) {
    if (draft.steps.length === 1) return;
    const removedIndex = draft.steps.findIndex(page => page.id === id);
    const steps = draft.steps.filter(page => page.id !== id);
    const nextId = id === activeStep.id ? steps[Math.min(removedIndex, steps.length - 1)].id : activeStep.id;
    setStepId(nextId);
    onChange({ ...draft, steps });
    onInteraction?.({ action: "step_removed" });
    setNotice("Page removed. Use Undo to restore it.");
    requestAnimationFrame(() => pageList.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus());
  }
  function updateBlocks(blocks: AuthorBlock[]) { onChange({ ...draft, steps: draft.steps.map(s => s.id === activeStep.id ? { ...s, blocks } : s) }); }
  function addBlock(type: AuthorBlockType, before?: string) {
    if (activeStep.blocks.length >= 30) { setNotice("A page can have up to 30 components."); return; }
    const block = createEmptyAuthorBlock(type, crypto.randomUUID());
    if (planner && block.type === "checklist") block.items[0].action = "trip_request_sent";
    const blocks = [...activeStep.blocks];
    const at = before ? blocks.findIndex(b => b.id === before) : blocks.length;
    blocks.splice(at < 0 ? blocks.length : at, 0, block);
    updateBlocks(blocks); onInteraction?.({ action: "component_added", component: type }); setNotice(`${authorComponents.find(c => c.type === type)?.label} added.`);
  }
  function moveBlock(id: string, to: number) {
    const blocks = [...activeStep.blocks], from = blocks.findIndex(b => b.id === id);
    if (from < 0 || to < 0 || to >= blocks.length || from === to) return;
    const [block] = blocks.splice(from, 1); blocks.splice(to, 0, block); updateBlocks(blocks);
    onInteraction?.({ action: "component_moved", component: block.type });
    setNotice(`Component moved to position ${to + 1}.`);
  }
  function recordAction(action: AuthorAction) {
    setProgress(previous => ({ ...previous, [step.id]: advanceAuthorProgress(step, previous[step.id] ?? [], action) }));
  }
  function filter(next: StaySetting) {
    setSetting(next);
    if (next === "All") return;
    setEvents(previous => [...previous.slice(-49), { id: (previous.at(-1)?.id ?? 0) + 1, setting: next }]);
    if (running) recordAction(`filter_${next.toLowerCase()}` as AuthorAction);
  }
  function stop() {
    setRunning(false); setFinished(false); setEvents([]); setSelected(null);
  }
  function start() {
    setPreviewRun(value => value + 1);
    setRunning(true); setFinished(false); setRunIndex(0); setProgress({}); setEvents([]); setSelected(null); setSetting("All");
    onInteraction?.({ action: "preview_started" });
    requestAnimationFrame(() => previewHeading.current?.focus());
  }
  function advance() {
    if (!complete) return;
    if (runIndex < draft.steps.length - 1) { setRunIndex(runIndex + 1); setSelected(null); }
    else { setFinished(true); onInteraction?.({ action: "preview_completed" }); }
    requestAnimationFrame(() => previewHeading.current?.focus());
  }
  function movePage(id: string, to: number) {
    const steps = [...draft.steps], from = steps.findIndex(page => page.id === id);
    if (from < 0 || to < 0 || to >= steps.length || from === to) return;
    const [page] = steps.splice(from, 1); steps.splice(to, 0, page);
    onChange({ ...draft, steps }); onInteraction?.({ action: "step_moved" });
    setNotice(`Page moved to position ${to + 1}.`);
  }
  const lesson = (          <div className="ph-author-lesson vac-lab" key={`${step.id}-${running}-${finished}`}>
            {finished ? <><h3 ref={previewHeading} tabIndex={-1}>Lab complete</h3><p>You completed <strong>{draft.title}</strong>.</p></> : <><h3 className={index === 0 ? undefined : "ph-author-sr"} ref={previewHeading} tabIndex={-1}>{index === 0 ? draft.title || "Title page" : step.name}</h3>{step.blocks.length ? step.blocks.map(block => <div key={block.id} className="ph-author-rendered-block">{block.type === "context" ? <RichTextView text={block.text} richText={block.richText} /> : block.type === "checklist" ? <LabChecklist label="Activity instructions" items={block.items.map((item, i) => ({ label: <RichTextView text={item.text || "Write an action…"} richText={item.richText} />, done: running && actions.includes(`${block.id}:${i}`) }))} /> : block.type === "code" ? <PlaygroundCodeBlock code={block.code} label={block.label} /> : block.type === "detail" ? <details><PlaygroundSummary>{block.title || "More detail"}</PlaygroundSummary><RichTextView text={block.text} richText={block.richText} /></details> : <EventInspector example={!running} events={events} selected={selected} onSelect={id => { setSelected(id); if (running) recordAction("event_selected"); }} />}</div>) : <p>Add content to this page.</p>}{index === 0 && <details><PlaygroundSummary>How this simulation works</PlaygroundSummary><p>Twig interactions and captured events stay in this browser. This preview sends no teaching data to PostHog and makes no model calls.</p></details>}</>}
          </div>);
  const lessonFooter = (<footer className="vac-lesson-footer"><button type="button" className="vac-text-button" disabled={!running || runIndex === 0 || finished} onClick={() => { setRunIndex(runIndex - 1); requestAnimationFrame(() => previewHeading.current?.focus()); }}>← Previous</button><Button disabled={!running || (!complete && !finished)} onClick={finished ? stop : advance}>{finished ? "Back to authoring" : index === draft.steps.length - 1 ? "Finish lab" : "Continue →"}</Button></footer>);
  return <div className="vac-app ph-author-app"><div className="vac-developer-theme ph-author">
    <header className="ph-author-header"><AuthorBrand/>{navigation}<div className="ph-author-toolbar">{running ? <button type="button" className="ph-author-quiet" onClick={stop}>← Back to authoring</button> : toolbar}<button type="button" className="ph-author-button" onClick={start}>{running ? "Restart preview" : "Test lab"}</button></div></header>
    <span className="ph-author-sr" role="status">{saveStatus}</span>
    {error && <div className="ph-author-message" role="alert"><span>{error}</span>{onDismissError && <button type="button" className="ph-author-quiet" onClick={onDismissError}>Dismiss</button>}</div>}
    {!running && publishing}
    {running && <details key={`review-${previewRun}`} className="ph-author-test-review" open><PlaygroundSummary>Before opening a PR</PlaygroundSummary><ul>
      <li><label><input type="checkbox" /><span>Read every page and check text, links, and code.</span></label></li>
      <li><label><input type="checkbox" /><span>Follow the instructions on Twig and inspect the captured events.</span></label></li>
      <li><label><input type="checkbox" /><span>Check Previous and Continue across all pages.</span></label></li>
      <li><label><input type="checkbox" /><span>Confirm required actions unlock Continue, then finish the lab.</span></label></li>
    </ul></details>}
    <span className="ph-author-sr" role="status">{notice}</span>
    <div className="ph-author-workspace" data-running={running} role={running ? "main" : undefined}>
      {!running && <aside className="ph-author-controlbar" aria-label="Authoring controls"><section className="ph-author-sidebar-section"><div className="ph-author-settings"><label className="ph-author-field"><select aria-label="Product" value={draft.product === undefined ? "Product Analytics" : draft.product ?? ""} onChange={event => { onChange({ ...draft, product: event.target.value ? event.target.value as typeof authorProducts[number] : null }); onInteraction?.({ action: "product_changed" }); }}><option value="">Choose a product</option>{authorProducts.map(product => <option key={product} value={product}>{product}</option>)}</select></label>{!renderTwig && <label className="ph-author-field">Twig context<select aria-label="Twig context" value={draft.context ?? "stay-filters"} onChange={event => { onChange({ ...draft, context: event.target.value as "stay-filters" | "ai-trip-planner" }); setEvents([]); setSelected(null); setProgress({}); setPreviewRun(value => value + 1); onInteraction?.({ action: "context_changed" }); }}><option value="ai-trip-planner">AI trip planner</option><option value="stay-filters">Stay filters</option></select></label>}</div></section><details ref={pagesMenu} className="ph-author-control-menu" onKeyDown={closeMenuOnEscape} onToggle={event => { if (event.currentTarget.open && componentsMenu.current) componentsMenu.current.open = false; }}><AuthorMenuSummary>Pages</AuthorMenuSummary><div className="ph-author-control-popover"><nav ref={pageList} aria-label="Lesson pages" className="ph-author-steps">{draft.steps.map((s, i) => <LabAuthorPageRow key={s.id} name={s.name} index={i} selected={s.id === activeStep.id} canRemove={draft.steps.length > 1} onMove={direction => movePage(s.id, i + direction)} onDragStart={event => { draggedPage.current = s.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-learn-studio-page", s.id); }} onDragEnd={() => { draggedPage.current = null; }} onDrop={() => { const id = draggedPage.current; draggedPage.current = null; if (id) movePage(id, i); }} onRemove={() => removePage(s.id)} onSelect={() => { setStepId(s.id); if (pagesMenu.current) pagesMenu.current.open = false; }} onRename={name => onChange({ ...draft, steps: draft.steps.map(page => page.id === s.id ? { ...page, name } : page) })} />)}</nav><button type="button" className="ph-author-quiet" disabled={draft.steps.length >= 30} onClick={() => { const next = createEmptyAuthorPage(crypto.randomUUID()); onChange({ ...draft, steps: [...draft.steps, next] }); setStepId(next.id); if (pagesMenu.current) pagesMenu.current.open = false; onInteraction?.({ action: "step_added" }); }}>+ Add page</button></div></details>
        <details ref={componentsMenu} className="ph-author-control-menu" onKeyDown={closeMenuOnEscape} onToggle={event => { if (event.currentTarget.open && pagesMenu.current) pagesMenu.current.open = false; }}><AuthorMenuSummary>Component</AuthorMenuSummary><div className="ph-author-control-popover"><div className="ph-author-palette">{authorComponents.map(component => <button type="button" key={component.type} draggable onDragStart={event => { drag.current = { type: "add", component: component.type }; event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", component.type); }} onDragEnd={() => { drag.current = null; }} disabled={activeStep.blocks.length >= 30} onClick={() => { addBlock(component.type); if (componentsMenu.current) componentsMenu.current.open = false; }}><span>{component.label}</span><span aria-hidden="true">+</span></button>)}</div></div></details>
      </aside>}
      {!running && <div className="ph-author-editor-pane">
      <main ref={editor} className="ph-author-editor" id="author-main"
        // The user controls this runtime measurement by dragging the divider.
        style={editorHeight === null ? undefined : { "--author-editor-height": `${editorHeight}px` } as CSSProperties}><div className="ph-author-section-header"><h2>Page content</h2></div>
        {pageIndex > 0 && (!activeStep.name.trim() || !activeStep.blocks.length) && <section className="ph-author-settings" aria-label="Page setup"><h3>Get this page ready</h3><ol className="ph-author-setup-list"><li>{activeStep.name.trim() ? <span>✓ Page named</span> : <button type="button" className="ph-author-quiet" onClick={() => { if (pagesMenu.current) pagesMenu.current.open = true; pageList.current?.querySelector<HTMLButtonElement>(`[aria-label="Rename page ${pageIndex + 1}"]`)?.click(); }}>Name this page</button>}</li><li>{activeStep.blocks.length ? <span>✓ Component added</span> : <button type="button" className="ph-author-quiet" onClick={() => addBlock("context")}>Add your first component</button>}</li></ol></section>}
        {draft.steps.indexOf(activeStep) === 0 && <div className="ph-author-settings"><Field label="Lab title" value={draft.title} onChange={title => onChange({ ...draft, title })} /></div>}
        <div className="ph-author-blocks">{activeStep.blocks.map((block, i) => <section className="ph-author-block" key={block.id} onDragOver={event => { if (drag.current) { event.preventDefault(); event.stopPropagation(); } }} onDrop={event => { event.preventDefault(); event.stopPropagation(); const item = drag.current; drag.current = null; if (item?.type === "add") addBlock(item.component, block.id); else if (item?.type === "move") moveBlock(item.id, i); }}><div className="ph-author-block-header"><span draggable tabIndex={0} aria-label={`Drag ${authorComponents.find(c => c.type === block.type)?.label}. Use the move buttons to reorder with a keyboard.`} onDragStart={event => { drag.current = { type: "move", id: block.id }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", block.id); }} onDragEnd={() => { drag.current = null; }}>⠿</span><h3>{authorComponents.find(c => c.type === block.type)?.label}</h3><div className="ph-author-controls"><button type="button" aria-label={`Move ${authorComponents.find(c => c.type === block.type)?.label} up`} disabled={i === 0} onClick={() => moveBlock(block.id, i - 1)}>↑</button><button type="button" aria-label={`Move ${authorComponents.find(c => c.type === block.type)?.label} down`} disabled={i === activeStep.blocks.length - 1} onClick={() => moveBlock(block.id, i + 1)}>↓</button><button type="button" aria-label={`Remove ${authorComponents.find(c => c.type === block.type)?.label}`} onClick={() => { updateBlocks(activeStep.blocks.filter(b => b.id !== block.id)); onInteraction?.({ action: "component_removed", component: block.type }); }}>×</button></div></div><div className="ph-author-block-body"><BlockFields fullSite={!!renderTwig} planner={planner} block={block} onChange={next => updateBlocks(activeStep.blocks.map(b => b.id === block.id ? next : b))} /></div></section>)}<div className="ph-author-dropzone" onDragOver={event => { if (drag.current) event.preventDefault(); }} onDrop={event => { event.preventDefault(); const item = drag.current; drag.current = null; if (item?.type === "add") addBlock(item.component); else if (item?.type === "move") moveBlock(item.id, activeStep.blocks.length - 1); }}>Drop a component here<button className="ph-author-quiet" type="button" onClick={() => addBlock("context")} disabled={activeStep.blocks.length >= 30}>Add plain text</button></div></div>

      </main>
      <div className="ph-author-editor-divider" role="separator" tabIndex={0} aria-label="Resize page editor" aria-orientation="horizontal" aria-controls="author-main" aria-valuemin={240} aria-valuemax={1200} aria-valuenow={editorHeight ?? 480}
        onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); resizeOrigin.current = { y: event.clientY, height: editor.current?.getBoundingClientRect().height ?? 480 }; }}
        onPointerMove={event => { if (resizeOrigin.current) resizeEditor(resizeOrigin.current.height + event.clientY - resizeOrigin.current.y); }}
        onPointerUp={event => { resizeOrigin.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onLostPointerCapture={() => { resizeOrigin.current = null; }}
        onKeyDown={event => { const height = editor.current?.getBoundingClientRect().height ?? 480; if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); resizeEditor(height + (event.key === "ArrowDown" ? 32 : -32)); } else if (event.key === "Home" || event.key === "End") { event.preventDefault(); resizeEditor(event.key === "Home" ? 240 : 1200); } }}><span /></div>
      </div>}
      <div className="ph-author-preview-pair">{!(running && renderTwig) && <section className="ph-author-preview-column" aria-label="Lab preview"><AuthorPreviewHeader viewport={viewport} onChange={setViewport}/><div className="ph-author-preview-stage"><div className="ph-author-preview" data-viewport={viewport}>
        <div className="ph-author-preview-body"><header className="ph-author-playground-header"><h2>PostHog Playground</h2><div>{!running && <button type="button" className="vac-text-button" onClick={() => { setStepId(draft.steps[0].id); setNotice("First page selected."); }}>← First page</button>}<span>{index + 1} / {draft.steps.length}</span></div></header>
{lesson}{lessonFooter}</div>
        <aside className="ph-author-preview-rail" aria-label="Fixed Playground rail"><img src={mark} width="26" height="26" alt="PostHog" />{products.map(([name, src]) => <span key={name} title={name} aria-current={(draft.product === undefined ? "Product Analytics" : draft.product) === name ? "true" : undefined}><img src={src} width="22" height="22" alt={name} /></span>)}</aside>
      </div></div>{!running && <p className="ph-author-preview-note">Select Test lab to check completion rules.</p>}</section>}
      {renderTwig ? renderTwig({ running, run: previewRun, lab: running ? { content: lesson, footer: lessonFooter, progress: `${index + 1} / ${draft.steps.length}` } : undefined, onReset: () => { setPreviewRun(value => value + 1); setEvents([]); setSelected(null); setProgress({}); }, onAction: (action, label, eventName) => { setEvents(previous => [...previous.slice(-49), { id: (previous.at(-1)?.id ?? 0) + 1, setting: label, planner: action === "trip_request_sent", name: eventName }]); if (running) recordAction(action); } }) : <section className="ph-author-test-site" aria-label="Twig interaction preview"><div className="ph-author-section-header"><h2>Twig preview</h2><button type="button" className="ph-author-quiet" onClick={() => { setPreviewRun(value => value + 1); setEvents([]); setSelected(null); setProgress({}); }}>Reset interaction</button></div><div className="ph-author-twig-sandbox twig-browser"><div className="ph-author-twig-heading"><span className="vac-wordmark">twig</span></div>{planner ? <TripPlanner key={`${previewRun}-${running}-${draft.context}`} inline stays={stays} renderStayLink={stay => <span>{stay.title}</span>} onReset={() => { setPreviewRun(value => value + 1); setEvents([]); setSelected(null); setProgress({}); }} onRequestSent={() => { setEvents(previous => [...previous.slice(-49), { id: (previous.at(-1)?.id ?? 0) + 1, setting: "AI trip planner", planner: true }]); if (running) recordAction("trip_request_sent"); }} /> : <><p>Choose a setting to capture an event.</p><StayFilters className="vac-filters" buttonClassName="vac-filter" legend="Setting" value={setting} onChange={filter} /><div className="ph-author-sandbox-stay">{previewPhotos && <img src={previewPhotos[setting === "All" ? "Forest" : setting]} width="640" height="360" alt={`${setting === "All" ? "Forest" : setting} stay on Twig`} />}<h3>{setting === "Coast" ? "Coast stay" : setting === "City" ? "City stay" : "Forest stay"}</h3><p>{setting === "All" ? "Choose a setting." : `${setting} selected. Your event is in the Playground.`}</p></div></>}</div><p className="ph-author-preview-note">Settings and evidence are simulated locally. Your authored code is never executed.</p></section>}</div>
    </div>
  </div></div>;
}
