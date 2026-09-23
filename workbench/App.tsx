import { useReducer, useRef, useState, type ReactNode } from "react";
import { BrowseStaysPreview } from "../src/BrowseStaysPreview.js";
import { StayFilters, type StaySetting } from "../src/StayFilters.js";
import { FilterLabExercise } from "../src/FilterLabExercise.js";
import { FilterInspector } from "../src/FilterInspector.js";
import { filterLabReducer, initialLabState } from "../src/filter-lab.js";
import { AiLab, AiLabProvider, useAiLab } from "../src/AiLab.js";
import { fixtureRequest } from "../src/ai-lab.js";
import { BookingLab, BookingLabProvider, useBookingLab } from "../src/BookingLab.js";
import { StayLab, StayLabProvider, useStayLab } from "../src/StayLab.js";
import { stays, stayLabel } from "../src/catalog.js";
import { ReplayLab, type ReplayLabViewState } from "../src/ReplayLab.js";
import "../src/catalog.css";
import "../src/lab.css";
import "./workbench.css";

type View = "preview" | "filters" | "ai" | "booking" | "stay" | "replay";
const views: { id: View; label: string; description: string }[] = [
  { id: "preview", label: "Twig views", description: "Read-only guide preview and interactive filter control" },
  { id: "filters", label: "Filter lab", description: "Click Twig filters and inspect the locally recorded events" },
  { id: "ai", label: "AI lab", description: "Run a local recommendation fixture through the lesson" },
  { id: "booking", label: "Booking lab", description: "Simulate a successful or failed booking" },
  { id: "stay", label: "Stay lab", description: "Open listings and compare view events" },
  { id: "replay", label: "Replay lab", description: "Review the replay lesson with local fixture controls" },
];

function Preview() {
  const [selected, setSelected] = useState<Exclude<StaySetting, "All">>("Coast");
  const [filter, setFilter] = useState<StaySetting>("All");
  return <>
    <div className="workbench-controls"><label>Selected guide preview <select value={selected} onChange={(event) => setSelected(event.target.value as typeof selected)}><option>Forest</option><option>Coast</option><option>City</option></select></label></div>
    <BrowseStaysPreview selected={selected} />
    <div className="twig-browser workbench-twig"><h3>Website filter control</h3><StayFilters value={filter} onChange={setFilter} className="vac-filters" buttonClassName="vac-filter" /><p>Selected: {filter}</p></div>
  </>;
}

function Filters() {
  const [state, dispatch] = useReducer(filterLabReducer, initialLabState);
  const [stage, setStage] = useState(1);
  const [selected, setSelected] = useState<StaySetting>("All");
  const filterRef = useRef<HTMLDivElement>(null);
  function focusFilters() { filterRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  return <div className="vac-app">
    <div className="workbench-controls"><button onClick={() => { dispatch({ type: "reset" }); setStage(1); setSelected("All"); }}>Reset lesson</button><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Exercise</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Inspect</button></div>
    <div className="twig-browser workbench-twig" ref={filterRef} id="workbench-filters"><h3>Browse stays</h3><StayFilters value={selected} onChange={(value) => { setSelected(value); if (value !== "All") dispatch({ type: "filter", setting: value }); }} className="vac-filters" buttonClassName="vac-filter" /><p>{selected === "All" ? "Choose a filter" : `${selected} stay`}</p></div>
    <div className="vac-developer-theme workbench-lab"><FilterLabExercise state={state} dispatch={dispatch} stage={stage} setStage={setStage} onFocusFilters={focusFilters} onContinue={() => setStage(2)} filterHref="#workbench-filters" /><FilterInspector state={state} onPractice={() => setStage(1)} filterHref="#workbench-filters" /></div>
  </div>;
}

function LabPreview({ children }: { children: ReactNode }) {
  return <div className="vac-app"><div className="vac-developer-theme workbench-lab">{children}</div></div>;
}

function AiRunner() {
  const { state, dispatch, scenario } = useAiLab();
  return <div className="workbench-fixture" id="ai-fixture"><strong>Twig request</strong><p>{fixtureRequest}</p><button disabled={!state.applied} onClick={() => dispatch({ type: "run", prompt: fixtureRequest, scenario })}>Run local recommendation</button><small>{state.applied ? `${state.runs.length} local run(s)` : "Apply the lesson code first"}</small></div>;
}
function Ai() {
  const [stage, setStage] = useState(1);
  return <AiLabProvider active><LabPreview><div className="workbench-controls"><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Build</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Inspect</button></div><AiRunner /><AiLab stage={stage} onStage={setStage} onFocusPlanner={() => document.getElementById("ai-fixture")?.scrollIntoView({ behavior: "smooth" })} /></LabPreview></AiLabProvider>;
}

const bookingFacts = { stay_id: "adiron-shack", nights: 2, guests: 4, total_cents: 71000 };
function BookingRunner() {
  const { state, dispatch } = useBookingLab();
  return <div className="workbench-fixture" id="booking-fixture"><strong>Twig booking form</strong><p>Adiron-shack · two nights · four guests</p><button disabled={!state.applied} onClick={() => dispatch({ type: "submit", facts: bookingFacts })}>Book stay locally</button><small>{state.applied ? `Outcome: ${state.lesson}` : "Apply the lesson code first"}</small></div>;
}
function Booking() {
  const [stage, setStage] = useState(0);
  return <BookingLabProvider active><LabPreview><div className="workbench-controls"><button onClick={() => setStage(0)} aria-pressed={stage === 0}>Intro</button><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Build</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Inspect</button></div><BookingRunner /><BookingLab stage={stage} onStage={setStage} onFocusBooking={() => document.getElementById("booking-fixture")?.scrollIntoView({ behavior: "smooth" })} /></LabPreview></BookingLabProvider>;
}

function StayContent() {
  const [stage, setStage] = useState(0);
  const [pathname, setPathname] = useState("/discover");
  const { state, dispatch } = useStayLab();
  function openStay(stay: typeof stays[number]) { setPathname(`/stays/${stay.id}`); dispatch({ type: "view", id: stay.id, title: stayLabel(stay) }); }
  return <LabPreview><div className="workbench-controls"><button onClick={() => setStage(0)} aria-pressed={stage === 0}>Intro</button><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Build</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Inspect</button></div><div className="workbench-fixture"><strong>Twig listings</strong><p>Open a listing to trigger <code>stay_viewed</code>.</p>{stays.slice(0, 3).map((stay) => <button key={stay.id} onClick={() => openStay(stay)}>{stayLabel(stay)}</button>)}<small>{state.events.length} local view(s)</small></div><StayLab stage={stage} onStage={setStage} pathname={pathname} renderStayLink={(stay) => <button onClick={() => openStay(stay)}>{stayLabel(stay)} →</button>} /></LabPreview>;
}
function Stay() { return <StayLabProvider><StayContent /></StayLabProvider>; }

function Replay() {
  const [stage, setStage] = useState(0);
  const [exercise, setExercise] = useState<"ghost" | "manual">("ghost");
  const [recording, setRecording] = useState<unknown[]>([]);
  const replay: ReplayLabViewState = { exercise, recording, starting: false, frames: [], mode: null, masked: true, setMasked: () => {}, capturedMasked: true, message: "", start: () => setRecording([{}, {}]), stop: () => {}, clear: () => setRecording([]), setExercise };
  return <LabPreview><div className="workbench-controls"><button onClick={() => setStage(0)} aria-pressed={stage === 0}>Intro</button><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Exercise</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Review</button><button onClick={() => setRecording([{}, {}])}>Add fixture visit</button></div><ReplayLab stage={stage} onStage={setStage} replay={replay} pathname="/discover" returnHome={<span>Return to Twig</span>} sessionPlayer={<div className="workbench-fixture">Fixture visit preview</div>} /></LabPreview>;
}

export default function App() {
  const [view, setView] = useState<View>("preview");
  const current = views.find((item) => item.id === view)!;
  return <div className="workbench-shell"><aside className="workbench-sidebar"><span className="workbench-eyebrow">@posthog/twig-components</span><h1>Workbench</h1><p>Build and inspect components in the browser.</p><nav aria-label="Component previews">{views.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}>{item.label}</button>)}</nav><small>Local fixtures only. No PostHog account or event upload.</small></aside><main><header><span className="workbench-eyebrow">Live preview</span><h2>{current.label}</h2><p>{current.description}</p></header><div className="workbench-preview" key={view}>{view === "preview" ? <Preview /> : view === "filters" ? <Filters /> : view === "ai" ? <Ai /> : view === "booking" ? <Booking /> : view === "stay" ? <Stay /> : <Replay />}</div></main></div>;
}
