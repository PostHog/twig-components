# Twig visual system

Use this guide for every new or changed Twig view, playground panel, or lab. The existing components and CSS remain the source of truth; this document records the choices contributors should preserve. Twig.com applies these shared views on the site. See [integration](integration.md) for ownership.

## Minimum text, intuitive interactions

Keep prose and text to a minimum across Twig, the Playground, and every lab. Prefer intuitive, familiar controls and seamless flows over explanations. Make the next action obvious through the interface. Keep only essential context, avoid repeating labels or describing self-evident controls, and reveal detail where it is needed. Teach concepts when necessary, without front-loading instructions. This is a leading design principle, including on landing pages.

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

## Corner radius

Twig cards and controls use 3px. PostHog Playground and labs use one 4px default through `--ph-radius-sm`, including buttons, fields, cards, menus, windows, tooltips and inline code. Do not introduce size-based radius variants. Circular avatars/markers remain circular; connected surfaces and viewport-joined dock edges retain square joining corners. This is the approved learning-system standard, not a universal PostHog brand mandate.

## Playground elevation

Labs and Playground content stay flat in every state, including hover. Do not apply shadows, raised edges or hover lift to lessons, summaries, evidence, tables, code surfaces or content cards. Use neutral borders and spacing for grouping. The attached dock and tool rail remain flat.

Elevation is restricted to separate UI roles: the existing soft `--ph-window-shadow` for floating overlays, and established raised controls or dropdown/popover treatments. OS buttons retain their own base/face construction. Never stack a raised edge and soft shadow as a generic panel style, or apply control elevation to lab content. Twig keeps its own existing shadows.

## Dropdowns

All Twig dropdown menus reuse `twig-dropdown-menu` and `twig-dropdown-item`: warm-white surface, 1px neutral border, 3px corners, 6px menu padding, the shared soft shadow and an 8px trigger gap. Rows use DM Sans 15/24, 8px 12px padding, a 44px minimum target, sage hover/selection and a visible keyboard-focus ring. Guest choices, destination suggestions and the account menu share these classes. Keep their existing content, selection semantics and keyboard behavior. Calendar popovers share the outer surface, with their existing 16px padding and calendar grid. Playground menus retain their separate PostHog styling.

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

TripSearch keeps destination, dates, guests, and Search stays visible at every width. Only optional setting and amenity filters collapse behind Filters; do not add a date/guest summary toggle. Mobile uses full-width destination and guest fields, paired date fields, left-aligned Filters and a full-width Search stays action at the end. Expanded settings use two equal columns.

## Type hierarchy

- Explanatory paragraphs use regular weight throughout a lesson, including the first paragraph on each step. In the lab, prose is 13px, weight 400, with the existing 1.6 line height. Do not make an opening sentence look like a heading by enlarging or bolding it.
- Reserve bold for actual headings and titles, controls people use, and the action or target in an instruction. Do not bold ordinary terms inside explanatory prose. Keep code and property names in monospace instead of using bold for emphasis.
- Keep the same text treatment on successive steps. Changing the lesson stage should not change the weight or size of equivalent prose.

## Lab and playground page structure

- Give the lab or playground a title on its first page, on deliberate progress or recap pages, and on its ending page. Intermediate teaching pages have no page title or heading-like opening sentence. Start with regular prose, evidence, and directions as needed.
- Name labs for the PostHog concept they teach, not their Twig location or product alone. Use `touchpointDefinitions` titles consistently in directories, markers, openings, and completions. Keep intermediate pages untitled.
- Put a `How this simulation works` disclosure on every lab's first page, after the start button. Explain what is scripted or recorded locally, whether anything is sent to PostHog, and any real-world action the lab does not perform. Use the existing `vac-lab-step` details pattern.
- Put directions that ask the learner to click, send, choose, or otherwise interact with Twig or the guided Playground in the shared `LabChecklist` component. Use its current, done, and upcoming states when the directions have multiple steps. Keep explanatory prose outside it. Do not substitute a bold paragraph, heading, or custom instruction card for `LabChecklist`.
- Keep lesson navigation as its existing button or link. A control's label is not a substitute for directions when the learner needs to interact with another surface.

## Surfaces and controls

- Group related evidence in one restrained surface: white or neutral fill, a thin existing border, and the shared 4px Playground radius. Use spacing to show hierarchy. Avoid an extra standalone card or accent when the surrounding surface already groups the content.
- Input/Output and similar evidence tabs form **one connected bar** above their panel. Tabs share an outer border, meet at a divider, and have at least a 44px target. The active tab uses the existing white surface and dark text; inactive tabs use the neutral fill and muted text. Do not add a blue underline, vertical selection stripe, or other decorative highlight to these tabs. Preserve a visible keyboard focus outline.
- A current instruction is a `LabChecklist` item, not a tab. Keep its established current-step indicator and never apply tab text-decoration or tab selection rules to instruction sentences. Choice rows and event rows keep their own established selected states.
- Use the shared light `PlaygroundCodeBlock` with full-width line/section highlighting to point to relevant code. Let long code scroll or wrap within the panel without making the page overflow.

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

Use `TripSearch` as the primary utility for vacation-rental browsing. Reuse the date and guest pickers. At narrow widths, keep destination, paired dates, guests, and Search stays visible. Only optional setting and amenity filters use a disclosure. Hosts own validation, capacity/destination matching, selection transfer to booking, and content-free analytics; never imply that the local catalog has availability inventory. Keep photo, title, nightly price, location, and capacity close together. Attribute hosting with existing character names and species, without artwork or invented character copy.


Destination suggestions represent places from the host catalog. Keep setting and amenity controls inside the same search area, separate from destination choices. Preserve immediate setting clicks so teaching labs can compare repeated selections. Keep the existing `destination_type` teaching property for compatibility, explaining that it records the stay setting. Amenities use distinct host analytics and do not create simulated setting events. Update both ghost and manual replay when input selectors or search submission behavior change.


The settled search surface is sage with neutral labels and borders. Hosts use warm-white headers, cobalt wordmarks, and quiet charcoal secondary navigation. Browse stays uses a charcoal sans-serif heading. Keep these colors scoped to Twig views; PostHog retains its existing tokens.

## Integrated getaway search

`SearchWorkspace` and `GetawaySearch` are exported from `/trip-planner`. Tabs read “Search stays” and “AI trip planner”, with conventional search selected first. Keep the sparkle icon without a plus. The location field remains “Destination”. The workbench includes a working Getaway search view. Hosts supply preferences, navigation, booking transfer, and content-free outcome analytics. The original `TripPlanner` and guided labs remain unchanged.

The shared workspace is a single sage surface with quiet neutral boundaries and no cobalt outer outline. Desktop search controls share 48px heights. Mobile keeps destination, paired dates, and guests visible, followed by optional Filters and a full-width Search stays action. All placeholders, typed/selected values, date and guest controls, and choices use warm charcoal at full opacity. Keep primary actions cobalt, selected-calendar contrast, and visible caret/keyboard focus.

AI capabilities belong in the local simulated conversation: help choosing, budgets, dates, mismatches, and recovery. The initial planner contains an editable composer and “Simulated AI responses”. Do not add trip summaries, Edit trip, suggestion buttons, or separate feature controls. Unknown requirements must be clarified rather than assumed.

Sending opens a non-modal collapsible chat on the left. Keep a cobalt title bar with warm-white title, sage body, warm-white composer and visitor bubbles, neutral border, and restrained shadow. Programmatic heading focus has no box; controls retain visible focus. Collapsing preserves messages and draft. Mode switching does not close chat. Keep this styling scoped to GetawaySearch, leaving Playground and guided chat unchanged.

Assistant prose is warm charcoal on sage. Results are separate warm-white cards with neutral borders, 3px corners, catalog photos/facts, and full-width cobalt View stay actions. Avoid unsolicited comparisons with other property types. Clarify factual limitations when relevant to a requested amenity.

Conversation preferences remain independent of conventional search. Messages never change background listings, fields, dates, guests, filters, or displayed budgets. Seed from the current search, then retain separate state. Only clicking a stay transfers trip details and navigates.

## Refinement and hierarchy

Use two Twig typefaces: Fraunces for display headings and the existing italic species line, DM Sans for interface text and smaller headings. Use dark charcoal `#30362f` for listing titles and prices, warm charcoal for facts and field text, and cobalt for the main display heading, wordmark, links, primary actions, and chat title bar. PostHog retains RoundHog and its existing tokens.

Use a 4/8/12/16/24/32px spacing rhythm. Keep the introduction compact, align the search and photographs to fluid page gutters, and retain the shared 16:9 photo crop. Search controls share 48px heights on desktop, quiet internal borders, neutral labels, and a single sage surface. Mobile keeps destination, paired dates, and guests visible; only optional setting and amenity filters collapse. Never add a capped page container or push listing photography into a large marketing hero.

Listing photos use consistent framing and a restrained hover treatment, with quiet facts and compact host rows below. Preserve supplied photos, copy, empty portraits, and keyboard focus. Transitions are brief and disabled for reduced motion. Chat uses charcoal conversation text, warm-white visitor messages, sage background, cobalt title bar, and a restrained neutral shadow. Host placement aligns it with page gutters and reserves space when the lab dock is open. Keep Playground styling, size, and animation unchanged.

For presentation-only changes, preserve behavior and existing tracking; do not add an analytics event solely for styling.

## Account surfaces

Profile menus, sidebars, facts, settings, and booking details use charcoal text, neutral borders, sage hover/selected surfaces, and restrained neutral shadows. Cobalt belongs to display headings and meaningful actions. Use Fraunces for page titles and DM Sans for card headings and menu identity. Keep 44px interactive targets, visible keyboard focus, and existing Escape/return-focus behavior. Avoid offset/double shadows and nested decorative card borders. Host element defaults must not override these shared component rules.

## Full-site verification

A component change must be reviewed in every host surface that uses it, including initial, selected, editing, empty, populated, loading, disabled, error, and success states where applicable. Changes to shared tokens, fonts, global selectors, navigation, or layout require the full route/state inventory in [Twig.com’s design guide](https://github.com/PostHog/twig.com/blob/main/docs/design-system.md#required-route-and-state-coverage): homepage, About, login, every catalog stay, all four account routes, profile menu, 404/error boundaries, and affected labs. Review complete page content at desktop, 390px, and 320px. Keep sidebar row heights consistent on narrow screens, including the selected Account settings link.

Run the package checks and inspect the actual Twig site using the exact local package build. Compare photography, headings, field text, buttons, spacing, neutral borders/shadows, keyboard focus, reduced motion, and overflow. Workbench previews alone do not establish site-wide consistency.

The decorative AI sparkle uses the shared `twig-ai-icon` class at 18px square so it remains proportional to the planner label.

## Playground window contrast

The invitation and inline dock use PostHog.com’s solid light tertiary window surface `#e5e7e0` and border `#9ea096`, with the existing soft shadow on the floating invitation only. The attached dock and all lab content stay flat. This is the source-backed contrast adjustment requested for Twig’s warm-white surroundings. Keep it in `lab.css`, scoped to the invitation/dock shell, not a Twig override or a new global neutral palette. Retain the original RoundHog, logo, dimensions, animation, CTA, white lesson cards, product accents, menu gray, and lesson flow.

Sources: [PostHog.com light tertiary scheme](https://github.com/PostHog/posthog.com/blob/master/src/styles/global.css), [window scheme](https://github.com/PostHog/posthog.com/blob/master/src/constants/frostedSurfaces.ts), [PostHog product surfaces and elevation](https://github.com/PostHog/posthog/blob/master/frontend/src/styles/base.scss), [brand colors and RoundHog](https://brand.posthog.com/catalog.json). The brand catalog defines colors and assets; the repos supply the UI patterns. Do not invent a bright brand-colored panel merely because its hue appears in the palette.

## Inspect Twig exploration (preview)

The current exploration replaces Twig.com’s large invitation with a persistent PostHog tools rail and an inspection workspace before guided labs. This is a reviewable prototype requested by Sarah, not a replacement for the locked Twig brand or an approved global redesign of existing labs. Compose the existing PostHog menu/choice states, product icons, `LabChecklist`, neutral evidence surfaces, and OS buttons. Retain product colors and all existing guided lab steps.

The workspace distinguishes observed local interactions from teaching events and lets the host locate controls, start a lab, or navigate to labs on another page. Keep raw visitor input out of the activity preview and analytics. The older directory/invitation remain available to embedded consumers.

The earlier review variant used a horizontal right-edge `PlaygroundLauncher` tab and `PlaygroundDock placement="edge"`: a compact PostHog window toolbar, collapse control, and slide-in motion with a reduced-motion alternative. Hosts place the drawer and reserve room for Twig. The original inline dock remains the default for other consumers. Existing product choices, evidence, and guided lessons are unchanged.

The edge launcher label reads horizontally, with logo and expand icon alongside it. Do not rotate text or use vertical writing. Narrow hosts may put the tab in the page flow to avoid obscuring controls.

### Tool rail and dedicated inspection view

Sarah requested a persistent neutral tool rail with the existing PostHog logo/product icons, an inspect cursor, hover/focus labels, and a collapse control. `PlaygroundToolRail` and `PlaygroundPickerHint` are additive `/playground-panels` exports. The rail remains visible beside `PlaygroundDock placement="edge"`. `PlaygroundExplorer selectedId` lets the host select a feature without starting or changing a lesson. The host owns an allowlisted in-memory instrumentation stream, DOM focus restoration, routing, and analytics. Inspect opens the dedicated `PlaygroundInspectionView`; it does not intercept normal Twig actions. Reuse the existing neutral selected states, blue target outline, and product assets. No vertical text, raised launcher, recorded DOM content, or changed lesson copy. This remains a reviewable prototype.

At narrow widths the persistent rail becomes a bottom tool strip, preserving Twig’s full content width. Keep tooltips inside the viewport and chat/replay controls above that strip. The host places those windows; search uses its own width as a container for its established responsive layouts.

The rail uses the existing PostHog cursor and product icons. The logo is the Home button, controlled by `homeOpen` and `onHomeOpened`, with the same neutral selected state, tooltip, and keyboard focus as the other tools. Keep Home and collapse available on mobile, with no question-mark control. The edge workspace has no header collapse control.

The logo image is decorative inside the named Home button. `toggleRef` belongs to the separate expand/collapse control. Hosts return focus to the inspect control on mobile.

## Seamless tools and contextual instrumentation

The open edge workspace, its header, and permanent tools rail share `--ph-neutral-background`. Use one thin neutral divider between workspace and icon rail. Preserve white lesson preview/evidence cards; omit the header separator so the shell remains uninterrupted. This applies to edge placement only; other consumers retain their shell.

Instrumentation markers show a nearby tooltip on hover or keyboard focus: the existing product icon/name, one short tracking explanation, and “Click to learn about it”. Reuse `PlaygroundInstrumentationTooltip` for the allowlisted element picker too. Do not put instrumentation details in a bottom-left toast. Tooltips use RoundHog and existing PostHog neutral tokens, remain inside the viewport, and dismiss with Escape. Only their runtime viewport coordinates use inline styles. Marker clicks open their existing lab directly, including while inspection is active. The rail collapse control and Escape close inspection. This presentation uses existing tracking and does not capture additional data.


## Dedicated live inspection

Inspect opens `PlaygroundInspectionView` with an interaction → instrumentation → expandable evidence structure from [PostHog.com’s pocket-guide Inspector](https://github.com/PostHog/posthog.com/blob/14cab9937501ec4419fc980a2eff2ec8e99a90a2/src/components/PocketGuides/PostHogInspector.tsx). Reuse its syntax treatment, native disclosures, nested property tree, and code palette in the shared `InstrumentationInspector`. Add selectable event history for live Twig interactions. Keep the existing guide implementation and embeds unchanged. This full Playground counterpart was explicitly requested by Sarah.

Avoid decorative status/metadata labels such as “Listening · Local preview”, “selected node”, or “selected properties”. Only functional section names and controls belong here. Do not add a lab CTA or learning prompt to the Inspector; labs remain available from product tabs and markers. The edge dock has no top collapse control; its rail owns collapse, including on mobile. Desktop host placement reserves 380px, rather than making the Inspector a wide marketing panel.

Normal Twig interactions continue to work while inspection is open. Hosts observe existing instrumentation calls locally and pass only fixed event names and allowlisted safe properties. Keep the visit-long collection in host memory, across routes and toolbar modes. Never project visitor prompts, search text, dates, guest counts, account data, error messages/stacks, or replay contents. Fixed lab examples may show their own predefined teaching messages. Keep event names monospace, product colors/icons unchanged, and reuse the source-backed Inspector syntax/trees, neutral selection states, separators, and text-link controls. The view does not upload or persist teaching data. Observing a site event must not produce a second analytics event.

Clicking the active Inspect or product tool again collapses its workspace; clicking a different tool switches views. A closed workspace has no pressed tool. Reopening preserves the existing inspection and lesson state. Use the same toggle behavior for pointer and keyboard activation.

The edge dock uses a controlled `open` prop with a reversible 240ms transition in both directions. Keep it mounted through closing; it becomes inert and hidden from assistive technology immediately, then unmounts after exit. Host page-width/mobile-height transitions use the same timing and easing. Reduced motion removes movement. Do not restore an enter-only animation or conditionally remove the dock at the start of closing.

For a dock joined to the permanent rail, pass `joinedBranding` to both components. Keep the single PostHog logo fixed in the desktop rail; the expanded edge header renders only “PostHog Playground”, without a second logo or reserved logo gap. Preserve panel motion and mobile rail controls. Inline consumers retain their existing branding.

Toolbar hover labels use RoundHog, the existing PostHog neutral surface and toolbar border, compact padding, and the directional pointer used by PostHog.com’s Radix tooltip. Keep them flat rather than presenting a second white card. Hover labels have a short delay; keyboard focus is immediate and Escape dismisses them. Associate each label with its tool. Mobile labels stay within the viewport.


## Inspector teaching flow

Keep one narrow, pocket-guide-style evidence frame: Console selection, one concise explanation of what happened, the actual capture call, then expandable event data. Full handlers, the tracking helper, and the autocapture comparison are disclosures. Do not force an Elements section onto non-DOM evidence or show missing-element placeholders. Reuse the existing syntax palette, native disclosures, and neutral borders. Keep explanations short and regular.

Classify records by instrumentation: custom AI-feature usage events remain Product Analytics, `$ai_generation` is AI Observability, `$exception` is Error Tracking, and replay uses recording/masking configuration. Hosts may provide linked product events and local generations with the same optional `operationId`. Select the matching record directly from the console. Reuse the existing AIO teaching model and identify simulated generations once. Show model, latency, tokens, cost, and the supplied trace/generation IDs using the existing facts and trace views. Keep visitor messages and preferences out of site observation. The standalone example remains available for consumers without connected evidence.

`PlaygroundInspectionView` accepts optional `describe(activity)` and `contexts` with `InspectionGuide` values. Hosts own exact source excerpts and safe event projection. `inspectionProduct` classifies the event rather than its feature location. `replayInspectionGuide` exposes only current privacy/recording settings; recording contents, prompts, personal details, error messages and stacks stay out of site observation. Existing inspection-selection callbacks cover related-evidence selection and lab entry.


## Shipping toolbar scope

Keep the existing tool rail, 380px dock, motion, branding, and dedicated Inspector. Product icons open one `ProductLabLanding` per product, built from the existing `vac-lab-directory-list` cards and start controls. `labsForProduct(id)` lists every existing lab for that product across all Twig routes, without duplicate per-page entries, nested feature explorers, or live activity on the landing. Keep lesson content and flow untouched.

Instrumentation circles retain their product colors and hover/focus notes. Notes name the actual capture mechanism and useful properties. Clicking a marker opens its existing lab, even from Inspect; hosts may resume the selected lesson instead of resetting it. Do not turn marker clicks into another inspection context-selection step. Existing lab-start/resume and product-selection callbacks cover tracking.

The open edge Playground is one neutral surface with a single divider between the icon rail and content (above the bottom rail on mobile): no outer frame or header separator. Keep the divider below the desktop rail logo in both expanded and collapsed states. Keep borders on content cards, evidence, and controls. Its content scrollbar uses a thin neutral thumb on a transparent track without a reserved gutter; hosts should also keep the page scrollbar track transparent. Closed toolbar boundaries remain unchanged.

The PostHog logo is the Playground Home button. Use the existing rail button, neutral selected state, Home tooltip, and visible keyboard focus; keep it available on mobile. Home starts expanded on Twig.com with `PlaygroundHome`: a brief introduction, Take a tour, and the lab directory. Selecting a product or Inspect leaves Home; selecting Home does not reset lessons or console history. There is no question-mark control or help page in the toolbar. Hosts own the controlled Home state and activation analytics.

Lab names describe the PostHog concept taught. The six toolbar labs are Events and properties; Breakdowns by property; Funnels and conversion events; Traces, generations, and evaluations; Session playback and masking; and Exceptions and issue resolution. Shared `touchpointDefinitions` owns the names; stable IDs, event names, lesson exercises, and page/action labels stay unchanged.

Inspector disclosures reuse [PostHog.com’s Radix Accordion](https://github.com/PostHog/posthog.com/blob/master/src/components/RadixUI/Accordion.tsx): flat full-width rows, left-aligned labels, and the exact PostHog IconPlus/IconMinus glyphs on the right. Use the shared `InspectorSummary` for code sections, nested setup, payloads, and property objects. Hide browser markers, retain native details keyboard/state semantics, use quiet neutral hover and visible focus, and keep 44px targets. The console is always visible, not a disclosure. Do not apply this change to lesson accordions or add a lab CTA.

`PlaygroundInspectionView` uses one black terminal console above the selected-event Inspector. Its chronological records are the event history: select an earlier event to pin it, or use Track live events to resume. Clear console removes prior records from the visible console and selection. Controlled `session`/`onSessionChange` retains selection and clearing across routes and toolbar unmounts. Timestamp sits above the left-aligned event name; properties align beneath the name. The console uses PostHog.com’s `borderRadius.sm` (4px) on all corners and clips child rows to that shape. Records retain the black surface without selection outlines or gray shading. The selected event name and related records sharing its `operationId` use the brand palette’s darker yellow (`#E58E00`, [source](https://brand.posthog.com/catalog.json)); unrelated event names and console controls remain neutral. Keep exactly one selected record for the detail view and keyboard focus; highlighting a related record does not select it. Clear console and Track live events occupy a compact control row on the same black surface as event output, without a visible Console title, with no divider. Use compact borderless controls with the tool rail’s neutral hover/focus treatment. Clear console is a 16px Playground reset icon with an accessible name and tooltip in a 28px button; touch pointers retain 44px targets. Keep the header compact and the controls transparent at rest. The outer console frame owns the shared 4px corners and clips the joined header and event area. Controls stay outside the event output; keep disabled controls readable without underlines or bright accents. Keep the actual capture call and expandable data below. No separate History view, command prompt, duplicated full JSON, or lab CTA.

## Selected-event drill-down

The console remains unchanged. `PlaygroundInspectionView` enables the optional `InstrumentationInspector drilldown` presentation beneath it: matching neutral chrome, borders, 4px corners, and 12px alignment. Show the readable interaction title once and its explanation together, without repeating the event name already selected in the console. “How it’s tracked” opens the exact call in a quiet neutral code surface, with a compact filename below it; the full path stays available on the location. Twig source code and event data remain expandable. Preserve the existing source, data, related-record navigation, native disclosure semantics, and keyboard focus. Scope these rules to `.vac-inspector-drilldown`; standalone examples, lesson evidence, and every console selector retain their existing design. Presentation changes reuse existing tracking.

Drill-down disclosure hover keeps every row transparent, including nested property objects. Keep label text color fixed, including Twig source code. Signal hover only through the muted-to-ink plus/minus affordance. Preserve the existing focus-visible outline and native expanded state. Do not add hover tiles, selection fills, movement, or console style changes.

“How it’s tracked” preserves multiline source indentation without horizontal scrolling. Soft-wrap long lines at whitespace or identifier separators such as underscores, dots, and slashes; align continuation lines with their original indentation. Use emergency wrapping only for an otherwise unbreakable token at narrow widths. Soft-wrap hints add no characters to copied code. Format actual instrumentation calls with the event name on its own line and one property per line, then regenerate host source excerpts. Product Analytics may lead with a generated equivalent SDK capture, using `InspectionSource.caption=""` to omit the caption and file location. Keep actual file locations with the underlying Twig implementation. Hosts derive it from real event arguments and retain the actual implementation under Twig source code. Never handwrite a divergent example or mislabel one as a literal source excerpt.

Console-linked inspection uses `additionalProperties` to avoid repeating the feed. One shared preview recipe supplies both the unchanged console text and the omitted/truncated properties. Hide the data disclosure when the console shows everything. Otherwise show “More event data” containing only omitted properties and the complete values of truncated properties; never repeat the event name or timestamp. AI generation previews show model and latency, so their additional inputs, outputs, usage, and trace data remain inspectable. Preserve Recording configuration as product-specific evidence. Standalone inspectors retain their complete payload by default. Existing tracking covers the presentation change.

“How it’s tracked” and “Twig source code” are independent sibling disclosures with identical heading typography, spacing, and controls. Keep Twig call, Event handler, Tracking helper, and specifically named optional capture settings beneath Twig source code. Indent their labels by 12px while retaining the same right inset for every source disclosure icon; indent labels, not entire rows. Preserve source filenames/line numbers and standalone Inspector layouts.

Inspector headers retain the original neutral gray (`--ph-neutral-accent`) for Console chrome and the selected interaction title. Peer disclosure headings keep their transparent white surface and fixed dark text. Preserve the independent Twig source code hierarchy, indented labels, aligned controls, and transparent disclosure hover.

Long Twig source snippets use PostHog.com CodeBlock’s line highlighting: a 10% wash of its `#F7A501` yellow behind relevant instrumentation lines, retaining syntax colors and readable context. Source-relative, one-based `highlightLines` come from AST source locations rather than inserted annotation comments. Preserve copyable code, line numbers, wrapping, and gray headers. Highlight the selected event call in its handler and the appropriate SDK/publisher/configuration logic in shared helpers; do not highlight unrelated events in the same function. Source: https://github.com/PostHog/posthog.com/blob/master/src/components/CodeBlock/index.tsx.


More event data matches the peer source disclosure heading (12px/600), with consistent 12px monospace property text and neutral tree borders. Console-linked additional data lists omitted properties directly, without a redundant properties wrapper; nested arrays/objects start collapsed to keep long AI payloads manageable. All values remain inspectable with native plus/minus disclosures. Related product/generation navigation uses console selection, without duplicate links below the Inspector; the introduction explicitly explains selecting any current or earlier entry. Preserve approved source-code views and console styling.

Both the regular and guided chat window titles read “AI trip planner” with the existing `AiSearchIcon` sparkles, matching the search tab. Reuse the shared 18px icon, an 8px gap, and the existing header typography/colors; preserve dialog naming, heading focus, collapse/close controls, and tracking.

AI generation drill-downs follow concept → How it’s tracked → collapsed Generation details → Twig source code → additional raw data. Lead with a manual Node SDK example explained in surrounding prose of `posthog.capture({ distinctId, event: "$ai_generation", properties })`, noting that provider wrappers capture automatically. Actual local simulation helpers remain in Twig source code. Keep model/latency/token/cost/trace values in Generation details, and omit those displayed values from More event data. Preserve partial metrics in raw data when the summary cannot display them. Twig sends neither this example nor simulated records to PostHog. Verified against the AI Observability generations, manual capture, traces, and calculating-costs docs on 2026-10-21.

Inspector disclosure descriptions and generation summaries start immediately after the existing heading-row padding, without another top padding layer. Reuse `.vac-inspector-context` with the shared direct-child disclosure rule; use 8px between explanatory prose and its following code block and retain 12px horizontal content insets. Apply consistently to primary and nested source descriptions and generation details.

Stay-detail gallery photo frames have a 480px maximum height, including the single-photo fallback. Preserve fluid widths, existing aspect ratios below the cap, object-fit cover, photo focus, credits, and mobile stacking. The cap is in CSS pixels so gallery height scales with browser page zoom instead of growing indefinitely with the enlarged layout viewport.

Do not use explanatory captions anywhere in Twig, the Playground, or labs. Do not add explanatory notes inside or beneath code samples, including “Equivalent PostHog capture” or “Manual capture example · posthog-node”. Put necessary explanations in the surrounding prose. Actual source filenames and line numbers are source references.

## Shared PostHog data tables

All tables in the Playground and labs use the shared `vac-lab-table` class from `lab.css`, including generation details, recorded events, event properties, and exception properties. Use semantic table markup and `scope="col"` or `scope="row"` on headers. Do not add explanatory captions.

Use RoundHog at 12px/1.7, dark neutral text, 600-weight headers, 8px vertical / 12px horizontal cell padding, top-aligned cells, white body rows, and thin neutral horizontal dividers. Column headers use the existing neutral background; row headers stay white. Keep identifiers and code monospace at the same size. Use fixed layout, full width, and wrapping values rather than horizontal scrolling or truncation. The `vac-lab-table-key-value` variant uses a consistent 40% label / 60% value split. Other functional column widths may follow the data, as in the recorded-event list. Preserve existing selected-row state, highlights, buttons, and keyboard focus.

Generation details uses one key/value table for model, duration, token usage, cost, trace ID, and generation ID. Keep full identifiers in the value column; do not add a second nested tree or oversized ID typography. Keep the disclosure collapsed initially. Standalone Inspector examples keep their existing composition. Host analytics and lesson flow remain unchanged.

AI generation drill-downs have no separate More event data disclosure. Generation details is the single home for all recorded generation fields: summary metrics/IDs use the shared key/value table, and remaining fields use readable row labels in the same table. Input/output arrays and structured values expand within their value cells using existing plus/minus controls and wrapping monospace JSON. Preserve complete values and incomplete metrics. Product Analytics additional-data disclosures, standalone Inspector payloads, console, and source views retain their behavior.

The Inspector console is one black surface, including its compact top-right control row. Omit the visible Console title. Keep controls and output on one uninterrupted black surface without a divider. Reset and Track live events use `--ph-neutral-border` text/icons, transparent rest states, subtle dark neutral hover, and a visible light keyboard-focus ring. Retain the existing 4px clipped outer frame and border, 28px desktop / 44px touch controls, and event styling. Clear console has its accessible name and a shared neutral tooltip on pointer hover or keyboard focus, dismissed by Escape. This explicitly replaces the prior gray console header; drill-down section headers remain unchanged.

For edge placement, the full-height Playground scroll region contains a sticky header and a separate `vac-dock-content` body. The scrollbar spans the whole panel beside the fixed tool rail; it starts at the top rather than below the logo/header. Keep the existing body padding, neutral thumb/transparent track, title, navigation, recording controls, and panel motion. Measure only the runtime header height for scroll padding so keyboard-focused content stays below sticky controls. Preserve page-change scroll resets and inline dock composition.

Console controls are persistent icon buttons on one uninterrupted black surface, with no title or divider. Use a 16px play icon labeled and tooltipped “Track live events” to resume automatic latest-event selection after inspecting history. Keep it visible but disabled and muted while already following live events (or empty); enable it when selection is pinned. Reset stays alongside it. Both share the same compact hover, focus, Escape-dismissable tooltip, and disabled treatment. Preserve continued event collection while inspecting history and all existing callbacks.

Selected Product Analytics records always use the generic “Event” drill-down title, regardless of the Twig action or feature. Keep actual event names in the console and interaction-specific explanations in prose. AI generation records retain “AI generation”; do not invent per-action titles for Product Analytics detail cards. Standalone lab Inspector examples retain their authored labels.



## Compact Playground pages and hands-on onboarding

All edge Playground pages use one top-spacing rule: remove the content's top padding and the first section/first child's top margins. Keep the existing header height, horizontal insets, and spacing within and between later sections. Apply this to Home, all product landings, Inspector, and every lab step, rather than a Home-only override. Inline embeds retain their composition.

Home combines a brief introduction, a short optional real-interaction walkthrough, and a compact lab directory. Reuse `vac-lab` typography and the grouped `vac-home-panel` surfaces: “Meet Twig” introduces the demo vacation site and explains that the Playground reveals its PostHog events and code. “Take a tour” starts the walkthrough; the “Explore on your own” card and toolbar’s Inspector button open independent inspection. Use `PlaygroundOnboarding` with the shared `LabChecklist` for one action at a time inside the existing Inspector. Highlight an actual stay with `vac-lab-target`; its new `twig_stay_viewed` event advances to choosing a setting in Filters, followed by opening a filtered stay. Only those real events advance the tour. After three interactions, explain that the latest details are already shown and invite comparison of earlier console entries. Do not require selecting the newest event or divert the tour into the AI planner. Never fabricate an onboarding event or inject a response.

Keep the site usable, retain Inspector history and lesson progress, and allow independent exploration at every stage. Home and tool changes pause the prompts without restarting them; explicit lab starts end the walkthrough. Hosts own in-memory progression, route/scroll coordination, and fixed milestone telemetry without visitor inputs. Reload starts fresh.

The Home lab directory composes existing `vac-lab-other-pages` disclosures, product icons, and indented `vac-lab-menu-group` buttons. Each product expands to its actual concept-named labs, and selecting one starts it directly through the host callback. Keep the compact global header spacing, existing neutral surfaces, RoundHog, focus states, and product icon colors. No explanatory captions, invented illustrations, new palette, or Home-only CSS overrides. References: https://posthog.com/docs (contained get-started area and icon-led directory), https://posthog.com/product-analytics (clear purpose and direct action), and https://brand.posthog.com/catalog.json (brand assets, typeface and colors), checked 2026-10-21.

Inspector and product lab landings share the standard `vac-lab h3` title size and line height. Name product pages, rail tooltips/accessibility labels, and Home product groups “[Product name] labs”, such as “Product Analytics labs” and “Session Replay labs”. Product names in event data and instrumentation retain their established names.

All tour directions, including the final invitation to keep exploring event history, use the shared `LabChecklist` instruction box. Keep explanatory context outside the box.

After three changes to earlier console selections, the tour prompts the play button to resume live tracking. Its actual follow action reveals the reset instruction; resetting then invites a few more site interactions to inspect new events. Repeated clicks on the same entry do not advance the tour. Keep all of these directions in `LabChecklist`; preserve the exit control and ordinary console behavior.

Home follows the [PostHog docs landing page](https://posthog.com/docs) with stacked white panels, using existing neutral borders, the small corner token, and RoundHog. The top card contains only “Take a tour” and an arrow, followed by a separate “Explore on your own” CTA card that opens the Inspector. Keep that card to its label and arrow, without an explanation or separate Inspector label. The labs panel groups Learn with labs, its one-sentence introduction, and full-width neutral product bars with indented lab rows. Keep the 16px panel spacing, 44px interaction targets, and visible focus. Scope this composition to Home; other lab menus and Inspector views keep their established styling.

Home’s Take a tour and Explore on your own cards share one control rule and the same label typography as Learn with labs: 14px / 20px, weight 600. Do not introduce a separate larger tour label. Product disclosure rows keep the shared menu typography.


## Account navigation uses shared dropdowns

Account sidebar and profile menus use `twig-dropdown-menu` and `twig-dropdown-item`: 6px outer padding, no row gaps, 44px minimum rows, 8px/12px row padding, and DM Sans 15px/24px at every width. On narrow account layouts, hide the sidebar and use the header avatar dropdown for navigation. Identity headers use the same 8px/12px inset. Reuse the dropdown surface, border, 3px corners, shadow, hover, current-page and keyboard-focus states; do not add account-specific row spacing or mobile typography. This is a visual change; existing callbacks and analytics are unchanged.

## Stay-detail booking placement

On single-column stay pages, place the booking form directly after the photo gallery, before the description, facts, bedrooms, amenities, host and cancellation policy. Desktop keeps stay information on the left and booking on the right. Use one booking form in the reading order and the host grid for placement; preserve the shared controls, validation and booking behavior.

## Mobile account navigation

Mobile account pages open with content visible and the avatar menu closed. Use `ProfileMenu` for Profile, Saved stays, Booked stays, Account settings and Log out. `AccountLayout` hides its sidebar in single-column layouts (container widths up to 700px, or viewport widths up to 600px); desktop keeps the sidebar. Hosts using this layout must keep the header avatar menu available. Preserve dropdown spacing, Escape/return focus, outside-click dismissal and navigation callbacks.


## Playground lab menus

Product headers and expanded lab choices are separated by a 1px neutral border. Hover and keyboard focus use the same full-width neutral gray as the product bar, with square joined row edges and no white gap below the header. Keep labels at a 20px inline inset. The first row includes the previous 6px top inset in its 50px minimum target; later rows have 44px minimum targets. Allow wrapped labels to grow. Open, hover and focus retain identical text positions. Preserve the 2px cobalt keyboard outline inset by 2px, 4px outer corners, flat surfaces, existing product icons, content and callbacks. Apply the shared rules to Home and other-lab menus; Twig dropdowns retain their own style.


## Playground disclosure and row focus

Use the shared PostHog.com plus/minus icons for every Playground and lab expand/collapse control: plus closed, minus open. Use these icons only when that control reveals or collapses actual nested content directly beneath it; never use them for selection, navigation, or content shown elsewhere. This includes product menus, simulation notes and nested evidence. Event rows select an event; they have no disclosure icon. Show the selected event’s Properties beneath the entire event list. Preserve directional navigation arrows. Event-table keyboard focus outlines the entire row, including its time cell, using the existing blue 2px inset outline. Selected event rows retain `--ph-neutral-accent`; hover/menu backgrounds retain `--ph-neutral-background`.


## Lesson navigation

Use the approved header/footer navigation in every Playground lab. All labs and More lesson options belong in the header; Reset Twig data is an explicitly labeled menu action with confirmation. Previous and the existing gated primary action belong in a 44px footer. Return to lab replaces that action when away from the required page. Preserve lesson handlers and completion gates; contextual controls remain beside their evidence. Hidden lesson/review screens must not contribute footer actions. Keep the fixed PostHog colors, RoundHog, 4px corners and existing OSButton styling.


Playground actions update evidence, checklists and progression directly. Do not show transient confirmation popups or toasts for completing a requested lab action. Keep actual errors and essential inline state in their existing context.


## Reset confirmation and button proportions

Reset Twig data replaces the visible lesson with a flat white confirmation beneath the Playground title. Keep the lesson mounted and its progress intact; hide its normal navigation, content and footer until Cancel or Escape returns to the same step and restores menu focus. Use an 18px title, one concise consequence paragraph, 24px body padding, and a neutral divider above the 16px action row. Cancel is left-aligned quiet navigation; Reset Twig data is the existing OSButton on the right. Focus Cancel initially; clear data only after explicit confirmation.

Navigation and reset actions use the original OSButton face: 4px/10px padding, existing type, border and yellow base, with intrinsic content width. Do not enlarge the face or base to meet touch targets. Extend only the invisible button hit area to 44px. Preserve normal hover, pressed, keyboard-focus and disabled states.


## One lab instruction pattern

Use the shared `LabChecklist` for actions inside Twig and its labs: configuration, site interactions, mock-agent messages, retries, verification, recording and mobile return. Use prose for external terminal/wizard setup and real-project coding-agent handoffs. One action uses the single-step callout; sequential actions share one numbered checklist with current/done/upcoming states tied to existing lesson evidence. Never replace directions with an Activity waiting card, a plain instruction paragraph, or a separate custom card. Keep explanatory prose and recorded data outside the checklist; navigation remains a button or link.


## Shared Playground controls, code, and terminal

Directions for interaction inside Twig use `LabChecklist`, including retries, repair, verification, and mobile returns. External terminal/wizard setup and real-project coding-agent handoffs use prose. Do not use an Activity/Waiting card. A single action uses the blue-left row; sequential actions use numbered rows. Completion reflects real local state and keeps existing gates.

Choices use one connected neutral box with blue radios, white selected rows, and a full-row blue keyboard outline. Web app/Agent uses the compact joined toggle geometry from Input/Output; no inset pill.

`PlaygroundCodeBlock` is the shared read-only code surface, including Inspector instrumentation. Use the programming language in the header; put the source filename/path and optional line once below the block. Never use a filename or Terminal as the header. Single-line and contiguous section emphasis use the full-width PostHog.com yellow 10% tint (`--ph-code-line-highlight`). Copy keeps its icon and shows the reusable neutral `Copied!` tooltip for 500ms; no persistent copied label or action-confirmation toast. Hover/focus tooltips use the same neutral surface and dismiss on Escape.

Wizard commands always use `WizardCommand`, adapted from PostHog.com `WizardCommand` → `PlatformInstall/InlineCommand.tsx`: source gradient, monospace command, chevron, copy icon, and attached Learn more tab. Do not render Wizard commands as generic code blocks. The displayed command stays clean; copied commands pin `-y` and `@latest`, matching the source builder. These commands are never executed by the Playground.

The mock MCP terminal and Inspector console are separate roles. The local MCP composer uses editable monospace text and a plain white upward-arrow send control, with a stop square during generation. No circle, raised OS button, or standalone Send/Continue CTA inside the transcript. Carets are allowed only for nested tool calls in this mock MCP terminal; other Playground disclosures keep plus/minus. Ordinary lesson navigation retains the existing OSButton outside the transcript. All agent requests and teaching data remain local.

## AI evidence and statuses

Use the shared trace, generation, and evaluation views throughout the Playground, including later lesson steps and Inspector examples. Session is the neutral gray group header; nested Trace, Tool call, and Generation rows stay white. Plus/minus controls only expand real nested content. Keyboard focus spans the entire interactive row.

Captured chat uses connected Input/Output tabs, with **User message** and **AI response** labels. Model names, durations, property labels, messages, and evaluation results use RoundHog. Only actual code, raw identifiers, and JSON use monospace; do not style readable metadata as code.

Evaluations use one connected surface: a 13px semibold evaluation name, a 12px medium status, and Expected/Observed columns. Do not repeat the observed result in a footer. Passing the guest-capacity check can mean no stay was recommended; it does not imply a matching stay was found.

Statuses are text, with optional existing check/cross marks, never pills. Fixed colors from [PostHog brand colors](https://brand.posthog.com/colors) ([catalog](https://brand.posthog.com/catalog.json)):

| Status | Token | Brand value |
| --- | --- | --- |
| Ready | `--ph-status-ready` | Neutral muted `#4D4F46` |
| Running | `--ph-status-running` | Cobalt `#0457FF` |
| Failed | `--ph-status-failed` | Coral darker `#F00008` |
| Passed | `--ph-status-passed` | Green darker `#35B14E` |

Keep the readable status alongside color. Missing capacity remains neutral **Not applicable**. These brand values are fixed; do not substitute product UI success/danger colors or invent shades.


## Finalized replay, recording and error evidence

Playground exposed corners use 4px; joined internal edges are square. The original raised OSButton retains its white face and proportions, with official brand Yellow `#FFA81C` for its base and Yellow darker `#E58E00` for its edge. Product vectors retain their shape and use Cobalt, Purple, Yellow and Tangerine for Product Analytics, AI Observability, Error Tracking and Session Replay. Do not alter the official PostHog logomark proportions or colors.

`ReplayControls` is the flat playback transport in every player state. Use conventional Play/Pause/Replay, elapsed/total time, a cobalt seek timeline and Fullscreen. Desktop is one row; narrow containers put the timeline above the 44px control row. Ended preserves the same geometry. Loading disables transport; unavailable Fullscreen leaves playback usable. UI times and interaction labels use RoundHog, with tabular numerals for timers.

Before recording, use the original **Start recording** OSButton. During recording, use `RecordingControls`: a compact neutral bar, red stop square inside a circle, and red elapsed time. The square blinks while recording and stays steady for reduced motion. Stop uses the shared tooltip and cobalt focus. This component is shared by the lesson, dock and floating recording control; host CSS owns placement only.

Error investigation keeps issue identity, historical occurrence count and Active/Resolved status attached to the evidence. Exception messages and function names are actual code; filenames, labels and results use RoundHog. Stack rows select source code and take full-row focus. Source, fallback and repair snippets reuse `PlaygroundCodeBlock`, including line highlighting and copy feedback. Keep fallback and root-cause repair distinct. Before retry/verification, show a current white instruction with its blue edge and no fabricated result; after the actual action, show a completed neutral instruction and the observed result. Resolve stays disabled until the host lookup is verified; resolving retains occurrence history.

Active uses the Failed brand Coral darker token (`#F00008`); Resolved uses Passed brand Green darker (`#35B14E`). Reuse `PlaygroundStatus`, not custom pills or colors. Shared CSS classes own static typography, spacing, colors, surfaces and responsive states. Inline styles are reserved for measured cursor coordinates, chart widths, tooltip placement and playback progress, with a runtime-data comment.

The Playground bundles Source Code Pro Regular from [Adobe’s official distribution](https://github.com/adobe-fonts/source-code-pro/tree/release) under the SIL Open Font License. Use `--ph-font-code` for actual code, raw identifiers, JSON, console and mock MCP text. RoundHog remains the interface, chat, metadata, result and timer font. Both are served locally; previews need no font service.


## Inspector exploration and live tracking

The default Inspector is free exploration. Show “Interact with Twig to explore its PostHog instrumentation.” as regular 13px RoundHog prose, including the period. Do not turn it into a current/completed checklist. Guided tour actions continue to use `LabChecklist` through the existing guidance slot. The console’s Track live events control uses the shared play icon and retains its tooltip, keyboard focus, disabled state and existing follow-latest behavior. Clear console remains a separate reset control.

## Finalized Playground interaction rules

- Use `LabChecklist` for actions inside Twig and the guided Playground. Completed single and multiple instructions share the same checkmark. External terminal, wizard and coding-agent handoffs use prose.
- Every lab opening shows `How this simulation works` expanded by default. Its heading uses the same RoundHog 14px Medium treatment as `About this exercise`. Other disclosures keep their existing defaults. Collapsed sections show only their summary and plus control; hide their entire body, including code chrome and nested sections. Hover, focus and selection do not imply expansion.
- Lesson content scrolls independently while navigation stays at the bottom of the viewport-height Playground. On mobile, the lesson footer sits above the 52px toolbar. Completion uses Review results (when supported) and Choose another lab in that footer, with no generic Previous or duplicate completion explanation.
- Code headers identify the language. Show a source path and optional line once below the block. Only a successful copy shows the short-lived `Copied!` bubble; do not show copy-instruction or hover-label popups. Keep accessible control names and selectable code.
- Browse alternative evidence with the connected tabs, including recorded stay visits. Genuine single-choice questions retain their shared choice rows. The Web app / Agent switch has no Experience label; its inactive option shows the contextual switch tooltip on hover or keyboard focus.
- The mock MCP composer wraps message text beside a fixed 32px send/stop control, with 12px padding and gap and 16px surrounding spacing. Its height follows the text. A scrolling transcript never runs behind the composer. Inline code in this terminal inherits monospace response styling without prose code pills. Activity indicators use vectors, never emoji.
- Completion recaps use the shared left-aligned title and learning surface, real bullet markers, 16px spacing, and natural wrapping. Preserve every learning point. Keep real-project handoffs distinct from recap completions.

Final audit: compact experience toggles use equal-width 12px semibold segments with square joined inner edges; evidence tabs retain the shared 15px semibold typography. Two-view recorded-visit, booking-attempt and legacy AI-run comparisons use connected evidence tabs. Longer attempt/run histories compose the existing labeled select field instead of crowding many tabs. Genuine quiz questions retain choice rows. Completion titles remain 18px with zero child margins and a flat white recap surface, including inside older lab wrappers. AI completion intentionally omits Review results.

Mobile recording starts with Twig content in view before the initial rrweb snapshot. Keep the actual page layout and pointer coordinates; do not remove stacked panel space only during playback.
