"use client";
import {useExperienceRuntime} from "../Runtime.js";

import Link, { useTwigPreview } from "./TwigNavigation.js";
import {createPlannerEvidenceSession} from "../lib/twig-ai-observability.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaygroundLab } from "../../PlaygroundController.js";
import { GetawaySearch, SearchWorkspace, type GetawayPreferences } from "../../TripPlanner.js";
import { AmenityFilters, type StayAmenity, type StaySetting } from "../../StayFilters.js";
import { BrowseStays, TripSearch } from "../../BrowseStays.js";
import { discoveryCopy, stays } from "../lib/vacation/catalog.js";
import { todayAtStay, type TripErrors } from "../lib/vacation/trip-dates.js";
import { searchTripStays, validateTripSearch } from "../lib/vacation/trip-search.js";
import { useBookingLab } from "./BookingLab.js";
import { Marker, usePlayground } from "./Playground.js";
import { useFilterLab } from "./FilterLab.js";
import { useEventsLab } from "../../EventsLabProvider.js";
import { needsConfiguration } from "../../events-lab.js";
import { AiTripPlanner } from "./AiLab.js";
import { StayCard } from "./StayCard.js";


export default function Discover() {
  const { state } = useEventsLab();
  return (
    <main id="vac-main" className="vac-main vac-discover-page">
      <section className="vac-discovery" aria-labelledby="discover-title">
        <div className="vac-discovery-content">
          <div>
            <h1 id="discover-title">{discoveryCopy.title}</h1>
            <p className="vac-intro">{discoveryCopy.introduction}</p>
          </div>
        </div>
      </section>
      <StayBrowser key={state.revision} />
    </main>
  );
}

function StayBrowser() {
const {publishPlannerGeneration,trackTwigEvent,trackTwigLabInteraction}=useExperienceRuntime();

  const preview = useTwigPreview();
  const plannerEvidence = useRef<ReturnType<typeof createPlannerEvidenceSession> | null>(null);
  const [mode, setMode] = useState<"destination" | "ai">("destination");
  const revealPlanner = useCallback(() => setMode("ai"), []);
  const [aiPreferences, setAiPreferences] = useState<GetawayPreferences | null>(null);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const { selected } = usePlaygroundLab();
  const { open: playgroundOpen, inspecting, lessonActive } = usePlayground();
  const guidedAi = selected === "discovery" && lessonActive;
  useEffect(() => {
    if (!lessonActive || !playgroundOpen || !selected || selected === "discovery") return;
    const frame = requestAnimationFrame(() => setMode("destination"));
    return () => cancelAnimationFrame(frame);
  }, [selected, playgroundOpen, lessonActive]);
  useEffect(() => {
    if (!lessonActive || selected !== "catalog" || !playgroundOpen) return;
    const frame = requestAnimationFrame(() => setControlsExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, [selected, playgroundOpen, lessonActive]);
  const [setting, setSetting] = useState<StaySetting>("All");
  const [amenities, setAmenities] = useState<StayAmenity[]>([]);
  const { active: labActive, recordFilter } = useFilterLab();
  const eventsLab = useEventsLab();
  const eventsActive = eventsLab.active && eventsLab.state.step >= 1 && eventsLab.state.step <= 5 && !needsConfiguration(eventsLab.state);
  const booking = useBookingLab();
  const [draft, setDraft] = useState(() => ({ destination: "", ...booking.trip, guests: booking.trip.guests || "1" }));
  const [applied, setApplied] = useState(draft);
  const [errors, setErrors] = useState<TripErrors>({});
  const [today] = useState(todayAtStay);
  const capacity = Math.max(...stays.map(stay => stay.capacity ?? 0));
  const conversationPreferences: GetawayPreferences = aiPreferences ?? {
    ...draft,
    setting: setting === "All" ? undefined : setting,
    amenities: amenities.map(value => ({ "beach-access": "Beach access", "fire-pit": "Fireplace / fire pit", "lake-access": "Lake access via a walking path" })[value]),
  };
  const results = searchTripStays(setting, applied, amenities);
  return (
      <BrowseStays
        primarySearch={filters => <div className="vac-search-inspection">
          {inspecting && <div className="vac-search-inspection-markers"><Marker id="catalog" inspectionOnly /><Marker id="discovery" inspectionOnly /></div>}
          <SearchWorkspace mode={mode} onModeChange={next => {
          setMode(next);
          trackTwigEvent(
            "twig_ai_search_toggled",
            {
              expanded: next === "ai"
            }
          );
        }} assistant={<>
          <div hidden={guidedAi}>
            <GetawaySearch portalRoot={preview?.portalRoot} windowClassName={playgroundOpen ? "vac-getaway-alongside-playground" : undefined} hidden={guidedAi} onChatVisibilityChange={expanded => trackTwigEvent(
              "twig_ai_chat_toggled",
              {
                expanded
              }
            )} stays={stays} preferences={conversationPreferences}
              onPreferencesChange={setAiPreferences}
              onReset={() => { plannerEvidence.current = null; }}
              onOutcome={reply => {
                plannerEvidence.current ??= createPlannerEvidenceSession();
                const generation = plannerEvidence.current(reply.kind, reply.recommendations.map(item => item.stayId));
                trackTwigEvent(
                  "twig_ai_search_answered",
                  {
                    outcome: reply.kind,
                    result_count: reply.recommendations.length
                  },
                  {
                    operationId: generation.properties.$ai_trace_id
                  }
                );
                publishPlannerGeneration(
                  generation,
                  reply.recommendations.map(item => item.stayId)
                );
              }}
              renderStayLink={stay => <Link href={`/stays/${stay.id}`} onClick={() => {
                booking.setTrip({ checkIn: conversationPreferences.checkIn, checkOut: conversationPreferences.checkOut, guests: conversationPreferences.guests });
                booking.dispatch({ type: "invalidate" });
                trackTwigEvent(
                  "twig_ai_recommendation_opened",
                  {
                    stay_id: stay.id
                  }
                );
              }}>View stay →</Link>}
            />
          </div>
          <AiTripPlanner hidden={mode !== "ai" || !guidedAi} onReveal={revealPlanner} />
        </>} destination={<>
          <TripSearch
          filters={filters}
          destinations={stays.flatMap(stay => stay.location ? [stay.location] : [])}
          onDestinationSelect={location => {
            const stay = stays.find(stay => stay.location === location);
            if (stay) trackTwigEvent(
              "twig_destination_suggestion_selected",
              {
                stay_id: stay.id
              }
            );
          }}
          value={draft}
          minDate={today}
          capacity={capacity}
          errors={errors}
          onChange={value => { setDraft(value); setErrors({}); }}
          onSubmit={() => {
            const nextErrors = validateTripSearch(draft, capacity, todayAtStay());
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) {
              trackTwigEvent(
                "twig_trip_search_submitted",
                {
                  outcome: "invalid",
                  result_count: 0
                }
              );
              requestAnimationFrame(() => (preview?.portalRoot.getRootNode() as ShadowRoot ?? document).querySelector<HTMLElement>('.vac-trip-search [aria-invalid="true"]')?.focus());
              return;
            }
            const next = { ...draft, destination: draft.destination.trim() };
            setApplied(next);
            booking.setTrip({ checkIn: next.checkIn, checkOut: next.checkOut, guests: next.guests });
            booking.dispatch({ type: "invalidate" });
            const count = searchTripStays(setting, next, amenities).length;
            trackTwigEvent(
              "twig_trip_search_submitted",
              {
                outcome: count
                  ? "results"
                  : "empty",
                result_count: count
              }
            );
          }}
        /></>} /></div>}
        activeFilterCount={Number(setting !== "All") + amenities.length}
        additionalFilters={<AmenityFilters value={amenities} onChange={(amenity, selected) => {
          const next = selected ? [...amenities, amenity] : amenities.filter(value => value !== amenity);
          setAmenities(next);
          trackTwigEvent(
            "twig_stay_amenity_toggled",
            {
              amenity,
              selected,
              result_count: searchTripStays(setting, applied, next).length
            }
          );
        }} />}
        results={results}
        controlsExpanded={controlsExpanded}
        onControlsExpandedChange={(expanded) => {
          setControlsExpanded(expanded);
          trackTwigEvent(
            "twig_stay_controls_toggled",
            {
              expanded
            }
          );
        }}
        setting={setting}
        search={applied.destination}
        onSearchChange={destination => setDraft(previous => ({ ...previous, destination }))}
        filtersId="stay-setting-filters"
        filtersClassName={labActive || eventsActive ? "vac-lab-target" : undefined}
        filterAccessory={<Marker id="catalog" />}
        onSettingChange={(value) => {
          const intercepted = eventsLab.active ? false : recordFilter(value);
          const resultCount = searchTripStays(value, applied, amenities).length;
          trackTwigEvent(
            "twig_stay_filter_selected",
            {
              setting: value,
              result_count: resultCount,
              in_lab: labActive,
              applied_to_results: !intercepted,
            }
          );
          if (labActive) {
            trackTwigLabInteraction(
              "catalog",
              "filter_selected",
              intercepted ? "target_selected" : "applied"
            );
          }
          if (eventsActive) {
            eventsLab.dispatch({
              type: "click",
              setting: value,
              count: resultCount,
              timestamp: new Date().toISOString(),
            });
          }
          if (!intercepted) {
            setSetting(value);
          }
        }}
        renderStay={(stay) => <StayCard key={stay.id} stay={stay} linked eager />}
      />
  );
}
