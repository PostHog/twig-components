export type ReplayFrame = {
  at: number;
  kind: "move" | "click" | "input" | "page" | "scroll" | "state";
  page: string;
  label: string;
  x?: number;
  y?: number;
  value?: string;
};
export const REPLAY_LIMIT = 500;
export function replayPage(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !/[?#]/.test(path);
}
/** Fixed page labels keep the interaction summary useful across the whole visit. */
export function replayPageLabel(path: string) {
  const labels: Record<string, string> = {
    "/": "Find a stay",
    "/about": "About Twig",
    "/login": "Log in",
    "/profile": "Profile",
    "/profile/saved": "Saved stays",
    "/profile/bookings": "Booked stays",
    "/profile/settings": "Account settings",
    "/support": "Support",
  };
  return labels[path] ?? (/^\/stays\/[^/]+$/.test(path) ? "Stay details" : "Twig page");
}
export function searchValue(value: string, masked: boolean) {
  return masked ? "[masked]" : value.slice(0, 80);
}
export function replayScene(frames: ReplayFrame[], index: number) {
  let page = "/",
    filter = "All",
    search = "",
    x = 50,
    y = 30;
  for (const frame of frames.slice(0, index + 1)) {
    if (frame.page !== page) {
      page = frame.page;
      filter = "All";
      search = "";
    }
    if (frame.label.startsWith("Filter: ")) filter = frame.label.slice(8);
    if (frame.kind === "input") search = frame.value ?? "";
    if (frame.x !== undefined) x = frame.x;
    if (frame.y !== undefined) y = frame.y;
  }
  return { page, filter, search, x, y };
}
