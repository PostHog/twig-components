/** Stable IDs identify instrumentation; displayed marker numbers are page-local. */
const productColors = {
  "Product Analytics": "blue",
  "AI Observability": "purple",
  "Error Tracking": "yellow",
  "Session Replay": "orange",
} as const;

function product<T extends keyof typeof productColors>(tool: T) {
  return { tool, color: productColors[tool] };
}

export const touchpointDefinitions = {
  discovery: {
    title: "Traces, generations, and evaluations",
    ...product("AI Observability"),
    lesson: "Follow a conversation through its PostHog events.",
    lab: "ai-discovery",
    description:
      "Inspect model input and output, connect requests in a conversation, and investigate a wrong recommendation.",
    evidence: "Compare requests using their session, trace, and generation IDs.",
  },
  catalog: {
    title: "Events and properties",
    ...product("Product Analytics"),
    lesson: "Turn a filter click into an event, add properties, and compare selections.",
    lab: "filter-events",
    description:
      "Setting filters narrow the catalog. Select a stay to see its details and nightly rate.",
    evidence: "Guided web app and MCP paths. Local demo events only.",
  },
  replay: {
    title: "Session playback and masking",
    ...product("Session Replay"),
    lesson:
      "Watch a ghost visit, then record and inspect your own interactions.",
    lab: "session-replay",
    description: "Explore interaction sequences and input masking.",
    evidence: "Local interaction reconstruction. No PostHog recording.",
  },
  stay: {
    title: "Breakdowns by property",
    ...product("Product Analytics"),
    lesson: "Connect a stay’s ID to its view event.",
    lab: "stay-views",
    description:
      "This page reads the selected stay’s catalog entry and host profile. Photos, amenities, and prices belong to this stay.",
    evidence:
      "Locally simulated view events from navigation between stay pages.",
  },
  booking: {
    title: "Funnels and conversion events",
    ...product("Product Analytics"),
    lesson: "Record a completed booking only after confirmation.",
    lab: "booking-events",
    description:
      "Compare a failed booking with its captured events, then move completion capture to the successful response.",
    evidence:
      "Local simulated availability and booking responses. No reservation or payment created.",
  },
  errors: {
    title: "Exceptions and issue resolution",
    ...product("Error Tracking"),
    lesson: "Investigate a trip-details error and check the fix.",
    lab: "error-tracking",
    description: "Book a stay in Twig, then open its trip details to investigate an error.",
    evidence: "Local example data only. Nothing is sent to PostHog.",
  },
} as const;

export type TouchpointId = keyof typeof touchpointDefinitions;
type PageKind = "discover" | "stay" | "about" | "bookings";
export type LabStartPage = "discover" | "stay";

const labStartPages: Record<TouchpointId, { page: LabStartPage; location: string }> = {
  discovery: { page: "discover", location: "Find a stay" },
  catalog: { page: "discover", location: "Find a stay" },
  replay: { page: "discover", location: "Find a stay" },
  stay: { page: "stay", location: "A stay page" },
  booking: { page: "stay", location: "A stay page" },
  errors: { page: "stay", location: "A stay page, then Booked stays" },
};

const pageTouchpoints: Record<PageKind, readonly TouchpointId[]> = {
  discover: ["discovery", "catalog", "replay"],
  about: [],
  stay: ["stay", "booking", "errors", "replay"],
  bookings: [],
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
      : path === "/profile/bookings"
      ? "bookings"
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
        : kind === "bookings"
        ? "Booked stays"
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

/** Show labs on other pages, except Error Tracking on Booked stays, which only continues an active lab. */
export function labsOnOtherPages(page: PlaygroundPage) {
  const localIds = new Set(page.touchpoints.map(({ id }) => id));
  return (Object.keys(touchpointDefinitions) as TouchpointId[])
    .filter((id) => !localIds.has(id) && !(page.kind === "bookings" && id === "errors"))
    .map((id) => ({ id, ...touchpointDefinitions[id], ...labStartPages[id] }));
}

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

/** Product landing pages list every existing lab, independent of the host route. */
export function labsForProduct(id: TouchpointId) {
  const tool = touchpointDefinitions[id].tool;
  return (Object.keys(touchpointDefinitions) as TouchpointId[])
    .filter(labId => touchpointDefinitions[labId].tool === tool)
    .map(labId => ({ id: labId, ...touchpointDefinitions[labId], ...labStartPages[labId] }));
}
