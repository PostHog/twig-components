import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
import { FilterLabExercise } from "@posthog/twig-components/filter-lab-exercise";
import { filterLabReducer, initialLabState } from "@posthog/twig-components/filter-lab";

const output = new URL("./output/", import.meta.url);
await mkdir(new URL("./assets/", output), { recursive: true });
await copyFile(new URL("../dist/catalog.css", import.meta.url), new URL("./catalog.css", output));
await copyFile(new URL("../dist/lab.css", import.meta.url), new URL("./lab.css", output));
for (const name of ["Halfre.ttf", "logo.svg", "cliff.png", "cabin.jpg", "RoundHog.woff2", "RoundHog-Medium.woff2", "RoundHog-SemiBold.woff2"]) {
  await copyFile(new URL(`../dist/assets/${name}`, import.meta.url), new URL(`./assets/${name}`, output));
}

const examples = ["Forest", "Coast", "Mountain"]
  .map((selected) => `<section><h2>${selected}</h2>${renderToStaticMarkup(createElement(BrowseStaysPreview, { selected }))}</section>`)
  .join("\n");

const savedStayExamples = [
  { title: "Signed out", props: { signedIn: false, onSignIn: () => {} } },
  { title: "Unsaved", props: { signedIn: true, saved: false, onSavedChange: () => {} } },
  { title: "Saved", props: { signedIn: true, saved: true, onSavedChange: () => {} } },
  { title: "Saving", props: { signedIn: true, saved: false, loading: true, onSavedChange: () => {} } },
  { title: "Error", props: { signedIn: true, saved: false, errorMessage: "Twig couldn’t update this stay. Try again.", onSavedChange: () => {} } },
].map(({ title, props }) => `<div class="saved-example"><h3>${title}</h3>${renderToStaticMarkup(createElement(SavedStay, { stayName: "Adiron-shack", ...props }))}</div>`).join("\n");

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
const stayViewProps = { renderImage: () => createElement("span", { className: "gallery-stay-image" }, "Stay photo"), stayHref: (stay) => `/stays/${stay.id}` };
const accountExamples = [
  { title: "Login", view: createElement(LoginView, { email: accountProfile.email, onLogin: () => {} }) },
  { title: "Profile menu", view: createElement("div", { className: "gallery-menu" }, createElement(ProfileMenu, { profile: accountProfile, links: accountLinks, open: true, onOpenChange: () => {}, onSignOut: () => {} })) },
  { title: "Profile", view: createElement(AccountLayout, { profile: accountProfile, active: "profile", links: accountLinks }, createElement(ProfileOverview, { profile: accountProfile, onBioChange: () => {} })) },
  { title: "Saved stays · empty", view: createElement(AccountLayout, { profile: accountProfile, active: "saved", links: accountLinks }, createElement(SavedStaysView, { ...stayViewProps, stays: [] })) },
  { title: "Booked stays · empty", view: createElement(AccountLayout, { profile: accountProfile, active: "bookings", links: accountLinks }, createElement(BookedStaysView, { ...stayViewProps, bookings: [] })) },
  { title: "Account settings", view: createElement(AccountLayout, { profile: accountProfile, active: "settings", links: accountLinks }, createElement(AccountSettingsView, { value: { ...accountProfile, tripReminders: true, productUpdates: false }, onChange: () => {}, onSave: () => {} })) },
].map(({ title, view }) => `<section class="account-example"><h2>${title}</h2>${renderToStaticMarkup(view)}</section>`).join("\n");

let inspectedState = filterLabReducer(initialLabState, { type: "example" });
inspectedState = filterLabReducer(inspectedState, { type: "filter", setting: "Forest" });
inspectedState = filterLabReducer(inspectedState, { type: "filter", setting: "Coast" });
const labExamples = [
  { title: "Filter Lab · code", state: initialLabState, stage: 1 },
  { title: "Filter Lab · events", state: inspectedState, stage: 2 },
].map(({ title, state, stage }) => `<section class="vac-app"><div class="vac-developer-theme lab-preview"><h2>${title}</h2>${renderToStaticMarkup(createElement(FilterLabExercise, { state, stage, dispatch: () => {}, setStage: () => {}, onFocusFilters: () => {}, onContinue: () => {}, filterHref: "#gallery-filter-controls" }))}</div></section>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Twig components gallery</title>
  <link rel="stylesheet" href="./catalog.css" />
  <link rel="stylesheet" href="./lab.css" />
  <style>
    body { margin: 0; background: #f5f3ee; color: #282726; font: 16px/1.5 Arial, sans-serif; }
    main { max-width: 1050px; margin: 0 auto; padding: 36px 20px 80px; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    p { margin: 0 0 36px; color: #5f5d59; }
    section { margin: 0 0 40px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    .saved-examples { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 20px; padding: 24px; border: 1px solid #d7c8b6; border-radius: 4px; background: #f7eddf; }
    .saved-example h3 { margin: 0 0 10px; color: #2d2b29; font: 16px/1.2 Arial, sans-serif; }
    .account-gallery { display: grid; gap: 48px; padding: 28px; border: 1px solid #d7c8b6; background: #f7eddf; container-type: inline-size; }
    .account-example { margin: 0; }
    .gallery-menu { position: relative; min-height: 360px; display: flex; justify-content: flex-end; }
    .gallery-stay-image { display: grid; place-items: center; min-height: 180px; background: #efe1ce; }
    .lab-preview { padding: 24px; }
  </style>
</head>
<body><main><h1>Twig component gallery</h1><p>Actual package output · Twig views and Filter Lab states</p><section><h2>Saved stay states</h2><div class="saved-examples">${savedStayExamples}</div></section><section><h2>Account views</h2><div class="account-gallery">${accountExamples}</div></section>${examples}${labExamples}</main></body>
</html>`;

await writeFile(new URL("./index.html", output), html);
console.log(new URL("./index.html", output).pathname);
