# Integration and updates

## What lives where

| Place | Owns |
| --- | --- |
| **This repo** | Reusable Twig views and catalog, the five labs’ UI and local state, playground panels, replay recorder/player, CSS, assets, tests, and gallery. |
| **Twig.com** | Full website pages, Next.js routes, stay images and links, playground placement, navigation, and focus/scroll behavior. It pins a published package version. |
| **PostHog.com** | PostHog 101 prose, code and event examples, PostHog event inspector, Twig introduction screenshot, and guide navigation. Its read-only Twig preview integration is in progress. |

The catalog stores stay photo paths and credits, while Twig.com serves the finished photo files. The package includes the first image for each current stay under `/assets` so a guide can use the same photography. Twig.com still serves its own full galleries. Keep the package images in sync when catalog photography changes.

## Authoring scenarios

**Update a site only when that site needs the change.** Package releases do not change either site automatically. The sites may use different package versions while their needs differ.

| You want to… | Change here? | Change Twig.com? | Change PostHog.com? |
| --- | --- | --- | --- |
| Add a lab to Twig's playground only | Yes, for reusable lesson UI and local simulation logic | Add the lab to the page and update the package version | No |
| Add a Twig lab and teach it in PostHog 101 | Yes, for the lab and any focused, read-only view the guide needs | Add the lab and update the package version | Write the guide and update its package version **if** it uses new exports or behavior |
| Write PostHog 101 content with an existing package view | No | No | Edit the guide; keep its current version if that view is already available there |

Real event calls tied to a Twig page belong in Twig.com. They need a package change only when shared lab UI or behavior changes. If a guide needs a view that exists **only** inside Twig.com, extract that view into this package first. The guide should use focused views, not embed the full interactive lab.

The Events and properties lab is prepared for version `0.2.0`. Each site pins a published version when it adopts the package. Publishing does not update a site automatically.

## How a host uses the package

1. Pick an export in the [component reference](components.md). A website control such as `StayFilters` needs state and callbacks from the host; a read-only view such as `BrowseStaysPreview` needs only its display props.
2. Load `catalog.css` for Twig views. Load `lab.css` for a full playground and wrap its UI in `.vac-app .vac-developer-theme`. Keep the guide’s PostHog UI outside that scope.
3. For the playground, put `ReplayProvider` and `StayLabProvider` above `PlaygroundLabProvider`. Pass the current path, navigation callbacks, and focus actions from the host. Twig.com’s adapters in `src/components/vacation/` show the current setup.
4. For a PostHog guide embed, use only the focused Twig view inside a Shadow DOM wrapper so host CSS does not change it. Keep click animation, if present, with that Twig view; place the PostHog event inspector and guide CTA outside the shadow root. The guide integration is still in progress.

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

1. Change this repo. Use the [workbench](workbench.md) to click through the affected view or lab as you build it. Run `npm test`, `npm run workbench:build`, and `npm run gallery`; review the relevant preview. Run `npm pack --dry-run` before a release.
2. Release a reviewed version, then update the pinned version in each site that needs the change. A published package does **not** update sites on its own.
3. Build each changed site and inspect the affected page at narrow and wide widths, in light and dark themes, and with reduced motion. Check that Twig styling stays inside Twig UI and the PostHog inspector keeps PostHog styling.

This package repo uses Dependabot for its own dependencies. Consumer adoption requires a separate version and lockfile update in each site. Do not describe local workspace changes as a published package release.

## Publishing and consumer adoption

Version `0.1.0` was published manually by an authorized `@posthog` npm maintainer. Its npm metadata includes an integrity hash but no provenance attestation. Do not store an npm token in GitHub.

For future releases, verify npm trusted publishing is configured for **PostHog/twig-components**, workflow **`publish.yml`**, environment **`npm-publish`**, and direct publishing. Protect that GitHub environment so only `main` may deploy and a reviewer must approve each run. Merge a reviewed version change to `main`, then manually run **Publish to npm** on `main`. The workflow tests and previews the package before publishing with a short-lived identity token. Never run it from a feature branch.

After the first workflow release succeeds, set the package's npm **Publishing access** to **Require two-factor authentication and disallow tokens**. Verify the version and provenance on npm, then update only the consuming sites that need it. See [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/) for the npm settings.

## Events and properties release order

1. Review and merge the components PR, including the `0.2.0` version change.
2. Run **Publish to npm** from `main`. The `npm-publish` environment requires approval from Team Wizard & Docs. Verify the published version and provenance before updating a consumer.
3. In the Twig.com PR, run `npm install --save-exact @posthog/twig-components@0.2.0` after publication and commit both package files.
4. Run a clean `npm ci`, tests, type checking, lint, and production build in Twig.com. Review the page on desktop and mobile, then merge the host PR.

Keep the host PR in draft until the published dependency is installed and verified. A locally packed preview is only for review. It does not prove that a clean consumer install works. PostHog.com needs no update for this Twig-only lesson.
