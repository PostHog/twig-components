# Finalized Playground review

The shared components below use the finalized Figma foundations. Actual-site flows are captured in the [Twig review index](https://github.com/PostHog/twig.com/blob/codex/twig-playground-overhaul/docs/review/finalized-playground.md), using the exact local package archive. Teaching data stays local.

| Component review | Desktop | Mobile |
| --- | --- | --- |
| Shared controls and statuses | [1440px](playground-controls-1440.png) | [390px](playground-controls-390.png), [320px](playground-controls-320.png) |
| AI evidence | [Trace, generation and evaluation](playground-ai-evidence-1440.png) | See the actual Twig review index above |
| Web app code | [Code](events-desktop.png) | See the actual Twig review index above |
| Mock MCP | [Agent](agent-desktop.png) | [Agent · 390px](agent-mobile.png) |
| Trends | [Desktop](trends-desktop.png) | [390px](trends-mobile.png) |
| Full-row event focus | [Desktop](playground-event-row-focus-1360.png) | [390px](playground-event-row-focus-390.png), [320px](playground-event-row-focus-320.png) |

136 shared tests pass, along with workbench/gallery builds and package-content checks. Twig passes 130 unit tests, lint, a production build, and 18 browser regressions. Actual-site review covers all six lab families and both Events experiences, every route with empty/populated accounts, keyboard focus, reduced motion, clipboard feedback, masking, fullscreen fallback, error retry/verification states and retained occurrence history. Legacy AI capture and stay-tracking consumers also pass at all three widths.

Static appearance belongs to shared CSS. Only measured placement, chart widths and playback progress use inline values. RoundHog is the UI font; locally bundled Source Code Pro is reserved for code/raw identifiers, console and mock MCP text. Brand Yellow replaces the old OSButton gold shades; Active/Resolved reuse the fixed brand status tokens.

## Final nit pass · October 23

The controls screenshots above are refreshed for the final shared build. They include the compact horizontal composer, completed single-step checkmark, expanded simulation explanation with the approved 14px medium heading, and the shared completion recap/actions. Source blocks use language headers and source captions. Closed disclosures hide their complete bodies. Copy buttons show only successful Copied! feedback.

The [current actual-site review](https://github.com/PostHog/twig.com/blob/codex/twig-playground-overhaul/docs/review/finalized-playground.md#final-nit-pass--october-23) covers the paired archive and responsive viewport placement.
