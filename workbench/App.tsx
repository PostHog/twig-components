import { createGenerationRecord } from "../src/trip-planner-records.js";
import { GetawaySearch, SearchWorkspace, type GetawayPreferences } from "../src/GetawaySearch.js";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { AiSearchIcon, TripPlanner } from "../src/TripPlanner.js";
import { TripPlannerWalkthrough, TripPlannerLabProvider, useTripPlannerLab, canSendTripLessonMessage } from "../src/TripPlannerLab.js";
import { BrowseStaysPreview } from "../src/BrowseStaysPreview.js";
import { BrowseStays, TripSearch } from "../src/BrowseStays.js";
import { StayDetails } from "../src/StayDetails.js";
import { StayCardContent } from "../src/StayCard.js";
import { SavedStay } from "../src/SavedStay.js";
import {
  AccountLayout,
  AccountSettingsView,
  BookedStaysView,
  TripDetailsView,
  LoginView,
  ProfileMenu,
  ProfileOverview,
  SavedStaysView,
  type AccountLink,
  type AccountSection,
  type AccountSettingsValue,
  type BookedStaySummary,
} from "../src/Account.js";
import { AmenityFilters, matchesStayAmenities, type StayAmenity, type StaySetting } from "../src/StayFilters.js";
import { DatePicker, addDateDays } from "../src/DatePicker.js";
import { GuestPicker } from "../src/GuestPicker.js";
import { EventsLab, EventsExperienceSwitch } from "../src/EventsLab.js";
import { eventsReducer, initialEventsState } from "../src/events-lab.js";
import { filterStays } from "../src/catalog.js";
import { AiLab, AiLabProvider, useAiLab } from "../src/AiLab.js";
import { fixtureRequest } from "../src/ai-lab.js";
import { BookingLab, BookingLabProvider, useBookingLab } from "../src/BookingLab.js";
import { ErrorTrackingLab, ErrorTrackingLabProvider, useErrorTrackingLab } from "../src/ErrorTrackingLab.js";
import { StayLab, StayLabProvider, useStayLab } from "../src/StayLab.js";
import { stays, stayLabel } from "../src/catalog.js";
import { ReplayLab, type ReplayLabViewState } from "../src/ReplayLab.js";
import { ReplayProvider, useReplay } from "../src/ReplayRecorder.js";
import { LabDirectory, PlaygroundMarker, PlaygroundInspectionView, PlaygroundHome, PlaygroundOnboarding, PlaygroundToolRail, PlaygroundDock, PlaygroundInvitation, PlaygroundLauncher, ProductLabLanding, type PlaygroundActivity } from "../src/PlaygroundPanels.js";
import { LabNavigationView, LessonNavigationProvider, LabPrimaryAction } from "../src/LabNavigation.js";
import { playgroundPage, touchpointDefinitions } from "../src/playground.js";
import "../src/catalog.css";
import "../src/lab.css";
import "./workbench.css";

type View = "inspect" | "getaway" | "planner" | "preview" | "saved" | "account" | "invite" | "products" | "reset" | "dates" | "filters" | "ai" | "booking" | "stay" | "replay" | "errors";
const views: { id: View; label: string; description: string }[] = [
  { id: "inspect", label: "Inspect Twig", description: "Console values and capture-code drill-down, with supplemental data only when the preview omits details" },
  { id: "getaway", label: "Getaway search", description: "Integrated local destination and AI search" },
  { id: "planner", label: touchpointDefinitions.discovery.title, description: "Follow a successful conversation, encounter a wrong recommendation, and investigate the recorded evidence. No inference or network requests." },
  { id: "preview", label: "Twig views", description: "Read-only guide preview and interactive filter control" },
  { id: "saved", label: "Saved stay", description: "Exercise host-controlled auth, save, loading, disabled, and error states" },
  { id: "account", label: "Account", description: "Shared dropdown navigation, login, empty collections, and settings" },
  { id: "invite", label: "PostHog invitation", description: "Open and dismiss the playground invitation" },
  { id: "products", label: "Product menu", description: "Review flat Playground content and uniform 4px controls on every Twig page" },
  { id: "reset", label: "Playground reset", description: "Preview the confirmation shown before clearing Twig activity" },
  { id: "dates", label: "Booking details", description: "Review shared dropdowns with dates and guest choices" },
  { id: "filters", label: touchpointDefinitions.catalog.title, description: "Click Twig filters and inspect the locally recorded events" },
  { id: "ai", label: "AI inputs and outputs", description: "Run a local recommendation fixture through the lesson" },
  { id: "booking", label: touchpointDefinitions.booking.title, description: "Simulate a successful or failed booking" },
  { id: "stay", label: touchpointDefinitions.stay.title, description: "Open listings and compare view events" },
  { id: "replay", label: touchpointDefinitions.replay.title, description: "Review the replay lesson with local fixture controls" },
  { id: "errors", label: touchpointDefinitions.errors.title, description: "Book a local trip, navigate to Booked stays, and investigate its exception" },
];

function GetawayPreview() {
 const previewPhotos = { Forest: new URL("../assets/cabin.jpg", import.meta.url).href, Coast: new URL("../assets/coast.jpg", import.meta.url).href, City: new URL("../assets/city.jpg", import.meta.url).href };
 const previewStays = stays.map(stay => ({ ...stay, images: stay.images.map((image,index) => index === 0 ? { ...image, src: previewPhotos[stay.setting] } : image) }));
 const [mode,setMode]=useState<"destination"|"ai">("destination");
 const [preferences,setPreferences]=useState<GetawayPreferences>({destination:"",guests:"1",checkIn:"",checkOut:""});
 return <div className="vac-app twig-browser workbench-twig"><SearchWorkspace mode={mode} onModeChange={setMode}
   destination={<TripSearch value={preferences} onChange={setPreferences} onSubmit={()=>{}} capacity={5} minDate={new Date().toISOString().slice(0,10)} destinations={stays.map(stay=>stay.location??"")} />}
   assistant={<GetawaySearch stays={previewStays} preferences={preferences} onPreferencesChange={setPreferences} renderStayLink={stay=><a href={`#${stay.id}`}>View stay</a>}/>}/></div>;
}

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
      <p style={{ display: "flex", alignItems: "center", gap: 8 }}><AiSearchIcon /> AI search</p>
      <TripPlanner
        key={lab.revision}
        scenario={lab.lesson.capacityFixed ? "capacity-fixed" : undefined}
        stays={stays}
        windowAction={{ label: "Playground", onSelect: inspect }}
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
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [tripSearch, setTripSearch] = useState({ destination: "", checkIn: "", checkOut: "", guests: "1" });
  const [submitted, setSubmitted] = useState(tripSearch);
  const [amenities, setAmenities] = useState<StayAmenity[]>([]);
  return <>
    <div className="workbench-controls"><label>Selected guide preview <select value={selected} onChange={(event) => setSelected(event.target.value as typeof selected)}><option>Forest</option><option>Coast</option><option>City</option></select></label></div>
    <BrowseStaysPreview selected={selected} />
    <p>Interactive browse: full-width mobile fields, paired dates, optional filters, and Search stays at the end.</p>
    <div className="twig-browser workbench-twig"><main><BrowseStays activeFilterCount={Number(filter !== "All") + amenities.length} additionalFilters={<AmenityFilters value={amenities} onChange={(value, selected) => setAmenities(previous => selected ? [...previous, value] : previous.filter(item => item !== value))} />} primarySearch={filters => <TripSearch filters={filters} destinations={stays.flatMap(stay => stay.location ? [stay.location] : [])} value={tripSearch} minDate="2026-10-20" capacity={5} onChange={setTripSearch} onSubmit={() => setSubmitted(tripSearch)} />} results={filterStays(filter, submitted.destination).filter(stay => (stay.capacity ?? 0) >= Number(submitted.guests) && matchesStayAmenities(stay.amenities, amenities))} controlsExpanded={controlsExpanded} onControlsExpandedChange={setControlsExpanded} id="workbench-browse" setting={filter} search={search} onSettingChange={setFilter} onSearchChange={setSearch} renderStay={(stay) => <article className="vac-card" key={stay.id}><StayCardContent stay={stay} image={<div className="vac-image"><span>Photo on Twig.com</span></div>} /></article>} /><StayDetails stay={stays[0]} /></main></div>
  </>;
}

function DatePickerPreview() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [disabled, setDisabled] = useState(false);
  const today = "2026-10-16";
  return <div className="twig-browser workbench-twig" style={{ maxWidth: 460, padding: 24 }}>
    <div className="workbench-controls"><button onClick={() => { setCheckIn(""); setCheckOut(""); setGuests(""); }}>Clear details</button><button onClick={() => setDisabled(!disabled)}>{disabled ? "Enable" : "Disable"} booking controls</button></div>
    <label htmlFor="preview-check-in">Check in</label>
    <DatePicker id="preview-check-in" label="Check in" value={checkIn} minDate={today} disabled={disabled} onChange={(date) => { setCheckIn(date); if (checkOut && checkOut <= date) setCheckOut(""); }} />
    <label htmlFor="preview-check-out">Check out</label>
    <DatePicker id="preview-check-out" label="Check out" value={checkOut} minDate={checkIn ? addDateDays(checkIn, 1) : today} disabled={disabled} onChange={setCheckOut} />
    <label htmlFor="preview-guests">Guests</label>
    <GuestPicker id="preview-guests" value={guests} capacity={4} disabled={disabled} onChange={setGuests} />
    <p>{checkIn && checkOut ? `${checkIn} – ${checkOut}` : "Choose your dates."} {guests ? `· ${guests} ${guests === "1" ? "guest" : "guests"}` : ""}</p>
  </div>;
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

function InspectPreview() {
  const [open, setOpen] = useState(true);
  const [picking, setPicking] = useState(false);
  const [homeOpen, setHomeOpen] = useState(true);
  const [onboarding, setOnboarding] = useState<"stay" | "filter" | "another-stay" | "history" | "compare" | "compare-again" | "follow" | "reset" | "complete" | null>(null);
  const previousConsoleSelection = useRef<number | null>(null);
  const [feature, setFeature] = useState<"catalog" | "discovery" | "replay" | "errors">("catalog");
  const [activity, setActivity] = useState<PlaygroundActivity[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  return <div className="vac-app workbench-inspect-preview" data-open={open}>
    <PlaygroundToolRail joinedBranding page={playgroundPage("/", stays)} open={open} picking={picking} selectedId={feature} homeOpen={homeOpen} onHomeOpened={() => { setHomeOpen(true); setPicking(false); setOpen(true); }}
      onOpen={() => setOpen(true)} onCollapse={() => setOpen(false)} onPick={() => { setHomeOpen(false); setPicking(true); setOpen(true); }}
      onSelect={id => { setHomeOpen(false); setFeature(id as typeof feature); setOpen(true); setPicking(false); }} toggleRef={toggleRef} />
    <div className="workbench-controls" aria-label="Instrumentation markers">{playgroundPage("/", stays).touchpoints.map(point => <PlaygroundMarker key={point.id} touchpoint={point} highlighted={false} onHighlight={() => {}} onChoose={id => { setChosen(id); setOpen(true); }} />)}</div>
    {picking && <p role="status">Inspection observes normal Twig interactions. Simulate an event below to preview the live feed.</p>}
    <PlaygroundDock open={open} joinedBranding embedded={false} placement="edge" onClose={() => setOpen(false)} headingRef={headingRef}
      logo={<img src={new URL("../assets/posthog-logomark.svg", import.meta.url).href} width={26} height={26} alt="" />}
      navigation={null} recordingBar={null} pageKey="inspect"
      guide={homeOpen ? <PlaygroundHome onVisitLab={id => { setChosen(id); setHomeOpen(false); setPicking(false); }} onStart={() => { setHomeOpen(false); setPicking(true); setOnboarding("stay"); }} onInspect={() => { setOnboarding(null); setHomeOpen(false); setPicking(true); }} onSelect={id => { setHomeOpen(false); setPicking(false); setFeature(id as typeof feature); }} /> : <>
        {picking && onboarding && ["stay", "filter", "another-stay"].includes(onboarding) && <div className="workbench-controls"><button onClick={() => {
          const filtering = onboarding === "filter";
          setActivity(previous => [...previous, {id:previous.length+1,kind:filtering ? "catalog" : "stay",label:filtering ? "Setting selected" : "Stay viewed",event:filtering ? "twig_stay_filter_selected" : "twig_stay_viewed",detail:"",properties:filtering ? {setting:"Forest",result_count:1} : {stay_id:onboarding === "stay" ? "stay-01" : "stay-02"}}]);
          setOnboarding(onboarding === "stay" ? "filter" : filtering ? "another-stay" : "history");
        }}>Simulate {onboarding === "filter" ? "setting click" : "stay click"}</button></div>}
        <div className="workbench-controls"><button onClick={() => setActivity(previous => [...previous, { id: previous.length + 1, kind: "catalog" as const, label: "Setting selected", event: "twig_stay_filter_selected", detail: "setting: Forest", timestamp: new Date().toISOString(), properties: { setting: "Forest", result_count: 1 }, element: '<button aria-pressed="true">Forest</button>' }])}>Simulate Forest click</button><button onClick={() => setActivity(previous => {
          const operationId = `preview-${previous.length + 1}`;
          const generation = createGenerationRecord([{role:"user",content:"A forest getaway"}], [{role:"assistant",content:"stay-01"}], {sessionId:"preview-chat",traceId:operationId,generationId:`${operationId}-generation`,startedAt:Date.now()}, {scenario:"forest",turn_number:1,selected_stay_id:"stay-01",group_size:null,response_kind:"recommendation"}, 1.2, "Plan a getaway");
          return [...previous, {id:previous.length+1,kind:"discovery" as const,label:"AI response ready",event:"twig_ai_search_answered",detail:"",operationId,timestamp:generation.timestamp,properties:{outcome:"recommendation",result_count:1}}, {id:previous.length+2,kind:"discovery" as const,label:"AI generation",event:generation.event,detail:"",operationId,timestamp:generation.timestamp,properties:generation.properties}];
        })}>Simulate AI response</button></div>
        {chosen ? <p role="status">Host starts the {chosen} lab. Existing lesson flow is unchanged.</p> : picking ? <PlaygroundInspectionView onSessionChange={(_, action) => {
          if (action.type === "clear" && onboarding) { setOnboarding(onboarding === "reset" || onboarding === "complete" ? "complete" : "stay"); previousConsoleSelection.current = null; }
          if (action.type === "follow") { if (onboarding === "follow") setOnboarding("reset"); previousConsoleSelection.current = null; }
          if (action.type === "select") {
            if (action.id !== activity.at(-1)?.id && action.id !== previousConsoleSelection.current) setOnboarding(previous => previous === "history" ? "compare" : previous === "compare" ? "compare-again" : previous === "compare-again" ? "follow" : previous);
            previousConsoleSelection.current = action.id;
          }
        }} guidance={onboarding ? <PlaygroundOnboarding phase={onboarding} /> : undefined} onExitTour={onboarding ? () => { setOnboarding(null); setHomeOpen(true); setPicking(false); headingRef.current?.focus({ preventScroll: true }); } : undefined} describe={item => ({method:item.event === "$ai_generation" ? "generation" : "capture",description:item.event === "$ai_generation" ? "A simulated model call, connected to the planner outcome." : item.kind === "discovery" ? "Records whether AI search found a stay." : "A filter handler records the selected setting and result count.",question:"What did this interaction produce?",sources:[{path:"Example capture call",line:1,caption:"",code:item.event === "$ai_generation" ? 'posthog.capture({\n  distinctId: userId,\n  event: "$ai_generation",\n  properties: {\n    $ai_trace_id: traceId,\n    $ai_model: model,\n    $ai_input_tokens: inputTokens,\n    $ai_output_tokens: outputTokens,\n    $ai_latency: latencySeconds\n  }\n})' : item.kind === "discovery" ? 'posthog.capture(\n  "twig_ai_search_answered",\n  {\n    outcome: "recommendation",\n    result_count: 1\n  }\n)' : 'posthog.capture(\n  "twig_stay_filter_selected",\n  {\n    setting: "Forest",\n    result_count: 1\n  }\n)'},{path:'src/example-tracking.ts',line:12,label:'Event handler',highlightLines:[2],code:'function selectSetting(setting) {\n  trackTwigEvent("twig_stay_filter_selected", { setting });\n}'}]})} contexts={{discovery:{method:"capture",description:"AI feature usage is a product event; model calls have generation evidence.",question:"How did the model produce its response?",sources:[],aiExample:true}}} activity={activity} selectedId={feature} onSelect={id => setFeature(id as typeof feature)} choose={id => { setChosen(id); setPicking(false); }} /> : <ProductLabLanding selectedId={feature} choose={id => setChosen(id)} />}
      </>} />
  </div>;
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

function ProductMenuPreview() {
  const [menu, setMenu] = useState("home");
  const [pathname, setPathname] = useState("/about");
  const [selectedLab, setSelectedLab] = useState("");
  const page = playgroundPage(pathname, stays);
  return <LabPreview>
    <div className="workbench-controls">
      <label>Menu <select value={menu} onChange={(event) => setMenu(event.target.value)}>
        <option value="home">Home</option>
        <option value="directory">Other labs</option>
      </select></label>
      <label>Preview page <select value={pathname} onChange={(event) => setPathname(event.target.value)}>
        <option value="/">Find a stay</option>
        <option value="/about">About Twig</option>
        <option value="/stays/stay-01">Stay details</option>
        <option value="/profile/bookings">Booked stays</option>
      </select></label>
    </div>
    {menu === "home" ? <PlaygroundHome onInspect={() => setSelectedLab("Inspector")} onVisitLab={setSelectedLab} /> : <LabDirectory page={page} choose={setSelectedLab} showMarker={() => {}} onVisitLab={(id, startPage) => {
      setSelectedLab(id);
      setPathname(startPage === "discover" ? "/" : "/stays/stay-01");
    }} />}
    {selectedLab && <p role="status">Selected lab: {selectedLab}</p>}
  </LabPreview>;
}

function LessonNavigationPreview() {
  const [step, setStep] = useState(1);
  const [away, setAway] = useState(false);
  const props = { selected: "catalog" as const, stage: step, embedded: false, resetScope: "twig" as const, onAllLabs: () => setStep(0), onPrevious: () => setStep(Math.max(0, step - 1)), onReset: () => setStep(0), returnTo: away ? { label: "Find a stay", onClick: () => setAway(false) } : undefined };
  const headingRef = useRef<HTMLHeadingElement>(null);
  return <><div className="workbench-controls"><button onClick={() => setAway(!away)}>Toggle away state</button></div><PlaygroundDock embedded onClose={() => {}} headingRef={headingRef} logo={null} pageKey="reset-preview" navigation={<LabNavigationView {...props} placement="header" />} footer={<LabNavigationView {...props} placement="footer" />} recordingBar={null} guide={<><p>Lesson {step + 1}</p><LabPrimaryAction><button className="vac-button" onClick={() => setStep(step + 1)}><span className="vac-os-button-face">Continue →</span></button></LabPrimaryAction></>} /></>;
}

function ResetPreview() {
  const [resetCount, setResetCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [away, setAway] = useState(false);
  return <div className="vac-app"><div className="workbench-controls"><button type="button" onClick={() => setAway((value) => !value)}>{away ? "Show lab page" : "Show away state"}</button></div><div className="vac-developer-theme workbench-lab workbench-reset-preview">
    <LabNavigationView key={resetCount} selected="errors" stage={2} embedded={false} resetScope="twig" returnTo={away ? { label: "Booked stays", onClick: () => { setAway(false); setNotice("Returned to the lab page."); } } : undefined} onAllLabs={() => setNotice("All labs selected in this preview.")} onPrevious={() => setNotice("Previous step selected in this preview.")} onReset={() => { setResetCount((count) => count + 1); setAway(false); setNotice("Twig activity reset in this preview."); }} />
    {notice && <p role="status">{notice}</p>}
    <LessonNavigationPreview />
  </div></div>;
}

function Filters() {
  const [state, dispatch] = useReducer(eventsReducer, initialEventsState);
  const [setting, setSetting] = useState<StaySetting>("All");
  const [search, setSearch] = useState("");
  return <div className="vac-app">
    <div className="twig-browser workbench-twig"><BrowseStays setting={setting} search={search} onSearchChange={setSearch} onSettingChange={value => { setSetting(value); dispatch({ type: "click", setting: value, count: filterStays(value, search).length, timestamp: new Date().toISOString() }); }} renderStay={stay => <article className="vac-card" key={stay.id}><StayCardContent stay={stay} image={<div className="vac-image">Twig stay</div>} /></article>} /></div>
    <div className="workbench-controls"><button onClick={() => dispatch({ type: "reset" })}>Reset lesson</button><button disabled={!state.step} onClick={() => dispatch({ type: "previous" })}>Previous step</button></div>
    <div className="vac-developer-theme workbench-lab"><EventsExperienceSwitch state={state} dispatch={dispatch} /><EventsLab state={state} dispatch={dispatch} onChoose={() => dispatch({ type: "reset" })} /></div>
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

function ErrorTrackingPreviewContent() {
  const [stage, setStage] = useState(0);
  const [location, setLocation] = useState<"stay" | "bookings">("stay");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [displayedHost, setDisplayedHost] = useState<string | undefined>();
  const [canceled, setCanceled] = useState(false);
  const { state, dispatch } = useErrorTrackingLab();
  const booking: BookedStaySummary = { id: "workbench-trip", stay: stays[0], dateLabel: "Oct 20 – 23", guestsLabel: "2 guests", status: canceled ? "canceled" : "confirmed" };
  function bookStay() {
    dispatch({ type: "book", booking: { id: booking.id, stayId: booking.stay.id, stayTitle: booking.stay.title ?? "stay" } });
    setStage(2);
  }
  function openDetails() {
    setSelected(booking.id);
    if (canceled) { setError(false); return; }
    setError(!state.fixed);
    setDisplayedHost(state.fixed ? state.hostLookupRepaired ? "Woody" : "Host information unavailable" : undefined);
    if (state.hostLookupRepaired) dispatch({ type: "verify-host" });
    else if (state.fixed) dispatch({ type: "retry-success" });
    else {
      dispatch({ type: "capture", message: "Cannot read properties of undefined (reading 'name')", stayId: booking.stay.id });
      if (stage === 2) setStage(3);
    }
  }
  return <>
    <div className="workbench-controls"><button onClick={() => setLocation("stay")}>Stay page</button><button onClick={() => setLocation("bookings")}>Booked stays</button><button onClick={() => setStage((current) => Math.max(0, current - 1))} disabled={stage === 0}>Previous step</button></div>
    <div className="twig-browser workbench-twig" id="error-trip-fixture">{location === "stay"
      ? <section className="workbench-fixture"><h3>{booking.stay.title}</h3><p>Complete a booking on Twig to reach the details view.</p><button className="vac-button" onClick={bookStay} disabled={Boolean(state.booking)}>Book stay</button></section>
      : <BookedStaysView bookings={state.booking ? [booking] : []} renderImage={() => <div className="vac-image"><span>Stay photo</span></div>} stayHref={() => "#error-trip-fixture"} selectedBookingId={selected} highlightedTripDetailsBookingId={stage === 6 && state.successfulRetry && displayedHost === "Host information unavailable" ? booking.id : undefined} onViewDetails={openDetails} onCancelBooking={() => setCanceled(true)} renderDetails={() => <TripDetailsView booking={booking} hostName={displayedHost} errorMessage={error ? "Try to load details again." : undefined} onRetry={openDetails} />} />}</div>
    <LabPreview><ErrorTrackingLab stage={stage} onStage={setStage} location={location} onFocusBooking={() => document.querySelector(".workbench-fixture button")?.scrollIntoView({ behavior: "smooth" })} onFocusDetails={() => { setLocation("bookings"); document.querySelector(".twig-booking-details")?.scrollIntoView({ behavior: "smooth" }); }} /></LabPreview>
  </>;
}
function ErrorTrackingPreview() { return <ErrorTrackingLabProvider active><ErrorTrackingPreviewContent /></ErrorTrackingLabProvider>; }

export default function App() {
  const [view, setView] = useState<View>(() => new URLSearchParams(window.location.search).get("view") === "planner" ? "planner" : "preview");
  const current = views.find((item) => item.id === view)!;
  return <div className="workbench-shell"><aside className="workbench-sidebar"><span className="workbench-eyebrow">@posthog/twig-components</span><h1>Workbench</h1><p>Build and inspect components in the browser.</p><nav aria-label="Component previews">{views.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}>{item.label}</button>)}</nav><small>Local fixtures only. No PostHog account or event upload.</small></aside><main><header><span className="workbench-eyebrow">Live preview</span><h2>{current.label}</h2><p>{current.description}</p></header><div className="workbench-preview" key={view}>{view === "inspect" ? <InspectPreview /> : view === "getaway" ? <GetawayPreview /> : view === "planner" ? <TripPlannerPreview /> : view === "preview" ? <Preview /> : view === "saved" ? <SavedStayPreview /> : view === "account" ? <AccountPreview /> : view === "invite" ? <InvitationPreview /> : view === "products" ? <ProductMenuPreview /> : view === "reset" ? <ResetPreview /> : view === "dates" ? <DatePickerPreview /> : view === "filters" ? <Filters /> : view === "ai" ? <Ai /> : view === "booking" ? <Booking /> : view === "stay" ? <Stay /> : view === "errors" ? <ErrorTrackingPreview /> : <Replay />}</div></main></div>;
}
