# Component reference

Import only the pieces you need from `@posthog/twig-components/<path>`. React is a peer dependency: the host supplies React 18 or 19. Import `catalog.css` for Twig views and `lab.css` for the playground. See [integration](integration.md) for styling and update boundaries. All existing and new UI must follow the approved [visual system](design-system.md); this reference does not authorize alternate styling or host overrides.

“Used in Twig” describes the Twig.com integration. Twig.com pins an exact package build (currently its checked-in local brand archive; see the host README), while the PostHog 101 guide integration is still in progress.

## Website views and data

| Import path | Export | What it does | Used in Twig / what the host supplies |
| --- | --- | --- | --- |
| `/trip-planner` | `TripPlanner`, `TripPlannerProps`, `AiSearchIcon` | Scripted forest → beach → kitchen → city-failure chat, with read-only prefilled prompts, a floating chat window, a compact composer, a short typing state, and reset. | Host supplies `stays`, `renderStayLink`, optional lab-only `scenario`, `accessory`, `inputId`, `hidden`, `windowClassName`, `windowAction`, `launcherLabel`, `canSendMessage`, `onReset`, and `onRequestComplete`. No model calls, persistence, or event capture. See [conversation contract](trip-planner.md). |
| `/trip-planner-lab` | `TripPlannerWalkthrough`, `TripPlannerLabProvider`, `useTripPlannerLab` | Walkthrough: session/trace/generation hierarchy, captured chat, a wrong recommendation, a failing capacity evaluation, investigation, fix, and the same evaluation passing. | Host connects chat completion to `record`, keys chat by `revision`, supplies stays, an optional `renderStayCard` for the actual homepage card, an `onAllLabs` callback for lesson navigation, and optional `onEvaluate(phase)` for a learner running the before/after check. Instructions point learners to the actual Twig controls. Load `lab.css` in the lab theme. |
| `/trip-planner-state` | `replyToTripPlanner`, `initialTripPlannerState`, `tripPlannerSuggestions`, prompts, limits, and types | Pure, bounded conversation rules and catalog-backed responses. | Shared by the planner and regression tests. |
| `/trip-planner-records` | `createTripPlannerRequest`, `tripPlannerModel`, request, message, identity, and record types | Builds a catalog-backed answer and a matching PostHog generation with conversation history, token usage, cost, and duration. | Local teaching data only. Caller supplies IDs and start time. No provider call or event upload. |
| `/account` | `LoginView`, `ProfileMenu`, `AccountLayout`, `ProfileOverview`, `SavedStaysView`, `BookedStaysView`, `AccountSettingsView`, types | Reusable Twig account visuals, accessible profile-menu behavior, traveler profile, empty/populated stay views, and settings form. | Host supplies profile content, fixed login email, state, callbacks, routes, images, bookings, persistence, and analytics. |
| `/account` | `TripDetailsView` | Displays trip details when they load, or only the recoverable error when they fail. Its Contact support button stays disabled until support is available. `BookedStaysView` places Cancel stay beside Trip details on the booking card. | Host supplies selected booking, host name, error state, retry, and cancellation callbacks. |
| `/saved-stay` | `SavedStay`, `SavedStayProps` | Controlled save control with signed-out, unsaved, saved, loading, disabled, and error states. Its signed-out label says “Log in to save.” | Host supplies `stayName`, auth state, save state, callbacks, persistence, and analytics. Signed-out hosts pass `onSignIn`; signed-in hosts pass `saved` and `onSavedChange`. |
| `/filters` | `StayFilters`, `staySettings`, `StaySetting` | Controlled Forest/Coast/City filter buttons; calls `onChange` on a click. | `Discover`; pass `value`, `onChange`, and optional CSS classes. The host filters the listings. |
| `/browse-stays` | `BrowseStays`, `TripSearch`, `TripSearchValue` | Real Browse stays controls and matching results from the shared catalog, with optional controlled search/filter disclosure (`controlsExpanded`, `onControlsExpandedChange`). Existing consumers keep expanded controls by default. | `Discover`; pass filter/search state, callbacks, a card renderer, and an optional marker. The host owns tracking and navigation. |
| `/stay-card` | `StayCardContent` | Listing text, location, capacity, and nightly price. | `StayCard`; pass a `stay` and `image`. The host supplies the link or card wrapper; `linked` shows an arrow. |
| `/stay-details` | `StayDetails` | About, stay facts, sleeping arrangements, and amenities. | Stay detail page; pass the selected catalog `stay`. Host/booking sections stay in Twig.com. |
| `/browse-stays-preview` | `BrowseStaysPreview` | Read-only Browse stays excerpt with one selected filter and stay. | Gallery only; intended for PostHog 101. Pass `selected="Forest"`, `"Coast"`, or `"City"`. No click handler or analytics. |
| `/catalog` | `stays`, `characters`, `conciergeContent`, `discoveryCopy`, `filterStays`, `stayLabel`, `nightlyPrice`, types | Fictional catalog content and pure display/filter helpers. | Discover, stay pages, and lab fixtures; the host supplies page layout and navigation. |
| `/trip-dates` | `todayAtStay`, `validateTrip`, types | Date and guest validation for the booking exercise. | Booking flow; pass the visitor’s trip selection. |
| `/date-picker` | `DatePicker`, `addDateDays` | Twig-styled, keyboard-accessible calendar for a controlled ISO date. | Booking form supplies the selected date, earliest allowed date, and change callback. |
| `/guest-picker` | `GuestPicker` | Twig-styled, keyboard-accessible guest menu. | Booking form supplies the selected guest count, stay capacity, and change callback. |

Stay images include their source and credit. `objectPosition` optionally sets the gallery crop's focal point, such as `"center 74%"`; hosts should apply it with `object-fit: cover` so the photo is cropped without distortion. Twig.com currently serves the finished stay images at the catalog's `/twig/stays/...` paths.

```tsx
import { useState } from "react";
import { StayFilters, type StaySetting } from "@posthog/twig-components/filters";
import { filterStays } from "@posthog/twig-components/catalog";
import "@posthog/twig-components/catalog.css";

function Browse() {
  const [setting, setSetting] = useState<StaySetting>("All");
  return <>
    <StayFilters
      value={setting}
      onChange={setSetting}
      className="vac-filters"
      buttonClassName="vac-filter"
    />
    <p>{filterStays(setting).length} stays</p>
  </>;
}
```

`SavedStay` deliberately does not sign users in, store saved stays, navigate, or
send events. The host starts those actions from its callbacks and reflects the
result back through controlled props. Routes and any `posthog.identify`,
`posthog.reset`, or `posthog.capture` calls also stay in the consuming site:

```tsx
import { SavedStay } from "@posthog/twig-components/saved-stay";
import "@posthog/twig-components/catalog.css";

<SavedStay
  stayName="Adiron-shack"
  signedIn
  saved={saved}
  loading={saving}
  errorMessage={saveError}
  onSavedChange={setSaved}
/>;
```

## Account views

`AccountLayout` and `ProfileMenu` reuse the shared dropdown shell and rows, including spacing and typography at every width. The account list stays one column on mobile.

Account components own Twig's visual presentation and interface behavior. They
do not own the session, profile fixture, local storage, booking mutations, or
site routes. A host can use the same views interactively in Twig.com or with
read-only fixtures in an editorial embed.

`LoginView` receives a fixed email and a display-only password mask. Its
`onLogin` callback has no arguments, so a password value is never passed through
the component or emitted as an event.

```tsx
import {
  LoginView,
  ProfileMenu,
  type AccountLink,
} from "@posthog/twig-components/account";
import "@posthog/twig-components/catalog.css";

const links: AccountLink[] = [
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "saved", label: "Saved stays", href: "/profile/saved" },
  { id: "bookings", label: "Booked stays", href: "/profile/bookings" },
  { id: "settings", label: "Account settings", href: "/profile/settings" },
];

<LoginView email="edgar.hogg@fakeemail.com" onLogin={logInLocally} />;

<ProfileMenu
  profile={profile}
  links={links}
  open={profileMenuOpen}
  onOpenChange={setProfileMenuOpen}
  onNavigate={navigate}
  onSignOut={logOutLocally}
/>;
```

The default saved and booked views are empty until their controlled collections
contain data. `SavedStaysView` receives catalog stays after a signed-in visitor
saves them. `BookedStaysView` receives booking summaries after a signed-in
visitor completes a booking.

The profile overview presents traveler details without
repeating the account navigation. Saved-stay cards do not repeat a save control.
Personal details in settings are fixed display values; only message preferences
can change. Populated booking cards offer a `Trip details` button when the host
passes `onViewDetails`; the host supplies the details region with `renderDetails`.
Without that callback, the button stays disabled. Hosts can pass `onBioChange`
to show the About edit control; the host decides whether that draft is temporary
or persisted.
Pass `highlightedTripDetailsBookingId` when `renderDetails` uses `TripDetailsView`
to outline only the selected trip's Host label and value with the same Twig
target pulse used for other lab actions.

## Labs and playground

These are **local teaching simulations**. They do not send lab events to PostHog or run an AI model. Twig.com supplies routes, page content, booking state, focus/scroll actions, and navigation callbacks.

For directions that ask the learner to act on Twig, use `LabChecklist` in every lab: one item renders the existing blue-left callout, while two or more sequential items render numbered steps. Keep explanatory prose outside the checklist and avoid repeating the action there. This applies to initial actions, retries, and checks after a simulated fix.

| Import path | Main exports | What it does / host input | Used in Twig |
| --- | --- | --- | --- |
| `/playground` | `playgroundPage`, `labsOnOtherPages`, `selectedTouchpoint`, `touchpointDefinitions`, types | Maps a Twig path to its numbered markers and lists labs that start on other pages. | Playground and site adapters |
| `/playground-controller` | `PlaygroundLabProvider`, `usePlaygroundLab`, `useFilterLab` | Owns selected lab, stage, and filter state; pass `pageKey` and the active lab flags. For cross-page launch, pass `pendingSelection` and clear it with `onPendingSelectionConsumed`. Requires `ReplayProvider` and `StayLabProvider` above it. | Playground / FilterLab |
| `/playground-panels` | `LabDirectory`, `SelectedLabHeader`, `PlaygroundMarker`, `PlaygroundInvitation`, `PlaygroundDock` | Lab directory shows labs on the current page first. A closed menu groups labs elsewhere by PostHog product. Host supplies `onVisitLab` to navigate to a lab's start page, plus dock navigation, guide content, and focus ref. | Playground / FilterLab |
| `/filter-lab-exercise` | `FilterLabIntroduction`, `FilterLabExercise` | Teaches fixed versus clicked filter values; host passes filter state, stage, filter URL, focus, and continuation callbacks. | FilterLab |
| `/filter-inspector` | `FilterInspector` | Compares filter clicks with locally recorded event values; needs state, a filter URL, and practice callback. | FilterLab exercise |
| `/ai-lab-ui` | `AiLabProvider`, `useAiLab`, `useResetAiLab`, `AiIntroduction`, `AiLab` | AI Observability lesson with preset request, response, and timeout; provider holds local state. Host passes stage and planner focus callback. | AiLab |
| `/booking-lab-ui` | `BookingLabProvider`, `useBookingLab`, `BookingLab` | Booking attempt versus confirmed completion lesson; provider holds trip and event state. Host passes stage and booking focus callback. | BookingLab |
| `/error-tracking-lab-ui` | `ErrorTrackingLabProvider`, `useErrorTrackingLab`, `ErrorTrackingLab` | Standalone local booking-to-trip exception, issue grouping, fix, and retry lesson. Host passes stage, page location, and focus callbacks. The provider keeps the new lab booking across Twig page navigation. | ErrorTrackingLab |
| `/stay-lab-ui` | `StayLabProvider`, `useStayLab`, `StayLab` | Connects stay view events to listing IDs; host passes path and renders stay links. | StayLab |
| `/replay-recorder` | `ReplayProvider`, `useReplay` | Records the current tab locally or runs a ghost visit with rrweb; pass `open` and `pathname`. | ReplayLab / Playground |
| `/replay-lab-ui` | `ReplayLab`, `ReplayRecordingBar`, `ReplayLabViewState` | Replay lesson and recording status; host passes stage, replay state, return link, and player. | ReplayLab |
| `/session-player` | `SessionPlayer` | Plays an rrweb recording; pass recorded `events`. | ReplayLab |
| `/lab-navigation` | `LabNavigationView` | Keeps All labs, Previous step, and the optional `returnTo` action visible as text navigation. The labeled reset icon opens the existing confirmation in Twig.com. | FilterLab adapter |
| `/lab-completion-view` | `LabCompletionView` | Recap for one completed lab; host supplies choose/review actions and heading ref. | LabCompletion |
| `/lab-checklist` | `LabChecklist` | Shared directions for learner interactions, with done/current/upcoming states; pass `label` and `items`. | Lab UI |
| `/lab-choices` | `LabChoices` | Accessible radio choice group; pass `label`, `value`, `options`, and `onChange`. | Lab UI |
| `/finish-lab-button` | `FinishLabButton` | Standard finish action; pass `onClick`. | Lab UI |

The state modules below contain reducers, types, fixtures, and formatting helpers. They have no React UI:

| Import path | Purpose | Used in Twig |
| --- | --- | --- |
| `/filter-lab` | Filter event state, validation, feedback, and example code | FilterLab and filter inspector |
| `/ai-lab` | AI request/response fixtures, event state, checks, and example code | AiLab |
| `/booking-lab` | Booking attempt/completion state and example code | BookingLab |
| `/error-tracking-lab` | Local exception occurrences, issue fingerprint, and fix state | ErrorTrackingLab |
| `/stay-lab` | Stay view event state and example code | StayLab |
| `/replay-lab` | Replay frame types and display helpers | ReplayLab |

## Styles and assets

| Import path | Use |
| --- | --- |
| `/catalog.css` | Twig website views and the read-only preview; uses Twig’s self-hosted DM Sans and Fraunces. Bricolage remains bundled for compatibility, not rendered as part of the approved identity. |
| `/lab.css` | Playground and lab UI; scope it under `.vac-app .vac-developer-theme`. Its PostHog-styled UI uses RoundHog. |
| `/assets/*` | Package font and image files referenced by the styles or explicitly imported by a host. |

Do not apply Twig typography to the PostHog event inspector in the pocket guide. That inspector, the guide prose, and “Explore Twig” links belong to PostHog.com.

The AI walkthrough reuses `LabCompletionView` for its final recap. The view accepts optional `title` and `recap` overrides while retaining the shared completion layout. Hosts own the confetti animation and respect reduced-motion preferences.

`LabCompletionView` only renders its review link and results reminder when `onReview` is provided. The AI lab ends with the recap and Choose another lab button.

## Events and properties

`/events-lab` exports the local lesson reducer, configuration gates, counts, and handoff task. `/events-lab-provider` exports `EventsLabProvider` and `useEventsLab`; the playground controller includes it and resets its state when a learner chooses a lab. A custom host can change the provider's `resetKey` to start a fresh lesson without remounting its children. `/events-lab-ui` exports `EventsLab`, `EventsExperienceSwitch`, and `EventRecordedNotice`. Render the experience switch with host navigation, outside lesson content. One entry offers two complete experiences: an Activity/Trends interface or a simulated coding agent with MCP reads. The toggle preserves recorded events and tracking configuration. The agent shows thinking, tool execution, and a streamed answer, with immediate responses when reduced motion is enabled. The final comparison explains insights and dashboards without adding a duplicate save screen. Hosts send actual destination filter clicks, result counts, and timestamps, and supply navigation callbacks. The lesson never creates clicks on behalf of the learner. Code changes and MCP results are local simulations; no model or network calls occur.


`TripSearch` is a controlled destination/date/guest form using the shared date and guest pickers. Pass `value`, `minDate`, `capacity`, `errors`, `onChange`, and `onSubmit`. Destination, dates, and guests stay visible at every width; only optional setting/amenity filters use a disclosure. On mobile, destination and guests fill the form width, dates share a row, and the full-width submit action follows Filters. The host validates, filters, carries the selection into booking, and records analytics. `BrowseStays.primarySearch` replaces its old inline text search; `results` accepts the host-filtered catalog. Both are optional and preserve existing consumers. `StayCardContent` groups nightly price beside its title and attributes the stay to the existing catalog host by name and species.


Integrated search: pass a render function to `BrowseStays.primarySearch` to receive the existing setting-filter disclosure, then render it in `TripSearch.filters`. `additionalFilters` adds amenity controls and `activeFilterCount` supplies the count. Existing React-node consumers keep their old arrangement. `TripSearch.destinations` provides catalog-location suggestions; `onDestinationSelect` reports a chosen location to the host. Suggestions support arrows, Enter, Escape, and pointer selection. `/filters` also exports `AmenityFilters`, `amenityOptions`, `StayAmenity`, and `matchesStayAmenities`. Multiple selected amenities use AND semantics. Existing setting callbacks, replay labels, and simulated event schemas remain intact.

Replay opens the integrated filter disclosure before its ghost clicks and submits the destination form before opening a stay. It recognizes both `#trip-search-destination` and legacy `#stay-search`, applying the same optional search-text masking to either.


Stay-card host identities show a small circular portrait from the existing character `portrait` field, followed by the existing host name and a separate italic Fraunces species line. Missing portraits leave the circle empty, without requesting an invalid image URL. Character names, species, and artwork remain supplied by the host catalog owner.


The interactive browse section shows only “Browse stays” above its photos. It omits the Explore eyebrow and keeps the changing result count screen-reader-only so filtering remains announced without another visible row.

`AiSearchIcon` is the decorative sparkle beside “AI trip planner”. Keep the text label and the appropriate pressed/expanded state on its control.

## Integrated getaway search

`SearchWorkspace` and `GetawaySearch` are exported from `/trip-planner`. They share the existing sage search surface, Twig type, cobalt controls, and 3px corners. “Search stays” is selected first; the second tab reads “AI trip planner”. AI uses catalog-backed local rules with concise fit explanations, relevant factual limitations, and “Simulated AI responses”. Unknown requirements are not verified. Hosts supply trip preferences, navigation, booking transfer and content-free outcome analytics. The original `TripPlanner` remains unchanged for guided labs. The workbench includes a Getaway search view.

Guests type into the AI search field. Sending opens a non-modal chat window on the left using the existing Twig chat styling. Conversation content stays in that window; collapsing keeps a compact launcher and preserves messages and draft. Switching search modes does not close the chat. The only note reads “Simulated AI responses”. Guided Playground chat retains its existing flow.

Twig views share two typefaces (DM Sans interface, Fraunces display), quiet charcoal facts, sage search surfaces, and the existing cobalt primary actions. SearchWorkspace coordinates 48px desktop controls and compact mobile disclosure; GetawaySearch retains its editable composer, separate collapsible window, and callbacks. See the Getaway search and Twig views workbench examples. The optional `GetawaySearch.windowClassName` lets the host place the portaled window beside its lab dock; interaction flow is unchanged.

Account components use the same approved charcoal text, sage selections, neutral borders/shadows, and DM Sans/Fraunces hierarchy as the rest of Twig. Saved stay cards reuse `StayCardContent` and share browsing-card rules. Account navigation rows retain 44px targets and consistent height at 320px, including selected labels. See the visual system’s account and full-site verification requirements before changing these components.

## Inspect Twig exploration

`PlaygroundLauncher`, `PlaygroundExplorer`, and the `PlaygroundActivity` type are additive exports from `/playground-panels`. The compact launcher opens the workspace. Explorer composes existing PostHog menu rows, product icons, `LabChecklist`, local activity evidence, and OS buttons; it passes selections, locating, lab starts, and navigation to host callbacks. Existing `LabDirectory`, `PlaygroundInvitation`, and guided lesson APIs remain available. The workbench’s Inspect Twig preview exercises the prototype.

Activity is observed local UI interaction, not captured PostHog events. Hosts must allowlist catalog actions and omit all user-entered content. No shared component sends analytics or records DOM contents.

The earlier review variant used a horizontal right-edge `PlaygroundLauncher` tab and `PlaygroundDock placement="edge"`: a compact PostHog window toolbar, collapse control, and slide-in motion with a reduced-motion alternative. Hosts place the drawer and reserve room for Twig. The original inline dock remains the default for other consumers. Existing product choices, evidence, and guided lessons are unchanged.

The edge launcher label reads horizontally, with logo and expand icon alongside it. Do not rotate text or use vertical writing. Narrow hosts may put the tab in the page flow to avoid obscuring controls.

### Tool rail and element picker preview

Sarah requested a persistent neutral tool rail with the existing PostHog logo/product icons, an inspect cursor, hover/focus labels, and a collapse control. `PlaygroundToolRail` and `PlaygroundPickerHint` are additive `/playground-panels` exports. The rail remains visible beside `PlaygroundDock placement="edge"`. `PlaygroundExplorer selectedId` lets the host select a feature without starting or changing a lesson. The host owns allowlisted element picking, DOM focus restoration, routing, and analytics. Reuse the existing neutral selected states, blue target outline, and product assets. No vertical text, raised launcher, recorded DOM content, or changed lesson copy. This remains a reviewable prototype.

At narrow widths the persistent rail becomes a bottom tool strip, preserving Twig’s full content width. Keep tooltips inside the viewport and chat/replay controls above that strip. The host places those windows; search uses its own width as a container for its established responsive layouts.

The rail uses the exact PostHog `IconCursorBox` glyph. Its logo is the Home button, controlled by `homeOpen` and `onHomeOpened`, with the existing tooltip, selected state, and keyboard focus. `PlaygroundHome` starts the real-interaction onboarding or opens independent inspection through host-owned callbacks. Keep the logo visible on desktop and mobile; there is no question-mark control. The edge workspace retains its rail collapse control. Legacy `helpOpen`, `onHelpOpened`, and `PlaygroundHelp` exports remain available for compatibility.

The rail logo is decorative: no button, link, tooltip, focus stop, or opening action. `toggleRef` belongs to the expand/collapse control. Hosts return focus to the inspect control on mobile.

`PlaygroundInstrumentationTooltip` (`/playground-panels`) takes a `touchpoint` with stable `id`/`tool`, its DOM `anchor`, optional tooltip `id`, and optional pointer enter/leave callbacks. It owns PostHog product presentation and measured viewport placement. `PlaygroundMarker` supplies hover/focus/dismissal and `aria-describedby`; the host picker may reuse it for fixed allowlisted targets. Edge docks and open rails share one neutral surface with only the content/icon-rail divider.

`PlaygroundInspectionView` (`/playground-panels`) is the dedicated Inspect surface. Props: `activity`, optional `selectedId`, `onSelect(id)`, and `choose(id)`. `PlaygroundActivity` supports any `TouchpointId`, with optional `event` for the fixed instrumentation name. It shows selectable interaction history and contextual instrumentation/evidence based on PostHog.com’s pocket-guide source, including syntax-highlighted markup and expandable payload/property trees. Keep the Inspector focused on instrumentation evidence, without a lab CTA or learning prompt. It has no introductory hero, promotional card, or raised CTA. Hosts own observation, filtering, normal site interactions, mode transitions, focus, and analytics. `PlaygroundExplorer` remains the separate product exploration/directory view.

`PlaygroundActivity` optionally supplies `timestamp`, structured `properties`, and a canonical safe `element` snippet. `InstrumentationInspector` is an internal shared primitive, preserving the pocket-guide structure without changing guide embeds. Never pass arbitrary DOM HTML or visitor inputs. The edge header has no collapse button; the rail remains the single collapse control.

Clicking the active Inspect or product tool again collapses its workspace; clicking a different tool switches views. A closed workspace has no pressed tool. Reopening preserves the existing inspection and lesson state. Use the same toggle behavior for pointer and keyboard activation.

The edge dock uses a controlled `open` prop with a reversible 240ms transition in both directions. Keep it mounted through closing; it becomes inert and hidden from assistive technology immediately, then unmounts after exit. Host page-width/mobile-height transitions use the same timing and easing. Reduced motion removes movement. Do not restore an enter-only animation or conditionally remove the dock at the start of closing.

For a dock joined to the permanent rail, pass `joinedBranding` to both components. Keep the single PostHog logo fixed in the desktop rail; the expanded edge header renders only “PostHog Playground”, without a second logo or reserved logo gap. Preserve panel motion and mobile rail controls. Inline consumers retain their existing branding.

Toolbar hover labels use RoundHog, the existing PostHog neutral surface and toolbar border, compact padding, and the directional pointer used by PostHog.com’s Radix tooltip. Keep them flat rather than presenting a second white card. Hover labels have a short delay; keyboard focus is immediate and Escape dismisses them. Associate each label with its tool. Mobile labels stay within the viewport.


## Inspector teaching flow

Keep one narrow, pocket-guide-style evidence frame: Console selection, one concise explanation of what happened, the actual capture call, then expandable event data. Full handlers, the tracking helper, and the autocapture comparison are disclosures. Do not force an Elements section onto non-DOM evidence or show missing-element placeholders. Reuse the existing syntax palette, native disclosures, and neutral borders. Keep explanations short and regular.

Classify records by instrumentation: custom AI-feature usage events remain Product Analytics, `$ai_generation` is AI Observability, `$exception` is Error Tracking, and replay uses recording/masking configuration. Hosts may provide linked product events and local generations with the same optional `operationId`. Related-evidence links select the matching console record. Reuse the existing AIO teaching model and identify simulated generations once. Show model, latency, tokens, cost, and the supplied trace/generation IDs using the existing facts and trace views. Keep visitor messages and preferences out of site observation. The standalone example remains available for consumers without connected evidence.

`PlaygroundInspectionView` accepts optional `describe(activity)` and `contexts` with `InspectionGuide` values. Hosts own exact source excerpts and safe event projection. `inspectionProduct` classifies the event rather than its feature location. `replayInspectionGuide` exposes only current privacy/recording settings; recording contents, prompts, personal details, error messages and stacks stay out of site observation. Existing inspection-selection callbacks cover related-evidence selection and lab entry.


## Shipping toolbar scope

Keep the existing tool rail, 380px dock, motion, branding, and dedicated Inspector. Product icons open one `ProductLabLanding` per product, built from the existing `vac-lab-directory-list` cards and start controls. `labsForProduct(id)` lists every existing lab for that product across all Twig routes, without duplicate per-page entries, nested feature explorers, or live activity on the landing. Keep lesson content and flow untouched.

Instrumentation circles retain their product colors and hover/focus notes. Notes name the actual capture mechanism and useful properties. Clicking a marker opens its existing lab, even from Inspect; hosts may resume the selected lesson instead of resetting it. Do not turn marker clicks into another inspection context-selection step. Existing lab-start/resume and product-selection callbacks cover tracking.

The open edge Playground is one neutral surface with a single divider between the icon rail and content (above the bottom rail on mobile): no outer frame or header separator. Keep the divider below the desktop rail logo in both expanded and collapsed states. Keep borders on content cards, evidence, and controls. Its content scrollbar uses a thin neutral thumb on a transparent track without a reserved gutter; hosts should also keep the page scrollbar track transparent. Closed toolbar boundaries remain unchanged.

The logo opens Home through `onHomeOpened`; pass `homeOpen` for the neutral active state. It remains available on mobile, with the existing Home tooltip and keyboard focus. Selecting Home preserves lesson progress and Inspector history. The toolbar has no question-mark control.

Lab names describe the PostHog concept taught. The six toolbar labs are Events and properties; Breakdowns by property; Funnels and conversion events; Traces, generations, and evaluations; Session playback and masking; and Exceptions and issue resolution. Shared `touchpointDefinitions` owns the names; stable IDs, event names, lesson exercises, and page/action labels stay unchanged.

Inspector disclosures reuse [PostHog.com’s Radix Accordion](https://github.com/PostHog/posthog.com/blob/master/src/components/RadixUI/Accordion.tsx): flat full-width rows, left-aligned labels, and the exact PostHog IconPlus/IconMinus glyphs on the right. Use the shared `InspectorSummary` for code sections, nested setup, payloads, and property objects. Hide browser markers, retain native details keyboard/state semantics, use quiet neutral hover and visible focus, and keep 44px targets. The console is always visible, not a disclosure. Do not apply this change to lesson accordions or add a lab CTA.

`PlaygroundInspectionView` uses one black terminal console above the selected-event Inspector. Its chronological records are the event history: select an earlier event to pin it, or use Follow latest to resume. Clear console removes prior records from the visible console and selection. Controlled `session`/`onSessionChange` retains selection and clearing across routes and toolbar unmounts. Timestamp sits above the left-aligned event name; properties align beneath the name. The console uses PostHog.com’s `borderRadius.sm` (4px) on all corners and clips child rows to that shape. Records retain the black surface without selection outlines or gray shading. The selected event name and related records sharing its `operationId` use the brand palette’s darker yellow (`#E58E00`, [source](https://brand.posthog.com/catalog.json)); unrelated event names and console controls remain neutral. Keep exactly one selected record for the detail view and keyboard focus; highlighting a related record does not select it. Clear console and Follow latest are neutral control buttons in a compact Console header joined directly above the black event area. Use compact borderless controls with the tool rail’s neutral hover/focus treatment. Clear console is a 16px Playground reset icon with an accessible name and tooltip in a 28px button; touch pointers retain 44px targets. Keep the header compact and the controls transparent at rest. The outer console frame owns the shared 4px corners and clips the joined header and event area. Controls stay outside the event output; keep disabled controls readable without underlines or bright accents. Keep the actual capture call and expandable data below. No separate History view, command prompt, duplicated full JSON, or lab CTA.

`GetawaySearch` exposes optional `onReset` when “start over” clears the conversation, so hosts can start a new local AI session. It does not emit an outcome for a reset.

## Selected-event drill-down

The console remains unchanged. `PlaygroundInspectionView` enables the optional `InstrumentationInspector drilldown` presentation beneath it: matching neutral chrome, borders, 4px corners, and 12px alignment. Show the readable interaction title once and its explanation together, without repeating the event name already selected in the console. “How it’s tracked” opens the exact call in a quiet neutral code surface, with a compact filename below it; the full path stays available on the location. Handler & setup and event data remain expandable. Preserve the existing source, data, related-record navigation, native disclosure semantics, and keyboard focus. Scope these rules to `.vac-inspector-drilldown`; standalone examples, lesson evidence, and every console selector retain their existing design. Presentation changes reuse existing tracking.

Drill-down disclosure hover keeps every row transparent, including nested property objects. Keep label text color fixed, including Handler & setup. Signal hover only through the muted-to-ink plus/minus affordance. Preserve the existing focus-visible outline and native expanded state. Do not add hover tiles, selection fills, movement, or console style changes.

“How it’s tracked” preserves multiline source indentation without horizontal scrolling. Soft-wrap long lines at whitespace or identifier separators such as underscores, dots, and slashes; align continuation lines with their original indentation. Use emergency wrapping only for an otherwise unbreakable token at narrow widths. Soft-wrap hints add no characters to copied code. Format actual instrumentation calls with the event name on its own line and one property per line, then regenerate host source excerpts. Product Analytics may lead with a generated equivalent SDK capture, using `InspectionSource.caption=""` to omit the caption and file location. Keep actual file locations with the underlying Twig implementation. Hosts derive it from real event arguments and retain the actual implementation under Handler & setup. Never handwrite a divergent example or mislabel one as a literal source excerpt.

Console-linked inspection uses `additionalProperties` to avoid repeating the feed. One shared preview recipe supplies both the unchanged console text and the omitted/truncated properties. Hide the data disclosure when the console shows everything. Otherwise show “More event data” containing only omitted properties and the complete values of truncated properties; never repeat the event name or timestamp. AI generation previews show model and latency, so their additional inputs, outputs, usage, and trace data remain inspectable. Preserve Recording configuration as product-specific evidence. Standalone inspectors retain their complete payload by default. Existing tracking covers the presentation change.

`InspectionSource.highlightLines` optionally supplies one-based line numbers relative to the source excerpt. Wrapped drill-down sources render these lines with PostHog.com’s subtle yellow wash, preserving code text and original source locations.

`InspectionGuide.instrumentationDescription` optionally explains the capture approach above the primary code example. Generation drill-downs render their metrics in a collapsed Generation details disclosure after the primary source; standalone inspectors retain their original summary placement.

PostHog data tables use `vac-lab-table` from `lab.css`; use `vac-lab-table-key-value` for two-column field/value data. Use semantic row/column headers, wrap full values, and follow the shared table contract in the visual-system guide.


`PlaygroundHome` accepts `onStart` for the first-interaction walkthrough and `onInspect` for independent exploration. The optional legacy `onSelect` prop remains compatible. `PlaygroundOnboarding` accepts `phase` (`stay`, `filter`, `another-stay`, `history`, `compare`, `compare-again`, `follow`, `reset`, `complete`); it renders the existing action checklist and compact guidance inside the live Inspector. Hosts advance it from observed site instrumentation. The workbench uses explicitly simulated controls.

Pass the tour as `PlaygroundInspectionView guidance`. Use “Tour” as the heading while the tour is active and “Inspector” for independent inspection; guidance replaces its general introduction, without a separate page or milestone heading. Pass `onExitTour` alongside guidance to show the × icon control beside the Tour title. It uses the shared icon control with its light-surface variant, a 44px target, “Exit tour” hover/focus tooltip, and visible keyboard focus. Exiting returns to Playground Home and focuses its workspace heading without clearing event history. The console and source views retain their existing rendering.

Home uses grouped `vac-home-panel` surfaces for its tour starter, Inspector entry, and native product disclosures. Pass `onVisitLab(id, page)` to start a selected concept lab directly; `onSelect` remains a fallback for older consumers. Introductory copy identifies Twig as the demo site and the Playground as its PostHog event/code explorer. Reuses existing neutral menu surfaces and bundled PostHog product icons, with no new visual tokens or captions.

All tour directions, including the final invitation to keep exploring event history, use the shared `LabChecklist` instruction box. Keep explanatory context outside the box.

After three changes to earlier console selections, the tour prompts the down arrow to resume live tracking. Its actual follow action reveals the reset instruction; resetting then invites a few more site interactions to inspect new events. Repeated clicks on the same entry do not advance the tour. Keep all of these directions in `LabChecklist`; preserve the exit control and ordinary console behavior.

Home follows the [PostHog docs landing page](https://posthog.com/docs) with stacked white panels, using existing neutral borders, the small corner token, and RoundHog. The top card contains only “Take a tour” and an arrow, followed by a separate “Explore on your own” CTA card that opens the Inspector. Keep that card to its label and arrow, without an explanation or separate Inspector label. The labs panel groups Learn with labs, its one-sentence introduction, and full-width neutral product bars with indented lab rows. Keep the 16px panel spacing, 44px interaction targets, and visible focus. Scope this composition to Home; other lab menus and Inspector views keep their established styling.

Home’s Take a tour and Explore on your own cards share one control rule and the same label typography as Learn with labs: 14px / 20px, weight 600. Do not introduce a separate larger tour label. Product disclosure rows keep the shared menu typography.

Twig menus share `twig-dropdown-menu` and `twig-dropdown-item` from `catalog.css`; GuestPicker, destination suggestions and ProfileMenu reuse the same surface and row states. Calendar popovers reuse the surface with their calendar layout.

`AccountLayout` hides its sidebar on narrow single-column layouts. Compose it with the existing header `ProfileMenu` so account destinations remain accessible; the menu starts closed. Desktop retains the sidebar.


Playground lab menus share the approved full-width hover/focus rows and neutral header divider from `lab.css`. ProductMenuPreview in the workbench switches between Home and other-lab menus for pointer and keyboard review. This changes presentation only; public props, lab choices and navigation callbacks are unchanged.
