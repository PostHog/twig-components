import type { Stay } from "../../../catalog.js";

export * from "../../../catalog.js";

/** Fixed catalog photo crops map to shared CSS variants, never inline styles. */
export function stayPhotoClassName(image: Stay["images"][number]) {
  return image.objectPosition === "center 74%" ? "vac-photo-focus-low" : undefined;
}
