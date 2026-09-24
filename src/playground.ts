/** Stable IDs identify instrumentation; displayed marker numbers are page-local. */
export const touchpointDefinitions = {
  discovery: {
    title: "AI trip discovery",
    color: "yellow",
    tool: "AI observability",
    lesson: "Inspect a trip-planning request and its model response.",
    lab: "ai-discovery",
    description:
      "Configure AI observability fields, then test a simulated recommendation or timeout.",
    evidence: "Local generation events only. No model or PostHog connection.",
  },
  catalog: {
    title: "Stay filters",
    color: "blue",
    tool: "Product analytics",
    lesson: "Capture filter clicks and attach the selected setting.",
    lab: "filter-events",
    description:
      "Setting filters narrow the catalog. Select a stay to see its details and nightly rate.",
    evidence: "No analytics capture connected.",
  },
  replay: {
    title: "Follow a visitor",
    color: "red",
    tool: "Session Replay",
    lesson:
      "Watch a ghost visit, then record and inspect your own interactions.",
    lab: "session-replay",
    description: "Explore interaction sequences and input masking.",
    evidence: "Local interaction reconstruction. No PostHog recording.",
  },
  stay: {
    title: "Stay details",
    color: "blue",
    tool: "Product analytics",
    lesson: "Connect a stay’s ID to its view event.",
    lab: "stay-views",
    description:
      "This page reads the selected stay’s catalog entry and host profile. Photos, amenities, and prices belong to this stay.",
    evidence:
      "Locally simulated view events from navigation between stay pages.",
  },
  booking: {
    title: "Booking",
    color: "yellow",
    tool: "Product analytics",
    lesson: "Record a completed booking only after confirmation.",
    lab: "booking-events",
    description:
      "Compare a failed booking with its captured events, then move completion capture to the successful response.",
    evidence:
      "Local simulated availability and booking responses. No reservation or payment created.",
  },
} as const;

export type TouchpointId = keyof typeof touchpointDefinitions;
type PageKind = "discover" | "stay" | "about";

const pageTouchpoints: Record<PageKind, readonly TouchpointId[]> = {
  discover: ["catalog", "replay"],
  about: [],
  stay: ["stay", "booking", "replay"],
};

export function playgroundPage(
  pathname: string,
  catalog: readonly { id: string; title: string | null }[]
) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const match = /^\/stays\/([^/]+)$/.exec(path);
  const stay = match
    ? catalog.find((entry) => entry.id === match[1])
    : undefined;
  const kind: PageKind | null =
    path === "/"
      ? "discover"
      : path === "/about"
      ? "about"
      : stay
      ? "stay"
      : null;
  const ids = kind ? pageTouchpoints[kind] : [];
  return {
    key: path,
    kind,
    stayId: stay?.id ?? null,
    label:
      kind === "discover"
        ? "Find a stay"
        : kind === "about"
        ? "About Twig"
        : stay
        ? `Stay details${stay.title ? ` · ${stay.title}` : ""}`
        : "This page",
    touchpoints: ids.map((id, index) => ({
      id,
      number: index + 1,
      ...touchpointDefinitions[id],
    })),
  };
}

export type PlaygroundPage = ReturnType<typeof playgroundPage>;
export type PlaygroundSelection = { pageKey: string; id: TouchpointId };

export function selectedTouchpoint(
  page: PlaygroundPage,
  selection: PlaygroundSelection | null
) {
  return (
    (selection?.pageKey === page.key &&
      page.touchpoints.find((item) => item.id === selection.id)) ||
    page.touchpoints[0] ||
    null
  );
}
