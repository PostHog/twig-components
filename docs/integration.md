# Integration and updates

## What lives where

| Place | Owns |
| --- | --- |
| **This repo** | Reusable Twig views and catalog, the five labs’ UI and local state, playground panels, replay recorder/player, CSS, assets, tests, and gallery. |
| **Twig.com** | Full website pages, Next.js routes, stay images and links, playground placement, navigation, and focus/scroll behavior. It currently imports a **local workspace copy** of the package. |
| **PostHog.com** | PostHog 101 prose, code and event examples, PostHog event inspector, Twig introduction screenshot, and guide navigation. Importing the read-only Twig preview from this package is **planned**, not done. |

## How a host uses the package

1. Pick an export in the [component reference](components.md). A website control such as `StayFilters` needs state and callbacks from the host; a read-only view such as `BrowseStaysPreview` needs only its display props.
2. Load `catalog.css` for Twig views. Load `lab.css` for a full playground and wrap its UI in `.vac-app .vac-developer-theme`. Keep the guide’s PostHog UI outside that scope.
3. For the playground, put `ReplayProvider` and `StayLabProvider` above `PlaygroundLabProvider`. Pass the current path, navigation callbacks, and focus actions from the host. Twig.com’s adapters in `src/components/vacation/` show the current setup.
4. For a PostHog guide embed, use only the focused Twig view inside a Shadow DOM wrapper so host CSS does not change it. Keep click animation, if present, with that Twig view; place the PostHog event inspector and guide CTA outside the shadow root. The wrapper and package integration are not built yet.

The playground provider order is:

```tsx
<ReplayProvider open={open} pathname={pathname}>
  <StayLabProvider>
    <PlaygroundLabProvider active={open && isDiscoverPage} bookingEnabled={open && isStayPage}>
      <TwigPageAndPlayground />
    </PlaygroundLabProvider>
  </StayLabProvider>
</ReplayProvider>
```

## How changes reach the sites

1. Change this repo. Run `npm test` and `npm run gallery`; review the relevant gallery view. Run `npm pack --dry-run` before a release.
2. Until npm publishing is set up, mirror reviewed package changes into Twig.com’s `packages/twig-components/` workspace copy. Compare copies before calling them in sync. PostHog.com has no package integration to update yet.
3. After publishing is configured, release a version and update the pinned version in each consuming site. A published package does **not** update sites on its own.
4. Build each changed site and inspect the affected page at narrow and wide widths, in light and dark themes, and with reduced motion. Check that Twig styling stays inside Twig UI and the PostHog inspector keeps PostHog styling.

Publishing and automated dependency update PRs are not configured yet. Do not describe local workspace changes as a published package release.
