/** Pricing only: this does not check inventory or reserve a stay. */
export function priceStay(
  nights: number,
  nightlyCents: number
) {
  if (!Number.isSafeInteger(nights) || nights < 1)
    throw new Error("A positive whole-night count is required");
  const totalCents = nights * nightlyCents;
  return {
    nights,
    lines: [{ label: "Nightly rate", nights, nightlyCents, totalCents }],
    totalCents,
  };
}

export function priceLabel(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
