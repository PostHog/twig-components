"use client";
import { Children, isValidElement, useEffect, useId, useRef, useState, type Dispatch, type ReactNode } from "react";
import { canContinue, captureCode, currentEvents, destinationCounts, eventInspectionRequest, eventTrendsRequest, handoffIntro, handoffSteps, handoffScope, needsConfiguration, type EventsAction, type EventsState, type TeachingEvent } from "./events-lab.js";
function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="vac-button" {...props}><span className="vac-os-button-face">{children}</span></button>;
}
const lessons = [
  { title: "Events and properties", text: "In this lab, turn your Twig clicks into events, add properties to describe them, and discover which destinations you choose most.", next: "" },
  { title: "What does a click tell us?", text: "An event records something that happened. Let’s see what PostHog captures when you click a destination.", next: "Give the action a name" },
  { title: "Name the action", text: <>Your click was recorded as <code>$autocapture</code>. Now give the action a useful name: <code>stay_filter_selected</code>.</>, next: "Add a property" },
  { title: "Which destination?", text: <>A property describes an event. Add <code>destination_type</code>, then compare two different filter clicks.</>, next: "Add more context" },
  { title: "What happened after the click?", text: "Properties can also be numbers or booleans (true or false). Record how many stays matched the filter.", next: "Compare your selections" },
  { title: "Which destination did you choose most?", text: <>Compare your filter selections by <code>destination_type</code>. Keep using Twig’s filters to see the counts change.</>, next: "Finish the lab" },
];
const configurePrompts = ["", "", "Name filter clicks stay_filter_selected", "Add destination_type to filter events", "Add results_count and has_results"];
function insight(step: number, event: TeachingEvent) {
  if (step === 1) return "This records a click, but the name doesn’t explain the product action. Let’s make it more useful.";
  if (step === 2) return "Now we know a filter was selected. Without a destination property, we still can’t tell which one.";
  if (step === 3) return <>The event is still <code>stay_filter_selected</code>. The <code>destination_type</code> property tells us this selection was {event.properties.destination_type}.</>;
  return <>{event.properties.results_count} {event.properties.results_count === 1 ? "stay" : "stays"} matched. <code>results_count</code> is a number – <code>has_results</code> is <code>{String(event.properties.has_results)}</code>, a boolean (true or false).</>;
}
function agentEventAnswer(event: TeachingEvent) {
  if (event.event === "$autocapture") return <>Your last click was recorded as <code>$autocapture</code>. It has <code>$event_type: "click"</code> and <code>$pathname: "/"</code>. I can tell a click happened on the home page, but this event doesn’t tell me which destination you selected.</>;
  if (!Object.keys(event.properties).length) return <>I found <code>{event.event}</code>. The name tells me you selected a filter, but there are no custom properties yet, so I can’t tell which destination you chose.</>;
  return <>Your last <code>{event.event}</code> event recorded <code>destination_type: "{String(event.properties.destination_type)}"</code>.{typeof event.properties.results_count === "number" && <> It also recorded <code>results_count: {event.properties.results_count}</code> and <code>has_results: {String(event.properties.has_results)}</code> – {event.properties.results_count === 0 ? "no stays matched that filter." : `${event.properties.results_count} ${event.properties.results_count === 1 ? "stay matched" : "stays matched"} that filter.`}</>}</>;
}
function agentComparisonAnswer(events: TeachingEvent[]) {
  const rows = destinationCounts(events);
  const highest = Math.max(...rows.map(row => row.count));
  const leaders = rows.filter(row => row.count === highest).map(row => row.destination);
  return <>I grouped {events.length} filter selections by <code>destination_type</code>. {leaders.length === 1 ? `${leaders[0]} was selected most often` : `${leaders.join(" and ")} are tied for the most selections`} – {highest} {highest === 1 ? "selection" : "selections"}{leaders.length > 1 ? " each" : ""}. These are event counts, so repeated clicks from the same person count separately.</>;
}
function Counts({ events, terminal = false }: { events: TeachingEvent[]; terminal?: boolean }) {
  const rows = destinationCounts(events);
  const max = Math.max(1, ...rows.map(row => row.count));
  return <><div aria-label="Selections by destination">{rows.map(row => <div className={terminal ? "vac-agent-count" : "vac-breakdown-row"} key={row.destination}><span>{row.destination}</span><span className="vac-breakdown-track">{!terminal && <span style={{ width: `${row.count / max * 100}%` }} />}</span><strong>{row.count}</strong></div>)}</div><p>{terminal ? "Higher counts show which filters you selected more often." : "The bars show which filters you selected more often."} Each selection counts as one event, so this compares clicks, not the number of people.</p></>;
}
function WebExperience({ state, dispatch }: ExperienceProps) {
  const events = currentEvents(state);
  const latest = events.at(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const event = events.find(item => item.id === selected) ?? latest;
  useEffect(() => { if (latest && state.path === "web" && state.step < 5) dispatch({ type: "inspect", id: latest.id }); }, [latest?.id, state.path, state.step, dispatch]);
  useEffect(() => { if (latest && state.path === "web" && state.step === 5) dispatch({ type: "answer", correct: true }); }, [latest?.id, state.path, state.step, dispatch]);
  if (needsConfiguration(state)) return <div className="vac-web-evidence"><p>{state.step === 2 ? "Apply this code to Twig for this lab. Your next filter click will record the named event." : state.step === 3 ? "Attach the selected destination to each new event." : "Attach the matching result count and whether any stays were found."}</p><pre aria-label="Event capture code">{captureCode[state.step]}</pre><Button onClick={() => dispatch({ type: "configure" })}>{state.step === 2 ? "Apply to Twig for this lab" : "Add these properties"} →</Button></div>;
  if (!latest) return <div className="vac-web-evidence"><div className="vac-web-toolbar"><strong>Activity</strong></div><p>Waiting for a destination filter click on Twig.</p></div>;
  if (state.step === 5) return <div className="vac-web-evidence"><div className="vac-web-toolbar"><strong>Trends</strong></div><p><code>stay_filter_selected</code> · total events</p><p className="vac-breakdown-applied">Broken down by <code>destination_type</code></p><Counts events={events} /></div>;
  return <>{event && <><pre aria-label="Recorded event JSON">{JSON.stringify({ event: event.event, timestamp: event.timestamp, properties: event.properties }, null, 2)}</pre><ActivityPreview events={events} selected={event} onSelect={setSelected} /><p>{insight(state.step, event)}</p></>}</>;

}
/** Compact Activity / Explore view, following PostHog's event rows and Properties table. */
function ActivityPreview({ events, selected, onSelect }: { events: TeachingEvent[]; selected: TeachingEvent; onSelect: (id: string) => void }) {
  return <section className="vac-activity-preview" aria-label="PostHog Activity preview">
    <div className="vac-activity-heading"><strong>Twig playground events</strong></div>
    <div className="vac-activity-list"><table aria-label="Recorded events"><thead><tr><th>Event</th><th>Time</th></tr></thead><tbody>{[...events].reverse().map(event => <tr key={event.id} className={event.id === selected.id ? "is-selected" : undefined}><td><button type="button" aria-pressed={event.id === selected.id} onClick={() => onSelect(event.id)}><span aria-hidden="true">{event.id === selected.id ? "▾" : "▸"}</span><code>{event.event}</code></button></td><td><time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</time></td></tr>)}</tbody></table></div>
    <div className="vac-activity-detail"><div className="vac-activity-property-heading">Properties</div><table aria-label="Event properties"><thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>{Object.entries(selected.properties).map(([name, value]) => <tr key={name}><td><code>{name}</code></td><td><code>{String(value)}</code></td></tr>)}{!Object.keys(selected.properties).length && <tr><td colSpan={2}>No custom properties</td></tr>}</tbody></table></div>
  </section>;
}
type ExperienceProps = { state: EventsState; dispatch: Dispatch<EventsAction> };
type AgentTurn = { prompt: string; text: ReactNode; acknowledgement?: string; tool?: string; request?: unknown; event?: TeachingEvent; events?: TeachingEvent[]; step: number };
function plainAnswer(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? plainAnswer(child.props.children) : String(child)).join("");
}
function StreamingAnswer({ children, onDone }: { children: ReactNode; onDone: () => void }) {
  const text = plainAnswer(children);
  const [length, setLength] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done.current(); return; }
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor = Math.min(text.length, cursor + 8);
      setLength(cursor);
      if (cursor === text.length) { window.clearInterval(timer); done.current(); }
    }, 24);
    return () => window.clearInterval(timer);
  }, [text]);
  return <p className="vac-agent-answer" aria-hidden="true">● {text.slice(0, length)}<span className="vac-agent-cursor">▍</span></p>;
}
function AgentExperience({ state, dispatch }: ExperienceProps) {
  const events = currentEvents(state);
  const latest = events.at(-1);
  const setup = needsConfiguration(state);
  const suggested = setup ? configurePrompts[state.step] : state.step === 5 ? "Compare selections by destination" : "What did my last filter click record?";
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [pending, setPending] = useState<{ turn: AgentTurn; action?: EventsAction; phase: "thinking" | "tool" | "answer" } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);
  const latestId = useRef(latest?.id);
  latestId.current = latest?.id;
  useEffect(() => {
    setPending(null);
    busy.current = false;
    return () => { timers.current.forEach(clearTimeout); timers.current = []; busy.current = false; };
  }, [state.step, state.path, state.revision]);
  function finish(turn: AgentTurn, action?: EventsAction) {
    setTurns(previous => [...previous.slice(-19), turn]);
    setPending(null);
    busy.current = false;
    if (action && (action.type !== "answer" || turn.events?.at(-1)?.id === latestId.current)) dispatch(action);
  }
  const id = useId();
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => { if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [turns.length, pending?.phase]);
  const currentTurns = turns.filter(turn => turn.step === state.step);
  const hasCurrentResponse = latest && currentTurns.some(turn => (turn.event?.id ?? turn.events?.at(-1)?.id) === latest.id);
  const showComposer = setup || (latest ? !hasCurrentResponse : currentTurns.length === 0);
  const instruction = pending ? null : setup
    ? "Send the prepared message to ask the agent to update Twig’s tracking code."
    : !latest
      ? "Choose a destination filter on Twig, then send the prepared message to inspect the recorded event."
      : showComposer
        ? state.step === 5
          ? "Send the prepared message to compare your filter selections with PostHog MCP."
          : "Send the prepared message to inspect your latest filter click with PostHog MCP."
        : null;
  function run(prompt: string) {
    if (busy.current || !prompt.trim() || (!setup && !latest)) return;
    let action: EventsAction | undefined;
    const normalized = prompt.toLowerCase();
    let turn: AgentTurn = { prompt, step: state.step, text: "No filter events have been recorded yet." };
    if (setup && /^(please )?(add|name|enable|set|update)\b/.test(normalized)) {
      action = { type: "configure" };
      turn = { ...turn, acknowledgement: "I’ll update the filter’s capture handler.", tool: "agent · edit code", request: captureCode[state.step], text: "Updated the filter’s capture handler. New filter clicks will use this code." };
    } else if (!setup && latest && state.step === 5 && /compar|count|most|group|destination/.test(normalized)) {
      action = { type: "answer", correct: true };
      turn = { ...turn, acknowledgement: "I’ll compare your filter selections by destination.", tool: "posthog · query-trends", request: eventTrendsRequest(events), events: [...events], text: agentComparisonAnswer(events) };
    } else if (!setup && /click|record|inspect|event|propert/.test(normalized)) {
      if (!latest) turn.text = "No filter events have been recorded yet.";
      else {
        action = { type: "inspect", id: latest.id };
        turn = { ...turn, acknowledgement: "I’ll check the latest event recorded by your filter click.", tool: "posthog · execute-sql", request: eventInspectionRequest(events), event: latest, text: agentEventAnswer(latest) };
      }
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(turn, action); return; }
    busy.current = true;
    setPending({ turn, action, phase: "thinking" });
    timers.current = [
      setTimeout(() => setPending({ turn, action, phase: "tool" }), 600),
      setTimeout(() => setPending({ turn, action, phase: "answer" }), 1400),
    ];
  }
  return <>{instruction && <p className="vac-agent-instructions">{instruction}</p>}<div className="vac-agent-terminal"><div className="vac-agent-title">❯_ Twig / coding agent <span>MCP</span></div><div className="vac-agent-transcript" ref={transcript} tabIndex={0} aria-label="Agent conversation" aria-busy={!!pending}>{currentTurns.map((turn, index) => <div className="vac-agent-turn" key={index}><p className="vac-agent-prompt">❯ {turn.prompt}</p>{turn.acknowledgement && <p className="vac-agent-muted">● {turn.acknowledgement}</p>}{turn.tool && <details className="vac-agent-tool"><summary>↳ {turn.tool} ✓</summary><pre>{typeof turn.request === "string" ? turn.request : JSON.stringify(turn.request, null, 2)}</pre><p>Result summary</p><pre>{JSON.stringify(turn.event ? { event: turn.event.event, properties: turn.event.properties } : turn.events ? destinationCounts(turn.events) : { updated: true }, null, 2)}</pre></details>}{turn.text && <p className="vac-agent-answer">● {turn.text}</p>}</div>)}{pending && <div className="vac-agent-turn">
    <p className="vac-agent-prompt">❯ {pending.turn.prompt}</p>
    {pending.phase === "thinking" ? <p className="vac-agent-muted" role="status"><span className="vac-agent-spinner" aria-hidden="true">✳</span> Thinking…</p> : <>
      <p className="vac-agent-muted">● {pending.turn.acknowledgement}</p>
      <p className="vac-agent-tool" role="status">↳ {pending.turn.tool} {pending.phase === "tool" ? <><span className="vac-agent-spinner" aria-hidden="true">✳</span><span className="vac-sr-only">Running</span></> : "✓"}</p>
      {pending.phase === "answer" && <StreamingAnswer onDone={() => finish(pending.turn, pending.action)}>{pending.turn.text}</StreamingAnswer>}
    </>}
  </div>}</div>{showComposer && !pending && <form className="vac-agent-input" aria-labelledby={id} onSubmit={e => { e.preventDefault(); run(suggested); }}><span id={id}>Message the agent</span><p className="vac-agent-draft"><span aria-hidden="true">❯ </span>{suggested}</p><button type="submit" disabled={!setup && !latest}>Send ↵</button></form>}</div></>;
}
function Handoff() {
  const [copied, setCopied] = useState("");
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(`${label} copied.`); }
    catch { setCopied("Copy wasn’t available. Select and copy the text below."); }
  }
  return <div className="vac-lab-handoff">
    <h4>Try events and properties with your own project</h4>
    <section className="vac-handoff-card" aria-label="Connect PostHog">
      <h4><span className="vac-handoff-number">1</span> Connect PostHog</h4>
      <p>Run this in your terminal, then follow the Wizard to choose your coding agent. You’ll need Node.js/npm and a PostHog account.</p>
      <div className="vac-command-block">
        <pre><code>npx @posthog/wizard mcp add</code></pre>
        <button type="button" className="vac-command-copy" aria-label="Copy setup command" title={copied === "Setup command copied." ? "Copied!" : "Copy setup command"} onClick={() => copy("npx @posthog/wizard mcp add", "Setup command")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">{copied === "Setup command copied." ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4" /></>}</svg>
        </button>
      </div>
      <a className="vac-browse-link" href="https://posthog.com/docs/model-context-protocol" target="_blank" rel="noreferrer">Or install manually ↗</a>
    </section>
    <section className="vac-handoff-card" aria-label="Explore your data">
      <h4><span className="vac-handoff-number">2</span> Explore your data</h4>
      <p>Already connected? Start here. Copy this prompt into your coding agent.</p>
      <div className="vac-command-block vac-prompt-block">
        <button type="button" className="vac-command-copy" aria-label="Copy prompt" title={copied === "Prompt copied." ? "Copied!" : "Copy prompt"} onClick={() => copy([handoffIntro, ...handoffSteps.map((step, index) => `${index + 1}. ${step}`), handoffScope].join("\n\n"), "Prompt")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">{copied === "Prompt copied." ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4" /></>}</svg>
        </button>
        <pre aria-label="Agent investigation prompt"><code>{[handoffIntro, ...handoffSteps.map((step, index) => `${index + 1}. ${step}`), handoffScope].join("\n\n")}</code></pre>
      </div>

    </section>
    <p role="status">{copied}</p>
  </div>;
}

export function EventsLab({ state, dispatch, onChoose }: ExperienceProps & { onChoose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [state.step, state.revision]);
  const lesson = lessons[state.step];
  if (state.step === 6) return <section className="vac-lab vac-events-lab"><h3 ref={heading} tabIndex={-1}>From clicks to answers</h3><p>You turned Twig clicks into events, added properties, and compared your selections in an insight.</p><Handoff /><Button onClick={onChoose}>Choose another lab</Button></section>;
  return <section className="vac-lab vac-events-lab" aria-label="Events and properties lab"><h3 ref={heading} tabIndex={-1}>{lesson.title}</h3><p>{lesson.text}</p>{state.step === 0 ? <><div className="vac-path-entry"><button className="vac-experience-card" onClick={() => dispatch({ type: "path", path: "web" })}><span className="vac-choice-art vac-choice-browser" aria-hidden="true"></span><span className="vac-choice-title">Web app <span aria-hidden="true">↗</span></span><span className="vac-choice-description">Learn with a simulated PostHog web interface</span></button><button className="vac-experience-card" onClick={() => dispatch({ type: "path", path: "mcp" })}><span className="vac-choice-art vac-choice-terminal" aria-hidden="true"></span><span className="vac-choice-title">Agent <span aria-hidden="true">↗</span></span><span className="vac-choice-description">Learn with a simulated agent and PostHog MCP</span></button></div></> : <><><div hidden={state.path !== "web"}><WebExperience key={`web:${state.revision}:${state.step}`} state={state} dispatch={dispatch} /></div><div hidden={state.path !== "mcp"}><AgentExperience key={`agent:${state.revision}`} state={state} dispatch={dispatch} />{state.step === 1 && canContinue(state) && <p>{insight(1, currentEvents(state).at(-1)!)}</p>}</div></>{state.step === 5 && state.answered && <div className="vac-save-insight"><p>{state.path === "web" ? <>This Trends chart is an <strong>insight</strong> – it answers “Which destination was selected most?”</> : <>The agent’s comparison answers “Which destination was selected most?” You could turn this query into a Trends <strong>insight</strong> in PostHog.</>} You’d save the insight to a <strong>dashboard</strong> alongside other insights so you can return to them.</p></div>}{canContinue(state) ? <Button onClick={() => dispatch({ type: "next" })}>{lesson.next} →</Button> : state.step === 3 && currentEvents(state).length > 0 && new Set(currentEvents(state).map(event => event.properties.destination_type)).size < 2 ? <p className="vac-muted">Try a second destination to see the property change.</p> : null}</>}</section>;
}



/** Remount with the captured event ID to restart the brief confirmation. */
export function EventRecordedNotice() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  return visible ? <span className="vac-event-recorded" role="status">Click recorded – return to lab</span> : null;
}

/** Host this alongside lab navigation, outside the lesson content. */
export function EventsExperienceSwitch({ state, dispatch }: Pick<ExperienceProps, "state" | "dispatch">) {
  if (state.step === 0 || state.step === 6) return null;
  return <div className="vac-experience-control"><span>Experience</span><div className="vac-experience-toggle" role="group" aria-label="Learning experience">{(["web", "mcp"] as const).map(path => <button key={path} type="button" aria-pressed={state.path === path} onClick={() => dispatch({ type: "path", path })}>{path === "web" ? "Web app" : "Agent"}</button>)}</div></div>;
}
