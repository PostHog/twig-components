# Working in twig-components

This package supplies reusable Twig views and local PostHog teaching labs. It does not own Twig.com pages or PostHog.com pocket guide content. Before changing it, read [the visual system](docs/design-system.md), [the component reference](docs/components.md), [integration boundaries](docs/integration.md), and [workbench guide](docs/workbench.md). Inspect the closest existing component and its CSS before adding a new one.

## The visual system is a required contract

The polished Twig visual system is approved, not exploratory. It applies to every existing and new component, page, feature, menu, dialog, form, and state, including login/account, empty/loading/error/success states, and responsive layouts. New features must reuse the approved shared patterns and classes. Do not invent a one-off visual language, restore legacy styling, or use host overrides or inline presentation to bypass the system.

Change the visual contract only when Sarah explicitly requests or approves that specific design-system change. A feature request is not approval to redesign. First compose existing primitives. If a new visual pattern is still necessary, present the gap and proposed pattern for approval before implementing it. Update the shared component, workbench/example, this visual-system guide, and Twig.com’s guide together after approval.

For every UI change, identify the existing patterns being reused and inspect all consumers and states. Shared tokens or broad selectors require Twig.com’s full route/state review, including login and every account page, not only the homepage. Keep Twig and PostHog surfaces distinct. A component is unfinished if an affected consumer drifts from the approved system.

## Preserve the design

Twig pages use a clear page title without an eyebrow, category label, or repeated page-name label above it. Apply this to existing and new pages, including all account sections. Keep meaningful in-content labels, form labels, and PostHog product markers in their established roles.


- Follow [the Twig visual system](docs/design-system.md) for every UI contribution. Keep lesson prose regular, use bold only for headings, controls, and instruction targets, and keep evidence tabs connected without blue selection accents. Check the entire flow so a style change does not affect later instruction steps.
- For every lab and playground, title only the first, progress/recap, and ending pages. Use only the product and `lab` for opening and ending titles: `Product Analytics lab`, `Session Replay lab`, or `AIO lab`. Intermediate teaching pages start with regular prose and have no page title. Put directions to click, send, choose, or interact with Twig in the shared `LabChecklist`; keep lesson navigation as buttons or links.
- Put `How this simulation works` on every lab's first page, after its start button. State what is simulated or stored locally and whether anything is sent to PostHog.
- Extend an existing component or pattern when it fits. Reuse the spacing, typography, colors, controls, and states already in `src/catalog.css` and `src/lab.css`. Do not add a second styling system, global CSS reset, or new visual language for one component.
- Use CSS classes and existing tokens for presentation, not inline `style` props. Put Twig rules in `src/catalog.css` and PostHog rules in `src/lab.css`. Use classes or established state attributes for variants, responsive behavior, and interaction states. Only genuinely runtime measurements (replay cursor coordinates or chart widths) may remain inline, with a short comment explaining why. Brand colors, fonts, spacing, and fixed photo crops must use CSS classes.
- Preserve the settled warm-white, sage, selective-cobalt, and charcoal hierarchy, two Twig fonts, 3px corners, and 4/8/12/16/24/32px spacing rhythm. Do not restyle Playground during Twig branding work.
- Keep Twig website UI in the Twig style (`catalog.css`, using DM Sans for body/interface and smaller headings, and Fraunces for display headings and italic host species). Keep PostHog teaching UI in the lab style (`lab.css`, including RoundHog and its existing PostHog tokens). Verify any new PostHog brand value against `brand.posthog.com` rather than guessing.
- Keep product accents consistent in every lab card and marker: Product Analytics blue, AI Observability purple, Error Tracking yellow, and Session Replay orange. Use the product color mapping in `src/playground.ts` instead of choosing a color per lab. Write product names in Title Case in source and dropdowns. Render the small product labels on lab cards in the established all-caps eyebrow style.
- In playground menus, use the same `--ph-neutral-background` for every product bar and row hover/focus state. Reserve `--ph-neutral-accent` for selected states. Do not change the bar background by product. Product bars span the menu's full inner width; indent the lab rows beneath them instead of padding the whole menu.
- On a lab's opening page, give a brief setup and put the short “what you'll do” preview in the existing white `.vac-guide-example` box. Save detailed directions for the steps where the learner acts.
- When a lab asks the learner to click or change something in Twig, put that direction in `LabChecklist`. Use one item for one action or closely related action group (the blue-left callout), and separate items for two or more sequential steps (the numbered list). Keep the reason and result in prose; do not repeat the click directions there or create another direction style. Apply this to every lab step, including retries and verification.
- Do not stack a small product or lab label above a heading that already names the lab. Use headings at the opening, meaningful progress points, and the ending; leave intermediate directions unlabeled when their context is clear.
- Lab styling expects a `.vac-developer-theme` **inside** a `.vac-app` ancestor. Putting both classes on one element leaves parts of the component unstyled. Keep Twig typography out of lab UI and PostHog typography out of Twig views.
- Make new visual states feel like the existing ones. If composing approved patterns cannot cover the need, get explicit approval for the proposed visual-system change before implementing it; do not leave design review until after shipping a one-off pattern.
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
