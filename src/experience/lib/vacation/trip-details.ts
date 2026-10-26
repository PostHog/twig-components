/** Resolve the host shown in a booked trip. A missing record is an unexpected data error. */
export function readTripHost(
  hosts: Readonly<Record<string, { name: string }>>,
  hostId: string,
  allowFallback = false
): string {
  const host = hosts[hostId];
  if (allowFallback) return host?.name ?? "Host information unavailable";
  // The lab exercises this original assumption with an incomplete local fixture.
  return host.name;
}
