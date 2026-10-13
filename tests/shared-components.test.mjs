import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StayFilters, staySettings } from "@posthog/twig-components/filters";
import { BrowseStaysPreview } from "@posthog/twig-components/browse-stays-preview";
import { SavedStay } from "@posthog/twig-components/saved-stay";
import {
  AccountLayout,
  AccountSettingsView,
  BookedStaysView,
  LoginView,
  ProfileMenu,
  ProfileOverview,
  SavedStaysView,
} from "@posthog/twig-components/account";
import { BrowseStays } from "@posthog/twig-components/browse-stays";
import { StayDetails } from "@posthog/twig-components/stay-details";
import { stays } from "@posthog/twig-components/catalog";
import { FilterLabExercise } from "@posthog/twig-components/filter-lab-exercise";
import { ReplayLab } from "@posthog/twig-components/replay-lab-ui";
import {
  filterLabReducer,
  initialLabState,
} from "@posthog/twig-components/filter-lab";

test("shared filters render outside Next.js with accessible state and replay targets", () => {
  for (const setting of staySettings) {
    const html = renderToStaticMarkup(
      createElement(StayFilters, {
        value: setting,
        onChange: () => {},
      })
    );
    assert.match(html, /<legend>Filter by destination type<\/legend>/);
    assert.equal((html.match(/<button /g) ?? []).length, 4);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.ok(
      html.includes(
        `data-replay-label="Filter: ${setting}" type="button" aria-pressed="true"`
      )
    );
  }
});

test("read-only Browse stays preview labels the chosen view without buttons", () => {
  const html = renderToStaticMarkup(
    createElement(BrowseStaysPreview, { selected: "Coast" })
  );
  assert.match(html, /data-twig-filter="Coast" data-selected="true"/);
  assert.match(html, /data-twig-stay="Coast">Coast stay/);
  assert.match(html, /role="img"/);
  assert.doesNotMatch(html, /<button/);
});

test("Saved stay exposes distinct signed-out, unsaved, and saved controls", () => {
  const signedOut = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Adiron-shack",
      signedIn: false,
      onSignIn: () => {},
    })
  );
  assert.match(signedOut, /data-signed-in="false"/);
  assert.match(signedOut, /aria-label="Sign in to save Adiron-shack"/);
  assert.match(signedOut, /class="twig-saved-stay-status"[^>]*>Log in to save<\/span>/);
  assert.doesNotMatch(signedOut, /aria-pressed/);

  const unsaved = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Adiron-shack",
      signedIn: true,
      saved: false,
      onSavedChange: () => {},
    })
  );
  assert.match(unsaved, /aria-label="Save Adiron-shack"/);
  assert.match(unsaved, /aria-pressed="false"/);
  assert.match(unsaved, /class="twig-saved-stay-status"[^>]*>Save<\/span>/);

  const saved = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Adiron-shack",
      signedIn: true,
      saved: true,
      onSavedChange: () => {},
    })
  );
  assert.match(saved, /data-saved="true"/);
  assert.match(saved, /aria-label="Remove Adiron-shack from saved stays"/);
  assert.match(saved, /aria-pressed="true"/);
  assert.match(saved, /class="twig-saved-stay-status"[^>]*>Saved<\/span>/);
});

test("Saved stay makes loading, disabled, and error states accessible", () => {
  const saving = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Le Nid Chic",
      signedIn: true,
      saved: false,
      loading: true,
      errorMessage: "Twig couldn’t update this stay. Try again.",
      onSavedChange: () => {},
    })
  );
  assert.match(saving, /data-loading="true"/);
  assert.match(saving, /aria-busy="true"/);
  assert.match(saving, /disabled=""/);
  assert.match(saving, /Saving…/);
  assert.match(saving, /aria-describedby="[^"]+"/);
  assert.match(saving, /role="alert"/);

  const removing = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Le Nid Chic",
      signedIn: true,
      saved: true,
      loading: true,
      onSavedChange: () => {},
    })
  );
  assert.match(removing, /Removing…/);

  const disabled = renderToStaticMarkup(
    createElement(SavedStay, {
      stayName: "Le Nid Chic",
      signedIn: false,
      disabled: true,
      onSignIn: () => {},
    })
  );
  assert.match(disabled, /disabled=""/);
  assert.doesNotMatch(disabled, /aria-busy/);
});

const accountProfile = {
  displayName: "Edgar Hogg",
  email: "edgar.hogg@fakeemail.com",
  homeTown: "London",
  bio: "Hi, I'm Edgar! I love long walks on the beach with my family in 3:4 formation and I have collection of rubber ducks from my many trips across Europe.",
};
const accountLinks = [
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "saved", label: "Saved stays", href: "/profile/saved" },
  { id: "bookings", label: "Booked stays", href: "/profile/bookings" },
  { id: "settings", label: "Account settings", href: "/profile/settings" },
];

test("account login exposes fixed demo fields without a password value or payload", () => {
  const html = renderToStaticMarkup(createElement(LoginView, {
    email: accountProfile.email,
    onLogin: () => {},
  }));
  assert.match(html, /<h1[^>]*>Log in to Twig<\/h1>/);
  assert.match(html, /Use the pre-filled demo account/);
  assert.match(html, /twig-login-hint-icon[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /Welcome back|Use the demo account already filled in below|twig-login-avatar/);
  assert.match(html, /value="edgar\.hogg@fakeemail\.com"/);
  assert.match(html, /aria-label="Password, masked"/);
  assert.match(html, /value="••••••••••••"/);
  assert.doesNotMatch(html, /name="password"|autocomplete="current-password"/);
  assert.match(html, /type="submit"[^>]*>Log in/);
});

test("profile menu and account layout expose every destination accessibly", () => {
  const menu = renderToStaticMarkup(createElement(ProfileMenu, {
    profile: accountProfile,
    links: accountLinks,
    open: true,
    onOpenChange: () => {},
    onSignOut: () => {},
  }));
  assert.match(menu, /aria-expanded="true"/);
  assert.match(menu, /<nav aria-label="Profile">/);
  for (const link of accountLinks) {
    assert.ok(menu.includes(`href="${link.href}"`));
    assert.ok(menu.includes(link.label));
  }
  assert.match(menu, />Log out<\/button>/);

  const layout = renderToStaticMarkup(createElement(AccountLayout, {
    profile: accountProfile,
    active: "saved",
    links: accountLinks,
    children: createElement("p", null, "Account page"),
  }));
  assert.match(layout, /aria-label="Account"/);
  assert.match(layout, /href="\/profile\/saved" aria-current="page"/);
  assert.match(layout, /Account page/);
});

test("account pages render useful empty states before saves or bookings exist", () => {
  const shared = {
    renderImage: () => createElement("span", null, "Stay image"),
    stayHref: (stay) => `/stays/${stay.id}`,
  };
  const saved = renderToStaticMarkup(createElement(SavedStaysView, {
    ...shared,
    stays: [],
  }));
  assert.match(saved, /No saved stays yet/);
  assert.match(saved, /Save a stay and it will appear here/);
  assert.match(saved, /twig-account-empty-icon[^]*<svg viewBox="0 0 20 24"/);

  const booked = renderToStaticMarkup(createElement(BookedStaysView, {
    ...shared,
    bookings: [],
  }));
  assert.match(booked, /No booked stays yet/);
  assert.match(booked, /Complete a booking and your trip will appear here/);
});

test("account pages render saved, booked, profile, and fixed settings data", () => {
  const shared = {
    renderImage: () => createElement("span", null, "Stay image"),
    stayHref: (stay) => `/stays/${stay.id}`,
  };
  const saved = renderToStaticMarkup(createElement(SavedStaysView, {
    ...shared,
    stays: [stays[0]],
    onRemoveStay: () => {},
  }));
  assert.match(saved, /Adiron-shack/);
  assert.match(saved, /href="\/stays\/stay-01"/);
  assert.match(saved, /aria-label="Remove Adiron-shack from saved stays"/);
  assert.match(saved, /data-saved="true"/);

  const booked = renderToStaticMarkup(createElement(BookedStaysView, {
    ...shared,
    bookings: [{
      id: "booking-1",
      stay: stays[0],
      dateLabel: "Oct 10–12",
      guestsLabel: "2 guests",
      statusLabel: "Upcoming",
    }],
  }));
  assert.match(booked, /Upcoming/);
  assert.match(booked, /Oct 10–12/);
  assert.match(booked, /2 guests/);
  assert.match(booked, /disabled=""[^>]*aria-label="Stay details for Adiron-shack \(coming later\)"/);
  assert.match(booked, />Stay details<\/button>/);

  const overview = renderToStaticMarkup(createElement(ProfileOverview, {
    profile: accountProfile,
    onBioChange: () => {},
  }));
  assert.match(overview, /Traveler profile/);
  assert.match(overview, /Edgar Hogg/);
  assert.match(overview, /London/);
  assert.match(overview, /View or edit your Twig profile/);
  assert.match(overview, /shared with your host when you book a stay/);
  assert.match(overview, /Hi, I&#x27;m Edgar!/);
  assert.match(overview, /3:4 formation/);
  assert.match(overview, /rubber ducks/);
  assert.match(overview, /aria-label="Edit About"/);
  assert.match(overview, /<dt>Home town<\/dt><dd>London<\/dd>/);
  assert.doesNotMatch(overview, /Saved stays|Booked stays|Total stays completed|Total cities visited|twig-profile-stamp|Signed in as/);
  assert.doesNotMatch(overview, /href="\/profile\/(?:saved|bookings|settings)"/);

  const settings = renderToStaticMarkup(createElement(AccountSettingsView, {
    value: { ...accountProfile, tripReminders: true, productUpdates: false },
    onChange: () => {},
    onSave: () => {},
  }));
  assert.match(settings, /<dt>Display name<\/dt><dd>Edgar Hogg<\/dd>/);
  assert.match(settings, /<dt>Email<\/dt><dd>edgar\.hogg@fakeemail\.com<\/dd>/);
  assert.doesNotMatch(settings, /type="(?:text|email)"/);
  assert.match(settings, /Trip reminders/);
  assert.equal((settings.match(/type="checkbox"/g) ?? []).length, 2);
});

test("Browse stays uses the shared catalog and keeps search and filters accessible", () => {
  const html = renderToStaticMarkup(createElement(BrowseStays, {
    id: "test-browse",
    setting: "Coast",
    search: "",
    onSettingChange: () => {},
    onSearchChange: () => {},
    renderStay: (stay) => createElement("article", { key: stay.id }, stay.id),
  }));
  assert.match(html, /<label for="test-browse-search">Search stays<\/label>/);
  assert.match(html, /aria-pressed="true"[^>]*>Coast<\/button>/);
  assert.match(html, /role="status">1 stay<\/p>/);
  assert.match(html, /stay-02/);
  assert.doesNotMatch(html, /stay-01|stay-03/);
});

test("Stay details renders the same catalog facts as Twig", () => {
  const html = renderToStaticMarkup(createElement(StayDetails, { stay: stays[0] }));
  assert.match(html, /About this stay/);
  assert.match(html, /Where you’ll sleep/);
  assert.match(html, /What’s here/);
  assert.match(html, /<dt>Guests<\/dt>/);
});

test("shared lesson preserves the actual click separately from a misconfigured event", () => {
  let state = filterLabReducer(initialLabState, { type: "example" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  assert.deepEqual(state.events[0], {
    id: 1,
    event: "stay_filter_selected",
    clicked: "Coast",
    properties: { destination_type: "Forest" },
  });
  state = filterLabReducer(state, { type: "repair" });
  state = filterLabReducer(state, {
    type: "edit",
    config: { source: "clicked" },
  });
  state = filterLabReducer(state, { type: "apply" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  assert.equal(state.events[0].properties.destination_type, "Coast");
  assert.equal(state.before[0].properties.destination_type, "Forest");
});

test("portable filter exercise renders both the code step and event comparison", () => {
  const props = {
    dispatch: () => {},
    setStage: () => {},
    onFocusFilters: () => {},
    onContinue: () => {},
    filterHref: "#my-filter-controls",
  };
  const starting = renderToStaticMarkup(
    createElement(FilterLabExercise, {
      ...props,
      state: initialLabState,
      stage: 1,
    })
  );
  assert.doesNotMatch(starting, /<h3/);
  assert.match(starting, /aria-label="Next filter actions"/);
  assert.match(starting, /posthog\.capture/);

  let state = filterLabReducer(initialLabState, { type: "example" });
  state = filterLabReducer(state, { type: "filter", setting: "Forest" });
  state = filterLabReducer(state, { type: "filter", setting: "Coast" });
  const inspecting = renderToStaticMarkup(
    createElement(FilterLabExercise, { ...props, state, stage: 2 })
  );
  assert.match(inspecting, /Event #2/);
  assert.match(inspecting, /Mismatch: the event describes a different filter/);
  assert.match(inspecting, /aria-controls="[^"]+"/);
  assert.doesNotMatch(inspecting, /posthog\.com/);
});

test("replay setup renders the return link when opened from a stay page", () => {
  const html = renderToStaticMarkup(createElement(ReplayLab, {
    stage: 1,
    onStage: () => {},
    pathname: "/stays/stay-01",
    returnHome: createElement("a", { href: "/" }, "Return to Find a stay"),
    sessionPlayer: null,
    replay: {
      exercise: "ghost",
      recording: [],
      starting: false,
      frames: [],
      mode: null,
      masked: true,
      setMasked: () => {},
      capturedMasked: true,
      message: "",
      start: () => {},
      stop: () => {},
      clear: () => {},
      setExercise: () => {},
    },
  }));
  assert.match(html, /Return to Find a stay/);
  assert.match(html, /aria-label="Next replay action"/);
});

test("shared catalog keeps filter results and stay cards consistent", async () => {
  const { filterStays, stays } = await import(
    "@posthog/twig-components/catalog"
  );
  const { StayCardContent } = await import(
    "@posthog/twig-components/stay-card"
  );
  assert.equal(filterStays("All").length, 3);
  assert.equal(filterStays("Forest").length, 1);
  assert.equal(filterStays("Coast").length, 1);
  assert.equal(filterStays("City").length, 1);
  assert.equal(filterStays("City")[0].hostId, "colette");
  assert.equal(filterStays("All", "Paris")[0].id, "stay-03");
  assert.equal(filterStays("All", "Adiron")[0].id, "stay-01");
  assert.equal(filterStays("Coast", "Adiron").length, 0);
  const html = renderToStaticMarkup(
    createElement(StayCardContent, { stay: stays[0], image: null })
  );
  assert.match(html, /Adiron-shack/);
  assert.match(html, /\$355/);
  assert.match(html, /4 guests/);
  assert.doesNotMatch(html, /<a |↗/);
  const studio = renderToStaticMarkup(
    createElement(StayCardContent, { stay: filterStays("City")[0], image: null })
  );
  assert.match(studio, /2 guests · 1 bath/);
  assert.doesNotMatch(studio, /0 bedrooms|1 baths/);
});
