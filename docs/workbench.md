# Develop with the workbench

The workbench is a local browser preview for package components. It uses local examples, so you can build and click through a component without starting Twig.com or signing in to PostHog.

## Start it

From this repo:

```sh
npm ci
npm run workbench
```

Open the URL printed in the terminal (normally `http://127.0.0.1:5173`). Choose **Twig views** or a lab from the left menu. Changes in `src/`, `workbench/App.tsx`, and the CSS refresh the page while the server runs. Stop it with `Ctrl+C`.

## Add or change a component

1. Build the reusable UI in `src/`. Keep site routes, navigation, and real PostHog event calls in Twig.com.
2. If it is a new public component, add its import path to `package.json` → `exports` and describe it in [components.md](components.md). Use a `.js` extension for imports between TypeScript source files, as the existing components do.
3. Add a preview to `workbench/App.tsx`. Import directly from `../src/` so edits appear immediately. Add it to an existing view, or add a menu entry for a distinct component.
4. Pass example props and local callbacks. For a clickable component, let the preview own its state with React's `useState` or the package reducer. The **Events and properties** preview shows the pattern: click a Twig filter, update local state, then inspect the event.
5. Check the states someone will actually see: initial, clicked or changed, success or error, narrow width, and keyboard focus. For a lab, click through the whole lesson, not just its first screen.

The workbench's AI and booking actions use fixtures. The replay tab previews lesson states with a fixture; test actual recording and any site routing in Twig.com. Never put credentials or real visitor data in a fixture.

## Before review

```sh
npm test
npm run workbench:build
npm run gallery
npm pack --dry-run
```

`npm test` checks the package behavior. `workbench:build` checks that previews type-check and bundle. `gallery` produces static snapshots for visual review. `npm pack --dry-run` shows what would ship; the workbench itself is development-only and is excluded from the npm package.

When the component is used on Twig.com, check it there too. If PostHog 101 uses it, also check the guide's Shadow DOM styling and keep its PostHog inspector outside that boundary. See [integration and updates](integration.md) for how changes reach each site.

## Review the Events and properties lab

Choose **Events and properties**, then **Web app** or **Agent**. Click a destination filter above the lesson. Work through naming the event, adding a destination property, adding number and boolean properties, and comparing selections. Apply each code change before clicking another filter. The destination-property step needs two different destinations. **All locations** clears the filter and does not count as a destination from that step onward.

In the agent path, send the prepared message and wait for the response. Expand the tool row to inspect the simulated request and result summary. Code edits belong to the simulated agent. Event reads use the real PostHog MCP tool names and input shapes, but execute locally without a PostHog connection.

Check both paths, the experience toggle, Previous, Reset, and both copy icons on the completion page. Check desktop and mobile layouts. With the operating system's reduced-motion setting enabled, responses should appear immediately.
