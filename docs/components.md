# Component reference

Import only the pieces you need from `@posthog/twig-components/<path>`. React is a peer dependency: the host supplies React 18 or 19. Import `catalog.css` for Twig views and `lab.css` for the playground. See [integration](integration.md) for styling and update boundaries.

“Used in Twig” describes the Twig.com integration. Twig.com pins a published package version, while the PostHog 101 guide integration is still in progress.

## Website views and data

| Import path | Export | What it does | Used in Twig / what the host supplies |
| --- | --- | --- | --- |
| `/account` | `LoginView`, `ProfileMenu`, `AccountLayout`, `ProfileOverview`, `SavedStaysView`, `BookedStaysView`, `AccountSettingsView`, types | Reusable Twig account visuals, accessible profile-menu behavior, traveler profile, empty/populated stay views, and settings form. | Host supplies profile content, fixed login email, state, callbacks, routes, images, bookings, persistence, and analytics. |
| `/saved-stay` | `SavedStay`, `SavedStayProps` | Controlled save control with signed-out, unsaved, saved, loading, disabled, and error states. Its signed-out label says “Log in to save.” | Host supplies `stayName`, auth state, save state, callbacks, persistence, and analytics. Signed-out hosts pass `onSignIn`; signed-in hosts pass `saved` and `onSavedChange`. |
| `/filters` | `StayFilters`, `staySettings`, `StaySetting` | Controlled Forest/Coast/City filter buttons; calls `onChange` on a click. | `Discover`; pass `value`, `onChange`, and optional CSS classes. The host filters the listings. |
| `/browse-stays` | `BrowseStays` | Real Browse stays controls and matching results from the shared catalog. | `Discover`; pass filter/search state, callbacks, a card renderer, and an optional marker. The host owns tracking and navigation. |
| `/stay-card` | `StayCardContent` | Listing text, location, capacity, and nightly price. | `StayCard`; pass a `stay` and `image`. The host supplies the link or card wrapper; `linked` shows an arrow. |
| `/stay-details` | `StayDetails` | About, stay facts, sleeping arrangements, and amenities. | Stay detail page; pass the selected catalog `stay`. Host/booking sections stay in Twig.com. |
| `/browse-stays-preview` | `BrowseStaysPreview` | Read-only Browse stays excerpt with one selected filter and stay. | Gallery only; intended for PostHog 101. Pass `selected="Forest"`, `"Coast"`, or `"City"`. No click handler or analytics. |
| `/catalog` | `stays`, `characters`, `conciergeContent`, `discoveryCopy`, `filterStays`, `stayLabel`, `nightlyPrice`, types | Fictional catalog content and pure display/filter helpers. | Discover, stay pages, and lab fixtures; the host supplies page layout and navigation. |
| `/trip-dates` | `todayAtStay`, `validateTrip`, types | Date and guest validation for the booking exercise. | Booking flow; pass the visitor’s trip selection. |

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
can change. Populated booking cards include a disabled `Stay details` button as
a placeholder for a future booking-details view. Hosts can pass `onBioChange` to
show the About edit control; the host decides whether that draft is temporary or
persisted.

## Labs and playground

These are **local teaching simulations**. They do not send events to PostHog, make bookings, or run an AI model. Twig.com supplies routes, page content, focus/scroll actions, and navigation callbacks.

| Import path | Main exports | What it does / host input | Used in Twig |
| --- | --- | --- | --- |
| `/playground` | `playgroundPage`, `selectedTouchpoint`, `touchpointDefinitions`, types | Maps a Twig path and catalog to available lab markers; host passes the current path. | Playground and site adapters |
| `/playground-controller` | `PlaygroundLabProvider`, `usePlaygroundLab`, `useFilterLab` | Owns selected lab, stage, and filter state; wrap the playground and pass `active` and `bookingEnabled`. Requires `ReplayProvider` and `StayLabProvider` above it. | Playground / FilterLab |
| `/playground-panels` | `LabDirectory`, `SelectedLabHeader`, `PlaygroundMarker`, `PlaygroundInvitation`, `PlaygroundDock` | Lab list, page markers, PostHog-branded invitation, and dock layout; host supplies callbacks, dock logo, navigation, guide content, and focus ref. | Playground / FilterLab |
| `/filter-lab-exercise` | `FilterLabIntroduction`, `FilterLabExercise` | Teaches fixed versus clicked filter values; host passes filter state, stage, filter URL, focus, and continuation callbacks. | FilterLab |
| `/filter-inspector` | `FilterInspector` | Compares filter clicks with locally recorded event values; needs state, a filter URL, and practice callback. | FilterLab exercise |
| `/ai-lab-ui` | `AiLabProvider`, `useAiLab`, `useResetAiLab`, `AiIntroduction`, `AiLab` | AI observability lesson with preset request, response, and timeout; provider holds local state. Host passes stage and planner focus callback. | AiLab |
| `/booking-lab-ui` | `BookingLabProvider`, `useBookingLab`, `BookingLab` | Booking attempt versus confirmed completion lesson; provider holds trip and event state. Host passes stage and booking focus callback. | BookingLab |
| `/stay-lab-ui` | `StayLabProvider`, `useStayLab`, `StayLab` | Connects stay view events to listing IDs; host passes path and renders stay links. | StayLab |
| `/replay-recorder` | `ReplayProvider`, `useReplay` | Records the current tab locally or runs a ghost visit with rrweb; pass `open` and `pathname`. | ReplayLab / Playground |
| `/replay-lab-ui` | `ReplayLab`, `ReplayRecordingBar`, `ReplayLabViewState` | Replay lesson and recording status; host passes stage, replay state, return link, and player. | ReplayLab |
| `/session-player` | `SessionPlayer` | Plays an rrweb recording; pass recorded `events`. | ReplayLab |
| `/lab-navigation` | `LabNavigationView` | All labs, previous step, and reset controls; host supplies actions. | FilterLab adapter |
| `/lab-completion-view` | `LabCompletionView` | Recap for one completed lab; host supplies choose/review actions and heading ref. | LabCompletion |
| `/lab-checklist` | `LabChecklist` | Step list with done/current/upcoming states; pass `label` and `items`. | Lab UI |
| `/lab-choices` | `LabChoices` | Accessible radio choice group; pass `label`, `value`, `options`, and `onChange`. | Lab UI |
| `/finish-lab-button` | `FinishLabButton` | Standard finish action; pass `onClick`. | Lab UI |

The state modules below contain reducers, types, fixtures, and formatting helpers. They have no React UI:

| Import path | Purpose | Used in Twig |
| --- | --- | --- |
| `/filter-lab` | Filter event state, validation, feedback, and example code | FilterLab and filter inspector |
| `/ai-lab` | AI request/response fixtures, event state, checks, and example code | AiLab |
| `/booking-lab` | Booking attempt/completion state and example code | BookingLab |
| `/stay-lab` | Stay view event state and example code | StayLab |
| `/replay-lab` | Replay frame types and display helpers | ReplayLab |

## Styles and assets

| Import path | Use |
| --- | --- |
| `/catalog.css` | Twig website views and the read-only preview; includes Twig’s Halfre font. |
| `/lab.css` | Playground and lab UI; scope it under `.vac-app .vac-developer-theme`. Its PostHog-styled UI uses RoundHog. |
| `/assets/*` | Package font and image files referenced by the styles or explicitly imported by a host. |

Do not apply Twig typography to the PostHog event inspector in the pocket guide. That inspector, the guide prose, and “Explore Twig” links belong to PostHog.com.
