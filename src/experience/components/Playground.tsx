"use client";
import {useExperienceRuntime} from "../Runtime.js";

import { TripPlannerLabProvider } from "../../TripPlannerLab.js";
import { onboardingReducer, type OnboardingPhase } from "../lib/vacation/playground-onboarding.js";

import { StayLabProvider } from "./StayLab.js";
import { ReplayProvider, ReplayRecordingBar } from "./ReplayLab.js";
import Link from "./TwigNavigation.js";
import {
  PlaygroundGuide,
  FilterLabProvider,
  useFilterLab,
  LabNavigation,
} from "./FilterLab.js";
import Image from "./TwigImage.js";
import { usePathname, useRouter, useTwigPreview } from "./TwigNavigation.js";
import { stays } from "../lib/vacation/catalog.js";
import { accountLinks, loginHref } from "../lib/vacation/account-links.js";
import {twigPageKind} from "../lib/twig-analytics.js";
import {
  playgroundPage,
  touchpointDefinitions,
  type LabStartPage,
  type PlaygroundPage,
  type TouchpointId,
} from "../lib/vacation/playground.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { usePlaygroundLab } from "../../PlaygroundController.js";
import "../../lab.css";
import { PlaygroundMarker, PlaygroundDock, PlaygroundToolRail, PlaygroundHome, PlaygroundOnboarding, initialInspectionSession, type InspectionSessionState, type InspectionSessionAction, type PlaygroundActivity } from "../../PlaygroundPanels.js";
import { ProfileMenu } from "../../Account.js";
import { DemoAccountProvider, useDemoAccount } from "./DemoAccount.js";

import { isLabResumeLocation, labResumePath, labStartPath } from "../lib/vacation/lab-reset.js";

const PlaygroundContext = createContext<{
  open: boolean;
  inspecting: boolean;
  lessonActive: boolean;
  onboarding: OnboardingPhase;
  page: PlaygroundPage | null;
  startLab: (id: TouchpointId) => void;
  openPlayground: () => void;
}>({ open: false, inspecting: false, lessonActive: false, onboarding: "idle", page: null, startLab: () => {}, openPlayground: () => {} });

export function usePlayground() { return useContext(PlaygroundContext); }

export function Marker({ id, inspectionOnly = false }: { id: TouchpointId; inspectionOnly?: boolean }) {
const {trackTwigLabStarted}=useExperienceRuntime();

  const { open, inspecting, page, startLab, lessonActive } = useContext(PlaygroundContext);
  const authorPreview = !!useTwigPreview();
  const { highlighted, highlight, selected, stage } = useFilterLab();
  const touchpoint = page?.touchpoints.find((item) => item.id === id)
    ?? (page?.kind === "bookings" && id === "errors" && selected === "errors" && stage > 0
      ? { id: "errors" as const, number: 1, ...touchpointDefinitions.errors }
      : undefined);
  if (authorPreview || (!open && !inspecting) || !touchpoint) return null;
  if (inspectionOnly ? !inspecting : inspecting && (id === "catalog" || id === "discovery")) return null;
  return (
    <PlaygroundMarker
      touchpoint={touchpoint}
      highlighted={highlighted === id || selected === id}
      onHighlight={highlight}
      onChoose={(chosen) => {
        if (!lessonActive || selected !== chosen) {
          if (selected !== chosen) trackTwigLabStarted(chosen, twigPageKind(page?.kind ?? null), "marker");
          startLab(chosen);
        }
        document.getElementById("twig-playground")?.scrollIntoView({ block: "nearest" });
      }}
    />
  );
}

function InspectionActivityBridge({ onActivity }: { onActivity: (action: Omit<PlaygroundActivity, "id">) => void }) {
const {observeInspectionActivity}=useExperienceRuntime();

  useEffect(() => {
    return observeInspectionActivity(onActivity);
  }, [onActivity]);
  return null;
}

function PlaygroundLabState({ children }: {
  children: (selected: TouchpointId | null, stage: number) => ReactNode;
}) {
  const { selected, stage } = usePlaygroundLab();
  return <>{children(selected, stage)}</>;
}

function RestoreErrorLab({ onRestore }: { onRestore: () => void }) {
  const account = useDemoAccount();
  const { choose } = usePlaygroundLab();
  const checked = useRef(false);
  useEffect(() => {
    if (!account.ready || checked.current) return;
    checked.current = true;
    if (account.errorTracking.stage > 0 && account.errorTracking.stage < 10) {
      choose("errors");
      onRestore();
    }
  }, [account.ready, account.errorTracking.stage, choose, onRestore]);
  return null;
}

function EventsLayoutMarker({ active }: { active: boolean }) {
  const { selected } = useFilterLab();
  useEffect(() => {
    const workspace = document.querySelector(".vac-workspace");
    workspace?.classList.toggle("vac-events-open", active && selected === "catalog");
    return () => workspace?.classList.remove("vac-events-open");
  }, [selected, active]);
  return null;
}

type AuthorLabPreview = import("../../TwigExperience.js").AuthorLabPreview;
export function VacationShell({ children, authorLab }: { children: ReactNode; authorLab?: AuthorLabPreview }) {
  return <DemoAccountProvider><VacationShellContent authorLab={authorLab}>{children}</VacationShellContent></DemoAccountProvider>;
}

function VacationShellContent({ children, authorLab }: { children: ReactNode; authorLab?: AuthorLabPreview }) {
const {trackTwigEvent,trackTwigLabStarted,capturePlaygroundLabResume,capturePlaygroundLabVisit,capturePlaygroundReset,initTwigErrorTracking}=useExperienceRuntime();

  const pathname = usePathname();
  const router = useRouter();
  const account = useDemoAccount();
  const { resetBrowserState } = account;
  useEffect(() => { initTwigErrorTracking(); }, []);
  const page = playgroundPage(pathname, stays);
  const authorPreview = !!useTwigPreview();
  const [requestedOpen, setOpen] = useState(true);
  const open = requestedOpen && (!authorPreview || !!authorLab);
  const [authorToolOpen, setAuthorToolOpen] = useState(false);
  const showingAuthorLab = !!authorLab && !authorToolOpen;
  const [inspectionMode, setInspectionMode] = useState(false);
  const [inspectionId, setInspectionId] = useState<TouchpointId | null>(null);
  const [exploring, setExploring] = useState(true);
  const [homeOpen, setHomeOpen] = useState(true);
  const [onboarding, dispatchOnboarding] = useReducer(onboardingReducer, "idle");
  const pickerRef = useRef<HTMLButtonElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingLab, setPendingLab] = useState<{ id: TouchpointId; path: string } | null>(null);
  const [labOriginPath, setLabOriginPath] = useState("/");
  const [resetEpoch, setResetEpoch] = useState(0);
  const freshLabTarget = useRef<{ id: TouchpointId; path: string } | null>(null);
  const [inspectionActivity, setInspectionActivity] = useState<PlaygroundActivity[]>([]);
  const [inspectionSession, setInspectionSession] = useState(initialInspectionSession);
  function updateInspectionSession(next: InspectionSessionState, action: InspectionSessionAction) {
    if (action.type === "clear") {
      trackTwigEvent("twig_playground_inspector_console_cleared", {});
      dispatchOnboarding({ type: "clear" });
    }
    if (open && inspectionMode && !homeOpen) {
      if (action.type === "select" && action.id !== inspectionActivity.at(-1)?.id && (inspectionSession.followLatest || action.id !== inspectionSession.selectionId)) dispatchOnboarding({ type: "select-earlier" });
      if (action.type === "follow") dispatchOnboarding({ type: "follow" });
    }
    setInspectionSession(next);
  }
  const inspectionSequence = useRef(0);
  const recordInspection = useCallback((action: Omit<PlaygroundActivity, "id">) => {
    const item = { ...action, id: ++inspectionSequence.current };
    setInspectionActivity(previous => [...previous, item]);
    if (open && inspectionMode && !homeOpen) dispatchOnboarding({ type: "activity", event: action.event });
  }, [open, inspectionMode, homeOpen]);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dockHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!homeOpen || !open) return;
    document.querySelector("#twig-playground .vac-dock-scroll")?.scrollTo({ top: 0 });
    if (!window.matchMedia("(max-width: 800px)").matches) return;
    // Let the expanding mobile panel settle before bringing Home into view.
    const timer = window.setTimeout(() => document.getElementById("twig-playground")?.scrollIntoView({ block: "start" }), 260);
    return () => window.clearTimeout(timer);
  }, [homeOpen, open]);
  const previousOnboarding = useRef<OnboardingPhase>("idle");
  useEffect(() => {
    if (previousOnboarding.current === onboarding) return;
    previousOnboarding.current = onboarding;
    if (onboarding === "filter" || onboarding === "history" || onboarding === "follow" || onboarding === "reset" || onboarding === "complete") {
      trackTwigEvent("twig_playground_onboarding", { step: onboarding === "filter" ? "stay_captured" : onboarding === "history" ? "history_ready" : onboarding === "follow" ? "history_explored" : onboarding === "reset" ? "live_tracking_resumed" : "console_reset" });
      document.querySelector("#twig-playground .vac-dock-scroll")?.scrollTo({ top: 0 });
      if (window.matchMedia("(max-width: 800px)").matches) document.getElementById("twig-playground")?.scrollIntoView({ block: "start" });
    }
  }, [onboarding]);
  useEffect(() => {
    if (!open || homeOpen || !inspectionMode || !["stay", "filter", "another-stay"].includes(onboarding)) return;
    let target: HTMLElement | null = null;
    let secondFrame = 0;
    const updateTarget = () => {
      const selector = onboarding === "filter"
        ? pathname === "/" ? '.vac-browse-toggle[aria-expanded="false"], #stay-setting-filters button[aria-pressed="false"]' : '.vac-back'
        : pathname === "/" ? '.vac-card a[href^="/stays/"]' : '.vac-back';
      const next = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(element => element.getClientRects().length) ?? null;
      if (next === target || !next?.getClientRects().length) return;
      target?.classList.remove("vac-lab-target");
      const firstTarget = !target;
      target = next;
      target.classList.add("vac-lab-target");
      if (firstTarget) {
        target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        target.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(updateTarget);
    const content = document.querySelector(".vac-content");
    if (content) observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-expanded"] });
    const frame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(updateTarget); });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); observer.disconnect(); target?.classList.remove("vac-lab-target"); };
  }, [onboarding, open, homeOpen, inspectionMode, pathname]);
  const moveFocus = useRef(false);
  const openedAt = useRef<number | null>(null);
  const startFreshLab = useCallback((id: TouchpointId, path: string) => {
    resetBrowserState();
    dispatchOnboarding({ type: "dismiss" });
    setHomeOpen(false);
    setInspectionMode(false);
    setInspectionId(id);
    setExploring(false);
    setLabOriginPath(path);
    setPendingLab({ id, path });
    setResetEpoch((epoch) => epoch + 1);
    setOpen(true);
    setProfileOpen(false);
  }, [resetBrowserState]);
  useLayoutEffect(() => {
    const target = freshLabTarget.current;
    if (!target || pathname !== target.path) return;
    freshLabTarget.current = null;
    startFreshLab(target.id, target.path);
  }, [pathname, startFreshLab]);
  useEffect(() => {
    if (!moveFocus.current) return;
    (open ? dockHeadingRef.current : window.matchMedia("(max-width: 800px)").matches ? pickerRef.current : toggleRef.current)?.focus({
      preventScroll: true,
    });
    moveFocus.current = false;
  }, [open, pathname]);
  const launch = useCallback(() => {
    if (open) { dockHeadingRef.current?.focus({ preventScroll: true }); return; }
    openedAt.current = Date.now();
    trackTwigEvent("twig_playground_opened", {
      page_kind: twigPageKind(page.kind),
      entry_point: "inspect_launcher",
    });
    moveFocus.current = true;
    setOpen(true);
  }, [page.kind, open]);
  function selectProduct(id: TouchpointId, source: "rail" | "home" = "rail") {
    if (authorLab?.onProductSelect) {
      authorLab.onProductSelect(touchpointDefinitions[id].tool);
      setAuthorToolOpen(false); setHomeOpen(false); setInspectionMode(false); setOpen(true);
      return;
    }
    setAuthorToolOpen(true);
    setHomeOpen(false);
    setInspectionMode(false);
    setExploring(true);
    setInspectionId(id);
    trackTwigEvent("twig_playground_inspection_selected", { lab_id: id, source });
    if (!open) launch();
    else { dockHeadingRef.current?.focus({ preventScroll: true }); }
    if (window.matchMedia("(max-width: 800px)").matches) requestAnimationFrame(() => document.getElementById("twig-playground")?.scrollIntoView({ block: "start" }));
  }
  function openInspector() {
    setAuthorToolOpen(true);
    setHomeOpen(false);
    if (!inspectionMode || !open) trackTwigEvent("twig_playground_inspector_opened", { page_kind: twigPageKind(page.kind) });
    setInspectionMode(true);
    setExploring(true);
    launch();
  }
  function startOnboarding() {
    if (onboarding === "idle" || onboarding === "complete") trackTwigEvent("twig_playground_onboarding", { step: "started" });
    dispatchOnboarding({ type: "start" });
    setInspectionSession(previous => ({ ...previous, followLatest: true }));
    openInspector();
    if ((onboarding === "idle" || onboarding === "complete") && pathname !== "/") router.push("/");
  }
  function dismissOnboarding() {
    if (onboarding !== "idle") trackTwigEvent("twig_playground_onboarding", { step: "dismissed" });
    dispatchOnboarding({ type: "dismiss" });
    setHomeOpen(true);
    setInspectionMode(false);
    setExploring(true);
    launch();
  }
  function close() {
    if (openedAt.current !== null) {
      trackTwigEvent("twig_playground_closed", {
        page_kind: twigPageKind(page.kind),
        duration_ms: Math.max(0, Date.now() - openedAt.current),
      });
      openedAt.current = null;
    }
    moveFocus.current = true;
    setOpen(false);
  }
  function visitLab(id: TouchpointId, startPage: LabStartPage) {
    const path = startPage === "discover" ? "/" : `/stays/${stays[0].id}`;
    capturePlaygroundLabVisit(id, page.kind ?? "other", startPage);
    trackTwigLabStarted(id, twigPageKind(page.kind), "directory");
    if (pathname === path) startFreshLab(id, path);
    else {
      freshLabTarget.current = { id, path };
      router.push(path);
    }
  }
  function startLab(id: TouchpointId) {
    startFreshLab(id, pathname);
  }
  function resetTwigAndRestartLab(id: TouchpointId) {
    capturePlaygroundReset(id);
    const path = labStartPath(id, stays[0].id);
    if (pathname === path) startFreshLab(id, path);
    else {
      freshLabTarget.current = { id, path };
      router.replace(path);
    }
  }

  function returnToLab(id: TouchpointId, path: string) {
    capturePlaygroundLabResume(id, page.kind ?? "other", playgroundPage(path, stays).kind ?? "other");
    moveFocus.current = true;
    setOpen(true);
    router.push(path);
  }

  return (
    <ReplayProvider key={resetEpoch} open={open && !exploring && page.kind !== "bookings"}>
      <StayLabProvider open={open && !exploring && page.kind !== "bookings"}>
        <FilterLabProvider
          pendingSelection={pendingLab?.path === pathname ? pendingLab.id : null}
          onPendingSelectionConsumed={() => setPendingLab(null)}
          active={open && !exploring && page.kind === "discover"}
          bookingEnabled={open && !exploring && page.kind === "stay"}
          errorTrackingEnabled={open && !exploring}
          errorTrackingSession={account.errorTracking}
          onErrorTrackingAction={account.dispatchErrorTracking}
          onErrorTrackingStageChange={account.setErrorTrackingStage}
        >
          <TripPlannerLabProvider>
          <PlaygroundLabState>
            {(selected, stage) => {
              const visibleOpen = open;
              const resumePath = selected
                ? labResumePath(selected, stage, labOriginPath, Boolean(account.errorTracking.state.booking))
                : null;
              const resumePage = resumePath ? playgroundPage(resumePath, stays) : null;
              const resumeLabel = resumePage?.kind === "stay"
                ? stays.find((stay) => stay.id === resumePage.stayId)?.title ?? "the stay"
                : resumePage?.label ?? "lab";
              const awayFromLab = Boolean(selected && resumePath && !isLabResumeLocation(selected, stage, pathname, resumePath));
              return <PlaygroundContext.Provider value={{ open: visibleOpen, inspecting: inspectionMode && visibleOpen, lessonActive: !exploring, onboarding: open && inspectionMode && !homeOpen ? onboarding : "idle", page, startLab: id => {
                setHomeOpen(false);
                if (selected === id) {
                  capturePlaygroundLabResume(id, page.kind ?? "other", page.kind ?? "other");
                  setInspectionMode(false); setExploring(false); setOpen(true);
                } else startLab(id);
              }, openPlayground: launch }}>
              {!authorPreview && <RestoreErrorLab onRestore={() => {
                setLabOriginPath(labStartPath("errors", stays[0].id));
                setOpen(true);
              }} />}
              <EventsLayoutMarker active={!exploring} />
              <InspectionActivityBridge onActivity={recordInspection} />
            <div data-inspecting={inspectionMode ? "true" : undefined} className={`vac-app${authorPreview && !authorLab ? "" : " vac-edge-playground vac-has-tool-rail"}${visibleOpen ? " vac-edge-playground-open" : ""}${pathname === "/about" ? " vac-app-about" : ""}`}>
              <a className="vac-skip" href="#vac-main">
                Skip to content
              </a>
              <header className={`vac-header${visibleOpen ? " vac-header-dock-open" : ""}`}>
                <Link
                  href="/"
                  className="vac-wordmark"
                  aria-label="Twig · Find a stay"
                >
                  twig
                </Link>
                <nav aria-label="Twig">
                  <Link
                    data-replay-label="Navigate: Find a stay"
                    href="/"
                    aria-current={pathname === "/" ? "page" : undefined}
                  >
                    Find a stay
                  </Link>
                  <Link
                    href="/about"
                    aria-current={pathname === "/about" ? "page" : undefined}
                  >
                    About Twig
                  </Link>
                  {account.ready && account.signedIn ? (
                    <ProfileMenu
                      profile={{ displayName: account.settings.displayName, email: account.settings.email }}
                      links={accountLinks}
                      open={profileOpen}
                      onOpenChange={setProfileOpen}
                      onNavigate={(href) => router.push(href)}
                      onSignOut={() => {
                        account.logout();
                        setProfileOpen(false);
                        router.push("/");
                      }}
                    />
                  ) : account.ready ? (
                    <Link
                      className="twig-profile-trigger twig-profile-login-trigger"
                      href={loginHref(pathname)}
                    >
                      Log in
                    </Link>
                  ) : (
                    <span className="vac-profile-loading" aria-hidden="true" />
                  )}
                </nav>
              </header>
              {(!authorPreview || authorLab) && <PlaygroundToolRail
                joinedBranding
                page={page} open={visibleOpen} picking={inspectionMode}
                homeOpen={!showingAuthorLab && homeOpen}
                onHomeOpened={() => {
                  if (!homeOpen || !open) trackTwigEvent("twig_playground_home_opened", { source: "logo" });
                  setAuthorToolOpen(true); setHomeOpen(true); setInspectionMode(false); setExploring(true); launch();
                }}
                productSelection={!!authorLab?.onProductSelect}
                selectedId={showingAuthorLab ? (Object.keys(touchpointDefinitions) as TouchpointId[]).find(id => touchpointDefinitions[id].tool === authorLab?.product) ?? null : selected && !exploring ? selected : inspectionId ?? (page.kind === "stay" ? "stay" : "catalog")}
                toggleRef={toggleRef} pickerRef={pickerRef}
                onOpen={() => { if (!exploring && selected && resumePath && awayFromLab) returnToLab(selected, resumePath); else launch(); }}
                onCollapse={close}
                onPick={openInspector}
                onSelect={selectProduct}
              />}
              <div className={`vac-workspace${visibleOpen ? " vac-dock-open" : ""}`}>
                <div className="vac-content">
                  {visibleOpen &&
                    page.touchpoints.some((point) => point.id === "replay") && (
                      <div className="vac-page-replay-marker">
                        <Marker id="replay" />
                      </div>
                    )}
                  {children}
                </div>
                  {authorLab && showingAuthorLab && <PlaygroundDock headingRef={dockHeadingRef} recordingBar={null} open={visibleOpen} joinedBranding placement="edge" embedded={false} closeOnEscape={false} onClose={close} headerActions={authorLab.headerActions} navigation={authorLab.navigation ?? <span>{authorLab.progress}</span>} guide={authorLab.content} footer={authorLab.footer} pageKey={authorLab.progress} logo={<Image src="/twig/posthog-logomark.svg" width={30} height={30} alt="" />} />}
                  {(!authorPreview || (authorLab && authorToolOpen)) && <PlaygroundDock
                    open={visibleOpen}
                    joinedBranding
                    placement="edge"
                    embedded={false}
                    closeOnEscape={!authorLab}
                    onClose={close}
                    headingRef={dockHeadingRef}
                    logo={<Image src="/twig/posthog-logomark.svg" width={30} height={30} alt="" />}
                    footer={authorLab ? <footer className="vac-lesson-footer"><button type="button" className="vac-text-button" onClick={() => { setAuthorToolOpen(false); setInspectionMode(false); setOpen(true); }}>← Back to lab</button></footer> : !exploring && selected ? <LabNavigation placement="footer" pageKind={twigPageKind(page.kind)} onResetTwig={resetTwigAndRestartLab} returnTo={selected && resumePath && awayFromLab ? { label: resumeLabel, onClick: () => returnToLab(selected, resumePath) } : undefined} /> : undefined}
                    navigation={exploring ? null : <LabNavigation
                      placement="header"
                      pageKind={twigPageKind(page.kind)}
                      onResetTwig={resetTwigAndRestartLab}
                      returnTo={selected && resumePath && awayFromLab ? {
                        label: resumeLabel,
                        onClick: () => returnToLab(selected, resumePath),
                      } : undefined}
                    />}
                    recordingBar={exploring ? null : <ReplayRecordingBar />}
                    pageKey={page.key}
                    guide={homeOpen ? <PlaygroundHome onVisitLab={visitLab} onStart={startOnboarding} onInspect={openInspector} onSelect={id => selectProduct(id, "home")} /> : <PlaygroundGuide onExitTour={inspectionMode && onboarding !== "idle" ? dismissOnboarding : undefined} inspectionGuidance={inspectionMode && onboarding !== "idle" ? <PlaygroundOnboarding phase={onboarding} /> : undefined} inspectionSession={inspectionSession} onInspectionSessionChange={updateInspectionSession} inspectionOnly={inspectionMode} activity={inspectionActivity} inspectionId={inspectionId} exploring={exploring} onInspectionChange={setInspectionId} page={page} onVisitLab={visitLab} onStartLab={startLab} />}
                  />}
              </div>
            </div>
              </PlaygroundContext.Provider>;
            }}
          </PlaygroundLabState>
          </TripPlannerLabProvider>
        </FilterLabProvider>
      </StayLabProvider>
    </ReplayProvider>
  );
}
