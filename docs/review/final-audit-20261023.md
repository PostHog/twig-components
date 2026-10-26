# Final Figma and nit audit · October 23, 2026

Audited the current shared-package PR and its exact Twig archive against the [finalized components](https://www.figma.com/design/yIdCpZmhuIUrfaKxqta8q8/Learn-platform?node-id=39-4743), composed mockups, both design guides and all 27 items in the running nit list. Archived Figma variants are excluded from the approved system.

## Gaps corrected

| Area | Final behavior |
| --- | --- |
| Mock coding agent | Stronger terminal scope prevents lesson inline-code pills from overriding responses, including streaming and expanded turns. |
| Status tokens | Ready and Running resolve inside the Playground token scope: neutral `#4D4F46` and brand Cobalt `#0457FF`. Status text uses the component's 12px medium / 16.8px line height. Failed/Active and Passed/Resolved retain the official brand colors. |
| Completion and milestone recaps | Older lab and guide heading rules cannot override the shared 18px title or zero margins. The learning surface is flat white and left aligned. The AI ending intentionally keeps its approved lack of Review results. |
| Experience switch | Equal-width compact segments, 12px semibold text and square inner joins match the finalized toggle. Inactive-option tooltips and keyboard focus remain available. |
| Evidence selection | Recorded visits use the shared 15px semibold tabs. Booking attempts and the older AI-run comparison now compose the same tabs for two records; longer histories use the approved select field. Genuine scenario and quiz questions keep their choice rows. Payloads and lesson gates are unchanged. |
| Mobile recording | Recording starts on Twig content before capture, preventing a blank first playback frame while retaining the true layout and pointer coordinates. |
| Contributor guidance | Removed stale instructions allowing filenames in code headers or a down arrow for live tracking. Guides now agree with the finalized component rules. |

## Nit coverage

| Nit | Result |
| --- | --- |
| 001 · Language headers and source captions | Verified across Inspector, stack/source and lesson code blocks. |
| 002, 004 · Context-specific capture explanations | Verified custom events, generation examples, replay configuration and exceptions; no redundant AI Inspector simulation reminder. |
| 003 · Remove More event data | Discussion only; intentionally unchanged. |
| 005 · Rename/inset the separate Chat generation heading | Discussion only; intentionally unchanged. |
| 006 · Expanded evidence review | Every real disclosure remains available. Figma review expansions are not additional product defaults. Nested source, generation, exception and replay data states were exercised. |
| 007 · Tour play-button wording | Verified. Default Inspector retains plain exploration context; tour directions retain checklists. |
| 008 · Hogli art | Local shared entry-card assets retained; original issue was an import repair. |
| 009, 012 · Persistent navigation | Desktop panel-bottom and mobile viewport-bottom placement verified, including scrolling, completion and route changes. |
| 010 · Completed single/multiple steps | Shared checkmark verified on actual completed actions. |
| 011 · Experience switch | Corrected typography/geometry; inactive tooltips verified. |
| 013 · Chart interaction states | Actual single, repeated, mixed and tied selections produce the expected counts and bar changes. |
| 014 · External setup prose | Wizard/terminal and real-project coding-agent handoffs use prose. |
| 015, 025 · Compact horizontal composer | Content-sized input, fixed 32px control, 12px input spacing and 16px surrounding spacing verified. |
| 016 · Transcript/composer overlap | Expanded requests/results remain within the transcript; composer does not overlap them. |
| 017 · Terminal code references | Corrected the remaining cascade override; no prose code pills in terminal responses. |
| 018 · No emoji UI | Both source trees scan clean for emoji presentation characters; activity uses the shared vector. |
| 019, 027 · Simulation explanation | Expanded by default, with the approved 14px medium About this exercise heading style. |
| 020 · Button sizing | Intrinsic faces and existing raised-button geometry retained; import-only stretched bars do not exist in product CSS. |
| 021, 023 · Collapsed sections | Full bodies hidden, including code chrome, tables and nested disclosures. |
| 022 · Alternative evidence | Shared tabs/select composition and retained selection/keyboard behavior verified at all three widths. |
| 024 · Completion | Shared title, bullet recap and footer verified, preserving optional review and actual lesson content. |
| 026 · Copy feedback | Only successful Copied! feedback; accessible copy names and selectable code retained. |

## Validation

- 136 shared tests and 130 Twig tests pass.
- 21 browser regressions pass, including new checks for Figma typography/geometry, evidence selection, simulation headings and footer behavior; the AI regression now checks milestone typography and Ready color. Replay regressions verify that the initial mobile playback viewport contains Twig content.
- Library, workbench and gallery builds, package-content review, Twig lint and production build pass.
- 16 flow groups produced 1,275 viewport/state checks at 1440px, 390px and 320px. Checks cover collapsed content, source headers, evidence fonts, statuses, completed markers, agent code/composer layout, overflow and footer placement. The explicit motion fixture checks activity states separately from in-progress layout transitions.
- Shared workbench checks also exercise two-record and longer-history selection for booking and legacy AI consumers, including keyboard operation and numeric IDs.
- Actual site routes include Home, About, login, all stays, account areas and not-found navigation, preserving Inspector history and selected tools.
- External browser requests were blocked. Teaching data stays local. No tracking event is added for presentation/copy corrections.

## Flow coverage

| Flow group | Viewport/state checks |
| --- | --- |
| agent-motion | 246 |
| ai | 120 |
| breakdowns | 57 |
| chart-states | 84 |
| copy-feedback | 30 |
| errors | 63 |
| events-agent | 192 |
| events-web | 75 |
| funnel | 60 |
| home | 54 |
| inspector-error | 69 |
| inspector-evidence | 24 |
| inspector-replay | 78 |
| navigation | 24 |
| replay | 69 |
| tour | 30 |

The [actual-site review index](https://github.com/PostHog/twig.com/blob/codex/twig-playground-overhaul/docs/review/finalized-playground.md) contains refreshed affected screenshots. Shared control screenshots include status, completion and composer corrections. [Booking evidence at 390px](https://github.com/PostHog/twig-components/blob/codex/twig-playground-overhaul/docs/review/audit-booking-evidence-390.png) demonstrates the existing select field for a longer history.
