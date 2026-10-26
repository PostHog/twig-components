import type { AccountLink } from "../../../Account.js";

export const accountLinks: readonly AccountLink[] = [
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "saved", label: "Saved stays", href: "/profile/saved" },
  { id: "bookings", label: "Booked stays", href: "/profile/bookings" },
  { id: "settings", label: "Account settings", href: "/profile/settings" },
];

export function loginHref(pathname: string): string {
  const next = pathname === "/login" ? "/profile" : pathname;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function safeAccountRedirect(next?: string): string {
  if (!next?.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) {
    return "/profile";
  }
  return next;
}
