import type { TouchpointId } from "../../../playground.js";

export function labStartPath(id: TouchpointId, firstStayId: string): string {
  return id === "discovery" || id === "catalog" || id === "replay" ? "/" : `/stays/${firstStayId}`;
}

/** The active lesson can lead away from its start page without losing its place. */
export function labResumePath(id: TouchpointId, stage: number, startedAt: string, hasErrorBooking: boolean): string {
  if (id === "errors" && stage >= 2 && hasErrorBooking) return "/profile/bookings";
  if (id === "replay" && stage > 0) return "/";
  return startedAt;
}

export function isLabResumeLocation(id: TouchpointId, stage: number, pathname: string, resumePath: string): boolean {
  if (pathname === resumePath) return true;
  // Stay-based lessons let learners move between listings without leaving the lab area.
  if (["stay", "booking", "errors"].includes(id) && (id !== "errors" || stage < 2)) {
    return /^\/stays\/[^/]+$/.test(pathname);
  }
  return false;
}

/** Clear only Twig-owned browser state. Other apps on the same origin are untouched. */
export function clearTwigStorage(storage: Pick<Storage, "length" | "key" | "removeItem">): void {
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (key?.startsWith("twig:")) storage.removeItem(key);
  }
}
