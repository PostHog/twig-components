/** Resolve the host shown in a booked trip. A missing record is an unexpected data error. */
export function readTripHost(
  hosts: Readonly<Record<string, { name: string }>>,
  hostId: string
): string {
  const host = hosts[hostId];
  // The lab exercises this original assumption with an incomplete local fixture.
  return host.name;
}
