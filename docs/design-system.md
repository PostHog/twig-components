# Twig visual system

Use this guide for every new or changed Twig view, playground panel, or lab. The existing components and CSS remain the source of truth; this document records the choices contributors should preserve. Twig.com applies these shared views on the site. See [integration](integration.md) for ownership.

## Approved contract and future work

This is the approved visual contract for all existing UI and every new feature, component, route, dialog, menu, form, and state. It is mandatory, including on login, account, saved/booked stays, fallbacks, mobile layouts, and later lesson steps. Feature development does not authorize new styling, alternate tokens/fonts, a host override, or a one-off visual pattern.

Only Sarah’s explicit request or approval for a specific design-system change authorizes changing these patterns. First compose approved components and primitives. If a new pattern is still necessary, explain the gap and show the proposal for approval before implementation. After approval, update the shared component, workbench/example, this guide, and Twig.com’s guide together. Do not rewrite the rules to excuse visual drift.

The component reference documents APIs; this guide and Twig.com’s visual system define appearance. Correct stale guidance rather than treating previous experiments as alternative designs. Preserve content and behavior unless the task explicitly changes them.

## Two visual surfaces

| Surface | Source | Type and color |
| --- | --- | --- |
| Twig website, chat, stays, and account views | `src/catalog.css` and the host page | DM Sans body and interface type, Fraunces display headings, warm white, and cobalt. |
| PostHog Playground and lessons | `src/lab.css`, inside `.vac-app .vac-developer-theme` | RoundHog and the existing `--ph-*` tokens. |

Keep these surfaces distinct. Reuse an existing component and its state styles before adding CSS. Do not introduce a second font, color system, reset, or decorative treatment for one screen. Verify any new PostHog brand color against `brand.posthog.com`.

## CSS ownership and consistency

Use CSS classes and existing design tokens for presentation, not inline `style` props. Put Twig rules in `src/catalog.css` and PostHog rules in `src/lab.css`. Hosts own routes, page placement, and responsive coordination, without overriding shared component design. Reuse components and classes before adding CSS.

Use classes or existing state attributes for variants and selection, with responsive, hover, focus, disabled/error, and reduced-motion states in CSS. Colors, fonts, spacing, borders, shadows, and fixed image focal points belong in classes. Only runtime measurements such as replay cursor coordinates or data-driven chart widths may use inline styles, with a short source comment. Framework-generated image sizing is not an authored brand rule.

The fixed catalog crop `center 74%` uses `vac-photo-focus-low`; Twig.com maps catalog metadata to that class. Add approved fixed focal variants in CSS rather than inline `object-position` rules.

## Twig brand identity

Twig pages use a clear page title without an eyebrow, category label, or repeated page-name label above it. Apply this to existing and new pages, including all account sections. Keep meaningful in-content labels, form labels, and PostHog product markers in their established roles.


- Keep existing copy, component structure, spacing, listing photography, props, and interactions during a brand pass. The brand exploration is not a new page design.
- Use warm white `--vac-paper: #fffdf6`, cobalt `--vac-ink: #2846a4`, dark charcoal `--vac-text: #30362f`, warm charcoal `--vac-muted: #625e57`, neutral borders `--vac-line: #e5e2d8`, sage `--vac-fill: #edf1e8`, and existing moss `--vac-moss: #3f5b46`. Avoid bright yellow, peach, or blue background panels.
- Use self-hosted DM Sans for body, interface, and smaller headings, with Fraunces reserved for display headings and the existing italic host-species line. Font licenses ship with the assets. Do not substitute these fonts in the PostHog Playground.
- Use 3px corners on Twig cards and controls. Keep circular avatar shapes, but avoid pill buttons or large decorative curves.
- Keep listing photography and PostHog Playground assets only. Use a plain typographic Twig wordmark. Remove the old charcoal illustrations, illustrated logo, and Halfre assets; do not add generated art or new decorative scenes.
- Twig hosts can use fluid page width with readable gutters. Keep existing component arrangements and responsive behavior.

## Browsing stays

Twig.com shows “Browse stays” without an Explore eyebrow or visible count; retain the accessible live count. Detail headers show only the stay name and location, with “← Back” navigation, save controls, and contextual lab markers. Cards group photos, title, price, facts, and compact host rows. Host portraits are 36px circles, empty until supplied, with the existing name and separate italic species line.

The interactive `BrowseStays` can put its search and filters behind a controlled “Search & filters” button beside the heading. Keep applied filter/search state when collapsed and show the active control count on the button. Existing consumers without the disclosure callback keep expanded controls. Browse photos use a restrained 16:9 crop capped at 320px high. Keep its existing filters, result count, copy, callbacks, and cards. This compact toolbar keeps listing photography near the top of the host page. Hosts own optional AI entry placement and whether it is expanded.

## Type hierarchy

- Explanatory paragraphs use regular weight throughout a lesson, including the first paragraph on each step. In the lab, prose is 13px, weight 400, with the existing 1.6 line height. Do not make an opening sentence look like a heading by enlarging or bolding it.
- Reserve bold for actual headings and titles, controls people use, and the action or target in an instruction. Do not bold ordinary terms inside explanatory prose. Keep code and property names in monospace instead of using bold for emphasis.
- Keep the same text treatment on successive steps. Changing the lesson stage should not change the weight or size of equivalent prose.

## Lab and playground page structure

- Give the lab or playground a title on its first page, on deliberate progress or recap pages, and on its ending page. Intermediate teaching pages have no page title or heading-like opening sentence. Start with regular prose, evidence, and directions as needed.
- Name opening and ending pages with only the product and `lab`: `Product Analytics lab`, `Session Replay lab`, or `AIO lab`. Keep the title concrete and avoid question-style or lesson-specific titles. The opening description can explain the specific exercise.
- Put a `How this simulation works` disclosure on every lab's first page, after the start button. Explain what is scripted or recorded locally, whether anything is sent to PostHog, and any real-world action the lab does not perform. Use the existing `vac-lab-step` details pattern.
- Put directions that ask the learner to click, send, choose, or otherwise interact with Twig or another surface in the shared `LabChecklist` component. Use its current, done, and upcoming states when the directions have multiple steps. Keep explanatory prose outside it. Do not substitute a bold paragraph, heading, or custom instruction card for `LabChecklist`.
- Keep lesson navigation as its existing button or link. A control's label is not a substitute for directions when the learner needs to interact with another surface.

## Surfaces and controls

- Group related evidence in one restrained surface: white or neutral fill, a thin existing border, and the radius already used by neighboring cards. Use spacing to show hierarchy. Avoid an extra standalone card or accent when the surrounding surface already groups the content.
- Input/Output and similar evidence tabs form **one connected bar** above their panel. Tabs share an outer border, meet at a divider, and have at least a 44px target. The active tab uses the existing white surface and dark text; inactive tabs use the neutral fill and muted text. Do not add a blue underline, vertical selection stripe, or other decorative highlight to these tabs. Preserve a visible keyboard focus outline.
- A current instruction is a `LabChecklist` item, not a tab. Keep its established current-step indicator and never apply tab text-decoration or tab selection rules to instruction sentences. Choice rows and event rows keep their own established selected states.
- Use the existing dark code block and yellow `mark` treatment to point to the relevant code. Let long code scroll or wrap within the panel without making the page overflow.

## States and responsive behavior

- Show the initial, active, disabled, error, and completed states that apply to a component. Keep click targets reachable by keyboard and preserve focus when a chat reply arrives.
- Check the actual Twig.com page as well as the workbench. At desktop width, chat and lesson should be usable side by side. At 390px and 320px, check mobile panel switching, text wrapping, code scrolling, and horizontal overflow. Respect reduced motion for animation.
- A visual pass changes presentation only. Preserve copy, content, props, lesson order, and interactions unless the task explicitly asks to change them. Test the whole affected flow; a CSS selector can unintentionally change later steps.

## Review checklist for UI contributions

1. Compare the changed view with its neighboring Twig views or labs and reuse their typography, spacing, surfaces, controls, and states.
2. Review the entire affected flow at desktop and mobile widths. Confirm titles appear only on the first, progress/recap, and ending pages, and interaction directions use `LabChecklist`.
3. Check keyboard focus, disabled and error states where relevant, and reduced motion for animation.
4. Run `npm test`, `npm run workbench:build`, and `npm run gallery`; inspect the actual Twig.com integration before calling it finished.
5. If a PR includes screenshots, update them when a visual change makes them stale. Show the actual site for host layout and the workbench for portable component states.

When an explicitly approved new pattern is needed, document the approved decision here and in Twig.com’s design guide with the shared implementation and workbench example. Do not let a one-off override silently become a new system.


## Conventional trip search

Use `TripSearch` as the primary utility for vacation-rental browsing. Reuse the date and guest pickers. At narrow widths, keep destination and Search stays visible and put optional dates/guests behind their compact summary. Setting filters remain a separate disclosure. Hosts own validation, capacity/destination matching, selection transfer to booking, and content-free analytics; never imply that the local catalog has availability inventory. Keep photo, title, nightly price, location, and capacity close together. Attribute hosting with existing character names and species, without artwork or invented character copy.


Destination suggestions represent places from the host catalog. Keep setting and amenity controls inside the same search area, separate from destination choices. Preserve immediate setting clicks so teaching labs can compare repeated selections. Keep the existing `destination_type` teaching property for compatibility, explaining that it records the stay setting. Amenities use distinct host analytics and do not create simulated setting events. Update both ghost and manual replay when input selectors or search submission behavior change.


The settled search surface is sage with neutral labels and borders. Hosts use warm-white headers, cobalt wordmarks, and quiet charcoal secondary navigation. Browse stays uses a charcoal sans-serif heading. Keep these colors scoped to Twig views; PostHog retains its existing tokens.

## Integrated getaway search

`SearchWorkspace` and `GetawaySearch` are exported from `/trip-planner`. Tabs read “Search stays” and “AI trip planner”, with conventional search selected first. Keep the sparkle icon without a plus. The location field remains “Destination”. The workbench includes a working Getaway search view. Hosts supply preferences, navigation, booking transfer, and content-free outcome analytics. The original `TripPlanner` and guided labs remain unchanged.

The shared workspace is a single sage surface with quiet neutral boundaries and no cobalt outer outline. Desktop search controls share 48px heights. Mobile keeps destination and search visible, with dates and guests in their compact disclosure. All placeholders, typed/selected values, date and guest controls, and choices use warm charcoal at full opacity. Keep primary actions cobalt, selected-calendar contrast, and visible caret/keyboard focus.

AI capabilities belong in the local simulated conversation: help choosing, budgets, dates, mismatches, and recovery. The initial planner contains an editable composer and “Simulated AI responses”. Do not add trip summaries, Edit trip, suggestion buttons, or separate feature controls. Unknown requirements must be clarified rather than assumed.

Sending opens a non-modal collapsible chat on the left. Keep a cobalt title bar with warm-white title, sage body, warm-white composer and visitor bubbles, neutral border, and restrained shadow. Programmatic heading focus has no box; controls retain visible focus. Collapsing preserves messages and draft. Mode switching does not close chat. Keep this styling scoped to GetawaySearch, leaving Playground and guided chat unchanged.

Assistant prose is warm charcoal on sage. Results are separate warm-white cards with neutral borders, 3px corners, catalog photos/facts, and full-width cobalt View stay actions. Avoid unsolicited comparisons with other property types. Clarify factual limitations when relevant to a requested amenity.

Conversation preferences remain independent of conventional search. Messages never change background listings, fields, dates, guests, filters, or displayed budgets. Seed from the current search, then retain separate state. Only clicking a stay transfers trip details and navigates.

## Refinement and hierarchy

Use two Twig typefaces: Fraunces for display headings and the existing italic species line, DM Sans for interface text and smaller headings. Use dark charcoal `#30362f` for listing titles and prices, warm charcoal for facts and field text, and cobalt for the main display heading, wordmark, links, primary actions, and chat title bar. PostHog retains RoundHog and its existing tokens.

Use a 4/8/12/16/24/32px spacing rhythm. Keep the introduction compact, align the search and photographs to fluid page gutters, and retain the shared 16:9 photo crop. Search controls share 48px heights on desktop, quiet internal borders, neutral labels, and a single sage surface. Mobile retains the existing compact date/guest disclosure. Never add a capped page container or push listing photography into a large marketing hero.

Listing photos use consistent framing and a restrained hover treatment, with quiet facts and compact host rows below. Preserve supplied photos, copy, empty portraits, and keyboard focus. Transitions are brief and disabled for reduced motion. Chat uses charcoal conversation text, warm-white visitor messages, sage background, cobalt title bar, and a restrained neutral shadow. Host placement aligns it with page gutters and reserves space when the lab dock is open. Keep Playground styling, size, and animation unchanged.

For presentation-only changes, preserve behavior and existing tracking; do not add an analytics event solely for styling.

## Account surfaces

Profile menus, sidebars, facts, settings, and booking details use charcoal text, neutral borders, sage hover/selected surfaces, and restrained neutral shadows. Cobalt belongs to display headings and meaningful actions. Use Fraunces for page titles and DM Sans for card headings and menu identity. Keep 44px interactive targets, visible keyboard focus, and existing Escape/return-focus behavior. Avoid offset/double shadows and nested decorative card borders. Host element defaults must not override these shared component rules.

## Full-site verification

A component change must be reviewed in every host surface that uses it, including initial, selected, editing, empty, populated, loading, disabled, error, and success states where applicable. Changes to shared tokens, fonts, global selectors, navigation, or layout require the full route/state inventory in [Twig.com’s design guide](https://github.com/PostHog/twig.com/blob/main/docs/design-system.md#required-route-and-state-coverage): homepage, About, login, every catalog stay, all four account routes, profile menu, 404/error boundaries, and affected labs. Review complete page content at desktop, 390px, and 320px. Keep sidebar row heights consistent on narrow screens, including the selected Account settings link.

Run the package checks and inspect the actual Twig site using the exact local package build. Compare photography, headings, field text, buttons, spacing, neutral borders/shadows, keyboard focus, reduced motion, and overflow. Workbench previews alone do not establish site-wide consistency.

The decorative AI sparkle uses the shared `twig-ai-icon` class at 18px square so it remains proportional to the planner label.

## Playground window contrast

The invitation and open dock use PostHog.com’s solid light tertiary window surface `#e5e7e0` and border `#9ea096`, with the product’s existing raised-edge and modal-shadow treatments. This is the source-backed contrast adjustment requested for Twig’s warm-white surroundings. Keep it in `lab.css`, scoped to the invitation/dock shell, not a Twig override or a new global neutral palette. Retain the original RoundHog, logo, dimensions, animation, CTA, white lesson cards, product accents, menu gray, and lesson flow.

Sources: [PostHog.com light tertiary scheme](https://github.com/PostHog/posthog.com/blob/master/src/styles/global.css), [window scheme](https://github.com/PostHog/posthog.com/blob/master/src/constants/frostedSurfaces.ts), [PostHog product surfaces and elevation](https://github.com/PostHog/posthog/blob/master/frontend/src/styles/base.scss), [brand colors and RoundHog](https://brand.posthog.com/catalog.json). The brand catalog defines colors and assets; the repos supply the UI patterns. Do not invent a bright brand-colored panel merely because its hue appears in the palette.
