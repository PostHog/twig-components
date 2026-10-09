# Twig visual system

Use this guide for every new or changed Twig view, playground panel, or lab. The existing components and CSS remain the source of truth; this document records the choices contributors should preserve. Twig.com applies these shared views on the site. See [integration](integration.md) for ownership.

## Two visual surfaces

| Surface | Source | Type and color |
| --- | --- | --- |
| Twig website, chat, stays, and account views | `src/catalog.css` and the host page | Twig's Halfre type and warm paper/ink palette. |
| PostHog Playground and lessons | `src/lab.css`, inside `.vac-app .vac-developer-theme` | RoundHog and the existing `--ph-*` tokens. |

Keep these surfaces distinct. Reuse an existing component and its state styles before adding CSS. Do not introduce a second font, color system, reset, or decorative treatment for one screen. Verify any new PostHog brand color against `brand.posthog.com`.

## Type hierarchy

- Explanatory paragraphs use regular weight throughout a lesson, including the first paragraph on each step. In the lab, prose is 13px, weight 400, with the existing 1.6 line height. Do not make an opening sentence look like a heading by enlarging or bolding it.
- Reserve bold for actual headings and titles, controls people use, and the action or target in an instruction. Do not bold ordinary terms inside explanatory prose. Keep code and property names in monospace instead of using bold for emphasis.
- Keep the same text treatment on successive steps. Changing the lesson stage should not change the weight or size of equivalent prose.

## Lab and playground page structure

- Give the lab or playground a title on its first page, on deliberate progress or recap pages, and on its ending page. Intermediate teaching pages have no page title or heading-like opening sentence. Start with regular prose, evidence, and directions as needed.
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

When a new pattern is genuinely needed, document the gap and add the pattern here and in Twig.com's design guide with the implementation. Do not let a one-off override silently become a new system.
