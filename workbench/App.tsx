import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { TripPlanner } from "../src/TripPlanner.js";
import { TripPlannerWalkthrough, TripPlannerLabProvider, useTripPlannerLab, canSendTripLessonMessage } from "../src/TripPlannerLab.js";
import { BrowseStaysPreview } from "../src/BrowseStaysPreview.js";
import { BrowseStays } from "../src/BrowseStays.js";
import { StayDetails } from "../src/StayDetails.js";
import { StayCardContent } from "../src/StayCard.js";
import { SavedStay } from "../src/SavedStay.js";
import {
  AccountLayout,
  AccountSettingsView,
  BookedStaysView,
  LoginView,
  ProfileMenu,
  ProfileOverview,
  SavedStaysView,
  type AccountLink,
  type AccountSection,
  type AccountSettingsValue,
  type BookedStaySummary,
} from "../src/Account.js";
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
import { ReplayProvider, useReplay } from "../src/ReplayRecorder.js";
import { PlaygroundInvitation } from "../src/PlaygroundPanels.js";
import "../src/catalog.css";
import "../src/lab.css";
import "./workbench.css";

type View = "planner" | "preview" | "saved" | "account" | "invite" | "filters" | "ai" | "booking" | "stay" | "replay";
const views: { id: View; label: string; description: string }[] = [
  { id: "planner", label: "Trip planner", description: "Follow a successful conversation, encounter a wrong recommendation, and investigate the recorded evidence. No inference or network requests." },
  { id: "preview", label: "Twig views", description: "Read-only guide preview and interactive filter control" },
  { id: "saved", label: "Saved stay", description: "Exercise host-controlled auth, save, loading, disabled, and error states" },
  { id: "account", label: "Account", description: "Walk through login, profile navigation, empty collections, and settings" },
  { id: "invite", label: "PostHog invitation", description: "Open and dismiss the playground invitation" },
  { id: "filters", label: "Filter lab", description: "Click Twig filters and inspect the locally recorded events" },
  { id: "ai", label: "AI lab", description: "Run a local recommendation fixture through the lesson" },
  { id: "booking", label: "Booking lab", description: "Simulate a successful or failed booking" },
  { id: "stay", label: "Stay lab", description: "Open listings and compare view events" },
  { id: "replay", label: "Replay lab", description: "Review the replay lesson with local fixture controls" },
];

function TripPlannerPreview() {
  return <TripPlannerLabProvider><TripPlannerPreviewContent /></TripPlannerLabProvider>;
}

function TripPlannerPreviewContent() {
  const [opened, setOpened] = useState<string | null>(null);
  const lab = useTripPlannerLab();
  const inspector = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (lab.lesson.step === 4 || lab.lesson.step === 1) {
      inspector.current?.scrollIntoView({ block: "start" });
      inspector.current?.focus({ preventScroll: true });
    }
  }, [lab.lesson.step, lab.lesson.captureVisible, lab.lesson.investigation, lab.lesson.capacityFixed]);
  function inspect() {
    inspector.current?.scrollIntoView({ block: "start" });
    inspector.current?.focus({ preventScroll: true });
  }
  return <>
    <div className="twig-browser workbench-twig">
      <TripPlanner
        key={lab.revision}
        scenario={lab.lesson.capacityFixed ? "capacity-fixed" : undefined}
        stays={stays}
        windowAction={{ label: "View request", onSelect: inspect }}
        onRequestComplete={lab.record}
        canSendMessage={message => canSendTripLessonMessage(lab.lesson, message)}
        onReset={lab.reset}
        renderStayLink={(stay) => <button type="button" onClick={() => setOpened(stay.id)}>View {stayLabel(stay)} →</button>}
      />
    </div>
    {opened && <div className="workbench-fixture" role="status">Host navigation requested: {opened}</div>}
    <div className="vac-app" ref={inspector} tabIndex={-1}>
      <div className="vac-developer-theme workbench-lab">
        <button className="vac-text-button" onClick={lab.reset}>Reset lab</button>
        {lab.lesson.step > 0 && <button className="vac-text-button" onClick={() => lab.dispatchLesson({ type: "previous" })}>Previous step</button>}
        <TripPlannerWalkthrough stays={stays} onAllLabs={() => lab.reset()} />
      </div>
    </div>
  </>;
}

function Preview() {
  const [selected, setSelected] = useState<Exclude<StaySetting, "All">>("Coast");
  const [filter, setFilter] = useState<StaySetting>("All");
  const [search, setSearch] = useState("");
  return <>
    <div className="workbench-controls"><label>Selected guide preview <select value={selected} onChange={(event) => setSelected(event.target.value as typeof selected)}><option>Forest</option><option>Coast</option><option>City</option></select></label></div>
    <BrowseStaysPreview selected={selected} />
    <div className="twig-browser workbench-twig"><main><BrowseStays id="workbench-browse" setting={filter} search={search} onSettingChange={setFilter} onSearchChange={setSearch} renderStay={(stay) => <article className="vac-card" key={stay.id}><StayCardContent stay={stay} image={<div className="vac-image"><span>Photo on Twig.com</span></div>} /></article>} /><StayDetails stay={stays[0]} /></main></div>
  </>;
}

function SavedStayPreview() {
  const [signedIn, setSignedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<boolean | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCallback, setLastCallback] = useState("No host callback yet.");

  function showState(next: "signed-out" | "unsaved" | "saved" | "disabled" | "error") {
    setSignedIn(next !== "signed-out");
    setSaved(next === "saved");
    setPending(null);
    setDisabled(next === "disabled");
    setError(next === "error" ? "Twig couldn’t update this stay. Try again." : null);
    setLastCallback("No host callback yet.");
  }

  function requestSave(nextSaved: boolean) {
    setPending(nextSaved);
    setError(null);
    setLastCallback(`onSavedChange(${nextSaved})`);
  }

  function finishRequest() {
    if (pending === null) return;
    setSaved(pending);
    setPending(null);
    setLastCallback("The host finished its request.");
  }

  function failRequest() {
    if (pending === null) return;
    setPending(null);
    setError("Twig couldn’t update this stay. Try again.");
    setLastCallback("The host rejected its request.");
  }

  return <>
    <div className="workbench-controls" aria-label="Saved stay examples">
      <button onClick={() => showState("signed-out")} aria-pressed={!signedIn}>Signed out</button>
      <button onClick={() => showState("unsaved")} aria-pressed={signedIn && !saved && !disabled && !error}>Unsaved</button>
      <button onClick={() => showState("saved")} aria-pressed={signedIn && saved && pending === null}>Saved</button>
      <button onClick={() => showState("disabled")} aria-pressed={disabled}>Disabled</button>
      <button onClick={() => showState("error")} aria-pressed={Boolean(error)}>Error</button>
    </div>
    <div className="twig-browser workbench-saved-preview">
      <article className="workbench-saved-card">
        <div className="workbench-saved-image" aria-hidden="true"><span>Stay photo</span></div>
        <div>
          <span className="vac-eyebrow">Adirondacks, New York</span>
          <h3>Adiron-shack</h3>
          <p className="vac-muted">4 guests · 2 bedrooms · 2 baths</p>
          <p><strong>$355</strong> / night <span className="vac-muted">USD</span></p>
        </div>
        {signedIn ? (
          <SavedStay stayName="Adiron-shack" signedIn saved={saved} loading={pending !== null} disabled={disabled} errorMessage={error} onSavedChange={requestSave} />
        ) : (
          <SavedStay stayName="Adiron-shack" signedIn={false} loading={pending !== null} disabled={disabled} errorMessage={error} onSignIn={() => setLastCallback("onSignIn()")} />
        )}
      </article>
    </div>
    <div className="workbench-fixture workbench-saved-host">
      <strong>Host controls</strong>
      <p>{lastCallback}</p>
      <button disabled={pending === null} onClick={finishRequest}>Finish request</button>
      <button disabled={pending === null} onClick={failRequest}>Fail request</button>
      <small>The package only asks. The consuming site owns sign-in, storage, analytics, and the result.</small>
    </div>
  </>;
}

const demoAccountLinks: readonly AccountLink[] = [
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "saved", label: "Saved stays", href: "/profile/saved" },
  { id: "bookings", label: "Booked stays", href: "/profile/bookings" },
  { id: "settings", label: "Account settings", href: "/profile/settings" },
];
const demoProfileBio = "Hi, I'm Edgar! I love long walks on the beach with my family in 3:4 formation and I have collection of rubber ducks from my many trips across Europe.";

function AccountPreview() {
  const [signedIn, setSignedIn] = useState(false);
  const [screen, setScreen] = useState<AccountSection | "login">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookedStaySummary[]>([]);
  const [profileBio, setProfileBio] = useState(demoProfileBio);
  const [settings, setSettings] = useState<AccountSettingsValue>({
    displayName: "Edgar Hogg",
    email: "edgar.hogg@fakeemail.com",
    tripReminders: true,
    productUpdates: false,
  });
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const profile = {
    displayName: settings.displayName,
    email: settings.email,
    homeTown: "London",
    bio: profileBio,
  };
  const savedStays = stays.filter((stay) => savedIds.includes(stay.id));

  function navigate(href: string) {
    const link = demoAccountLinks.find((item) => item.href === href);
    if (link) setScreen(link.id);
  }

  function reset() {
    setSignedIn(false);
    setScreen("login");
    setMenuOpen(false);
    setSavedIds([]);
    setBookings([]);
    setProfileBio(demoProfileBio);
    setSettings({
      displayName: "Edgar Hogg",
      email: "edgar.hogg@fakeemail.com",
      tripReminders: true,
      productUpdates: false,
    });
    setSettingsMessage(null);
  }

  const image = () => <div className="vac-image"><span>Stay photo</span></div>;
  const accountPage = screen === "profile" ? (
    <ProfileOverview profile={profile} onBioChange={setProfileBio} />
  ) : screen === "saved" ? (
    <SavedStaysView
      stays={savedStays}
      renderImage={image}
      stayHref={(stay) => `/stays/${stay.id}`}
      onNavigate={() => {}}
      onRemoveStay={(stay) => setSavedIds((ids) => ids.filter((id) => id !== stay.id))}
    />
  ) : screen === "bookings" ? (
    <BookedStaysView bookings={bookings} renderImage={image} stayHref={(stay) => `/stays/${stay.id}`} onNavigate={() => {}} />
  ) : (
    <AccountSettingsView value={settings} onChange={(value) => { setSettings(value); setSettingsMessage(null); }} onSave={() => setSettingsMessage("Changes saved in this local preview.")} statusMessage={settingsMessage} />
  );

  return <>
    <div className="workbench-controls">
      <button onClick={reset}>Reset demo</button>
      <button disabled={!signedIn || savedIds.length > 0} onClick={() => setSavedIds([stays[0].id])}>Add saved fixture</button>
      <button disabled={!signedIn || bookings.length > 0} onClick={() => setBookings([{ id: "fixture-booking", stay: stays[0], dateLabel: "Oct 10–12", guestsLabel: "2 guests", statusLabel: "Upcoming" }])}>Add booking fixture</button>
    </div>
    <div className="twig-browser workbench-account-browser">
      <header>
        <strong>Twig</strong>
        {signedIn ? (
          <ProfileMenu profile={profile} links={demoAccountLinks} open={menuOpen} onOpenChange={setMenuOpen} onNavigate={navigate} onSignOut={() => { setSignedIn(false); setScreen("login"); setMenuOpen(false); }} />
        ) : (
          <button className="twig-profile-trigger twig-profile-login-trigger" onClick={() => setScreen("login")}>Log in</button>
        )}
      </header>
      {screen === "login" ? (
        <LoginView email="edgar.hogg@fakeemail.com" onLogin={() => { setSignedIn(true); setScreen("profile"); }} />
      ) : signedIn ? (
        <main><AccountLayout profile={profile} active={screen} links={demoAccountLinks} onNavigate={navigate}>{accountPage}</AccountLayout></main>
      ) : null}
    </div>
  </>;
}

function InvitationPreview() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  return <div className="vac-app workbench-invite-preview">
    <div className="workbench-controls"><button onClick={() => { setDismissed(false); setOpen(false); }}>Reset invitation</button></div>
    {open
      ? <div className="vac-developer-theme workbench-lab"><h3>PostHog Playground</h3><p>The host app opens its labs here.</p><button onClick={() => { setOpen(false); setDismissed(true); }}>Hide playground</button></div>
      : <PlaygroundInvitation dismissed={dismissed} onDismiss={() => setDismissed(true)} onOpen={() => setOpen(true)} toggleRef={toggleRef} />}
  </div>;
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

function ReplayRecordingPreview() {
  const replay = useReplay();
  return <div className="workbench-fixture"><strong>Floating recording control</strong><p>Start a local visit to preview the control used while browsing Twig.</p><button disabled={replay.mode === "manual" || replay.starting} onClick={() => replay.start("manual")}>Start recording</button></div>;
}

function Replay() {
  const [stage, setStage] = useState(0);
  const [exercise, setExercise] = useState<"ghost" | "manual">("ghost");
  const [recording, setRecording] = useState<unknown[]>([]);
  const replay: ReplayLabViewState = { exercise, recording, starting: false, frames: [], mode: null, masked: true, setMasked: () => {}, capturedMasked: true, message: "", start: () => setRecording([{}, {}]), stop: () => {}, clear: () => setRecording([]), setExercise };
  return <ReplayProvider open pathname="/"><LabPreview><div className="workbench-controls"><button onClick={() => setStage(0)} aria-pressed={stage === 0}>Intro</button><button onClick={() => setStage(1)} aria-pressed={stage === 1}>Exercise</button><button onClick={() => setStage(2)} aria-pressed={stage === 2}>Review</button><button onClick={() => setRecording([{}, {}])}>Add fixture visit</button></div><ReplayRecordingPreview /><ReplayLab stage={stage} onStage={setStage} replay={replay} pathname="/discover" returnHome={<span>Return to Twig</span>} sessionPlayer={<div className="workbench-fixture">Fixture visit preview</div>} /></LabPreview></ReplayProvider>;
}

export default function App() {
  const [view, setView] = useState<View>(() => new URLSearchParams(window.location.search).get("view") === "planner" ? "planner" : "preview");
  const current = views.find((item) => item.id === view)!;
  return <div className="workbench-shell"><aside className="workbench-sidebar"><span className="workbench-eyebrow">@posthog/twig-components</span><h1>Workbench</h1><p>Build and inspect components in the browser.</p><nav aria-label="Component previews">{views.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}>{item.label}</button>)}</nav><small>Local fixtures only. No PostHog account or event upload.</small></aside><main><header><span className="workbench-eyebrow">Live preview</span><h2>{current.label}</h2><p>{current.description}</p></header><div className="workbench-preview" key={view}>{view === "planner" ? <TripPlannerPreview /> : view === "preview" ? <Preview /> : view === "saved" ? <SavedStayPreview /> : view === "account" ? <AccountPreview /> : view === "invite" ? <InvitationPreview /> : view === "filters" ? <Filters /> : view === "ai" ? <Ai /> : view === "booking" ? <Booking /> : view === "stay" ? <Stay /> : <Replay />}</div></main></div>;
}
