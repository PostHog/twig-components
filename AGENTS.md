# Working in twig-components

This package supplies reusable Twig views and local PostHog teaching labs. It does not own Twig.com pages or PostHog.com pocket guide content. Before changing it, read [the component reference](docs/components.md), [integration boundaries](docs/integration.md), and [workbench guide](docs/workbench.md). Inspect the closest existing component and its CSS before adding a new one.

## Preserve the design

- Extend an existing component or pattern when it fits. Reuse the spacing, typography, colors, controls, and states already in `src/catalog.css` and `src/lab.css`. Do not add a second styling system, global CSS reset, or new visual language for one component.
- Keep Twig website UI in the Twig style (`catalog.css`, including its Halfre font). Keep PostHog teaching UI in the lab style (`lab.css`, including RoundHog and its existing PostHog tokens). Verify any new PostHog brand value against `brand.posthog.com` rather than guessing.
- Lab styling expects a `.vac-developer-theme` **inside** a `.vac-app` ancestor. Putting both classes on one element leaves parts of the component unstyled. Keep Twig typography out of lab UI and PostHog typography out of Twig views.
- Make new visual states feel like the existing ones. If no pattern fits, explain the gap and the proposed pattern in the handoff so it can receive design review.
- Treat existing component appearance and interactions as a contract. If a change intentionally alters them, show the before and after in the workbench and call it out in the handoff.

## Keep the package portable

- Put reusable views, local lab state, fixtures, and package CSS here. Keep Next.js routes, links, page placement, focus/scroll wiring, and real event calls in Twig.com. Pass those through props and callbacks when a shared component needs them.
- PostHog 101 owns its prose, code examples, event inspector, and “Explore Twig” CTA. Guide views from this package should be focused and read-only. The guide's Shadow DOM wrapper belongs in PostHog.com; do not pull guide UI into this package.
- Preserve existing props, public import paths, and React 18/19 compatibility. Avoid adding a dependency when a small component or existing helper will do.
- Teaching events and AI/booking examples are local simulations. Do not send them to PostHog or another service. Do not use real visitor data, secrets, or production credentials in fixtures or previews.
- Reuse the established catalog and assets in `src/catalog.ts` and `assets/`. Do not invent Twig characters, stays, or character voice while implementing UI; leave new editorial content for review.
- Use periods or en dashes (–) for pauses in Twig-facing copy. Never use em dashes or semicolons there. Keep semicolons where code syntax requires them.

## Finish a component change

1. Add or update its live example in `workbench/App.tsx`. Use local state and callbacks so someone can click through meaningful states; see [workbench instructions](docs/workbench.md). Keep the existing examples working.
2. For a new public component, update `package.json` exports and [the component reference](docs/components.md). Update the relevant CSS file instead of scattering one-off overrides.
3. Check the affected view in the workbench at narrow and wide widths. Exercise keyboard focus, disabled/error states when applicable, and reduced motion for animation. Check the real Twig.com page for host-specific behavior; check PostHog.com only if the guide uses the change.
4. Run `npm test`, `npm run workbench:build`, and `npm run gallery`. Before a release, inspect `npm pack --dry-run`. Add a focused regression test when behavior or a public contract changes.

Summarize what changed, which views and interactions you checked, and any host integration that still needs verification. Do not call a local workspace change a published package update.
