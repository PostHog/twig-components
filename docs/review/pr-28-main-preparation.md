# PR #28 preparation for main

This handoff records preparation on 2026-10-26. It does not authorize a merge or package release. [Components #29](https://github.com/PostHog/twig-components/pull/29) has now merged into main as `88e84b67f6daa249e860e4ff42c9fbd84bed3ca1`. The original investigation and plan below describe the earlier state; the integration status at the end records the subsequent conflict resolution.

## Reviewed scope and GitHub state

The initial [#28](https://github.com/PostHog/twig-components/pull/28) head was `699654d8a774d2e8d9a9a1b3a97835176c00aac6`, targeting `codex/twig-brand-identity` at `dee58bac8e245f9f06d684673a2e1c850ec76d0e`. Both #28 and #29 were open and unmerged. GitHub's all-state PR search for the brand branch returned no PR.

Main was `980c7f293e4d3a7d0e8f9ffa508cdbcf026b558a`, an ancestor of #28. Retargeting to main preserves the branch tree and history. Before preparation, the resulting main diff was 117 files, 5,618 insertions and 1,323 deletions. The old brand-base diff alone was 35 files, 1,416 insertions and 277 deletions; the Playground-only diff against that base was 98 files. Some files occur in both diffs.

The newly visible brand-base work includes:

- DM Sans/Fraunces typography, warm-white/sage/cobalt/charcoal tokens, 3px Twig corners, dropdown/account styling, host rows and responsive browse/search layouts. Bricolage remains bundled for compatibility. Halfre, the illustrated logo and cliff illustration are removed from source and the asset builder.
- Conventional destination/date/guest search, optional setting/amenity filters, catalog-based simulated getaway conversation, host callbacks and trip-selection transfer. Existing teaching event names remain compatible; setting copy and ghost/manual replay selectors follow the new search controls.
- Catalog introduction copy, account eyebrow removal, workbench/gallery updates, font licenses, tests and contributor guidance. This is broader than a Playground-only change and needs review in the main-targeted PR.

The Playground work adds Home/tour/Inspector, local live inspection and shared code, tooltip, Wizard, MCP, status, AI/error evidence, replay and lesson-navigation primitives. It also changes later lesson steps and responsive recording. Keep all intended exports, callbacks, local-only teaching behavior and existing compatibility APIs.

John's approval on 2026-10-22 was for `62722c40eb49f92b7d025c63d1da93eaeffc2edd`. Nineteen commits followed it before this preparation. That review does not establish approval of those later changes, this preparation, the newly exposed brand-base diff or the eventual #29 integration. The original head's React 18/19 CI checks and scanners were successful; they do not validate a future integrated head.

## Independent preparation

The workbench Inspector dock referenced a nonexistent `assets/posthog-logomark.svg`. Its URL now points to the existing shared `src/assets/posthog-logomark.svg`, preserving the same intended logo. A regression first reproduced the missing file, then passed after the path correction. No package runtime or visual design was changed. `tests/package-exports.test.mjs` protects public Playground imports, concrete build/declaration targets, legacy `typesVersions` mappings, local CSS asset URLs and workbench image URLs. It discovers exported CSS, so the same check will cover `/compact.css` once #29 is integrated. Package dry-run verification additionally checks that every declared target and built asset is present in the package file list.

Documentation now matches existing behavior: mobile dates/guests remain visible, `linked` stay cards supply accessible text, and the decorative logo image remains inside the interactive Home button. The older contradictory guidance is corrected without changing UI.

## Exact #29 overlap

The comparison used #29 head `3a0fd504347f8976de5615ee8bd0eeeea71c53fa`. A `git merge-tree --write-tree` preview only wrote local Git objects; it did not merge either branch, move a branch or change this working tree. It predicted these seven content conflicts:

| File | Resolution after #29 lands |
| --- | --- |
| `package.json` | Combine both export maps and `typesVersions`: retain every Playground path and add `/compact` with `Compact.js`/`Compact.d.ts`, plus `/compact.css`. Preserve current package/release metadata from updated main; do not replace the whole manifest with either side. |
| `build-assets.mjs` | Retain Playground copy/replay SVGs, Source Code Pro/RoundHog and Twig fonts/licenses; add the `src/compact.css` → `dist/compact.css` copy. DM Sans/font license need one copy each. Keep intentional legacy-illustration/font removals. |
| `src/StayCard.tsx` | Preserve #29's opt-in `compact = false` prop and early compact rendering, then retain #28's default price/facts/host-name/species rendering and accessible linked text. Default Twig cards and compact figures have different intended compositions. |
| `docs/components.md` | Keep both Playground and compact import/API references, including compact account/saved-stay usage and stylesheet load order. |
| `docs/design-system.md` | Preserve both contracts: full Twig/Playground and explicitly scoped pocket-guide compact surfaces. Retain this preparation's stale-guidance corrections. |
| `workbench/App.tsx` | Keep working compact examples, saved-stay/login navigation and all Playground/Inspector/control/getaway examples and callbacks. |
| `workbench/workbench.css` | Keep the layout helpers needed by both sets of examples. |

The other three overlapping files are `src/Account.tsx`, `assets/DMSans.ttf` and `assets/dmsans-OFL.txt`. Account auto-merges in this preview, but still verify that #29's `SavedStaysView.compact` prop, compact link class and prop forwarding survive alongside #28's account changes. The font and license are byte-identical between the two heads. Recalculate overlap against the actual merged main; conflict predictions can change.

#29's additional files `src/Compact.tsx`, `src/compact.css` and `tests/compact.test.mjs` belong to #29 and must arrive through updated main. Do not pre-copy them into #28.

## Original post-#29 integration plan

This plan was recorded before #29 landed. The integration status below identifies completed work and remaining host/review gates.

1. Verify #29 is merged and fetch the resulting main. Incorporate that main into #28 in an isolated checkout, resolve the seven predicted conflicts deliberately, and inspect auto-merged Account behavior. Reassess any newer commits or release metadata. Preserve the union of Playground and compact exports in both resolver maps, with all corresponding distribution files/assets.
2. Add an explicit compact public-import regression using `@posthog/twig-components/compact` and resolve `/compact.css`; verify both compact and default stay rendering, saved-stay navigation/removal and filter state. Keep #29's tests and this PR's export/asset checks. Check that `catalog.css` plus opt-in `compact.css` retains scoped compact typography, colors, layout and interactions.
3. On the integrated head, run clean installation, `npm test`, `npm run workbench:build`, `npm run gallery` and `npm pack --dry-run` for the supported React 18/19 versions. Inspect package files, declarations, CSS URLs and both export families. Require fresh CI for that exact commit.
4. Review the working compact figures plus the complete affected Twig/Playground flows at desktop, 390px and 320px, including keyboard focus, disabled/error/empty/completion states and reduced motion. Brand-base tokens/fonts/broad selectors require the full Twig host route/state inventory: homepage, About, login, all stays, all four account routes, profile menu and fallbacks, plus affected labs. Verify light/dark host integration and the guide's Shadow DOM. Local builds and historical screenshots do not replace that review.
5. Obtain fresh human review of the final main-targeted diff, specifically the unmerged brand-base work and changes after John's reviewed commit. Keep [Twig.com #35](https://github.com/PostHog/twig.com/pull/35) separate: its existing archive pins the earlier source, so eventual consumer/release adoption must use the exact reviewed integrated package. Do not publish or merge from this preparation task.

## Validation of the initial preparation

Local runtime: Node `26.12.0`, npm `11.20.0` (GitHub CI uses Node 22).

| Check | React 18.3.1 | React 19.2.3 |
| --- | --- | --- |
| `npm test` | 140/140 pass | 140/140 pass |
| `npm run workbench:build` | Pass | Pass |
| `npm run gallery` | Pass | Pass |
| Package dry-run/file-list assertions | Pass, 174 files | Pass, 174 files |

`npm ci --ignore-scripts --no-audit --no-fund` succeeded before validation; subsequent `--no-save` React matrix installs left the lockfile unchanged. The standard `npm pack --dry-run` also succeeded. Missing-export and missing-font mutations were each detected by the new checks and then restored. The workbench asset regression failed on the original path and passed on the correction; the Vite missing-logo warning is gone.

React 18 emits SSR `useLayoutEffect` warnings for the MCP composer during static tests/gallery generation; commands still pass. This preparation does not change that component. No browser walkthrough, screenshot refresh, real Twig/guide integration, package publication or PR merge was performed. The existing screenshot/browser audit reports remain historical evidence for their recorded heads, not a new verification of this preparation or future integration.


## Integration after #29 landed

#29 was independently verified merged at 2026-10-26 15:24:45 UTC. Main `88e84b67f6daa249e860e4ff42c9fbd84bed3ca1` was integrated into the existing #28 branch after preparation head `15f3f27e792fa018d1bd01ed607666c4b68d3f46`. Both remote tips were refreshed again after validation and had not moved.

All seven conflicts were resolved: `package.json`, `build-assets.mjs`, `src/StayCard.tsx`, `docs/components.md`, `docs/design-system.md`, `workbench/App.tsx` and `workbench/workbench.css`. Both complete export/type maps survive. Compact CSS is copied beside the Playground/Twig assets; both stylesheet families and all declared distribution targets appear in the package. The compact early rendering branch remains separate from the default host/facts/price rendering. Auto-merged Account keeps `compact`, compact link classes, forwarding, navigation and remove callbacks. `src/Compact.tsx`, `src/compact.css` and #29's original compact tests are byte-identical to merged main. The package version and lockfile are unchanged.

`tests/package-exports.test.mjs` now guards compact public imports and the independent `/compact.css` export alongside Playground imports. `tests/compact-integration.test.mjs` checks both public card compositions and compact/default saved-stay navigation/removal. Both sets of workbench examples and documentation remain available.

The 320px workbench exposed an 8px Inspector-page overflow: preview gutters narrowed the otherwise full-width mobile toolbar. The fixture now lets its existing rail span those gutters, matching the host layout while retaining the component's established controls. No package component styling or interaction was changed to address this fixture issue.

| Integrated check | React 18.3.1 | React 19.2.3 |
| --- | --- | --- |
| `npm test` | 145/145 pass | 145/145 pass |
| Workbench build | Pass | Pass |
| Gallery build | Pass | Pass |
| Package dry-run and export/asset assertions | Pass, 177 files | Pass, 177 files |

The standard `npm pack --dry-run` passed too. Tests ran on local Node 26.12.0; exact-head GitHub CI still needs to verify Node 22 after the push. React 18's existing static `useLayoutEffect` warnings remain.

Headless Chrome 155.0.8059.85 passed 120 compact/Playground state checks at 1440px, 390px and 320px in light/dark modes with normal/reduced motion. Coverage includes selected filters, 96×72 compact images, 20px DM Sans wordmark, keyboard focus, login→saved stays, save/booking state, default host rows, playback/recording, MCP submission, Inspector evidence and collapse/reopen. Another 18 account checks passed on React 18 across those widths: compact profile-menu containment, Escape/focus return, logout callback, default profile, populated saved stays and removal. There were no page errors or horizontal page overflow. Raw screenshots and browser scripts are retained in this task workspace; the [machine-readable result summary](pr-28-integration-checks.json) is checked in.

Remaining gates are fresh human review of the full main-targeted diff and real Twig.com/guide integration review using the exact integrated package, including the full route/state inventory and Shadow DOM. This component workbench pass does not replace those reviews. Fresh CI, including the required separate `semgrep` context, must complete on the pushed integration head. No security workflow, required check or branch-protection rule was changed. No PR was merged or package published by this task.
