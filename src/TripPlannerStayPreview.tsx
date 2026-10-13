import type { ReactNode } from "react";
import { nightlyPrice, stayLabel, type Stay } from "./catalog.js";
import { StayCardContent } from "./StayCard.js";
import { SavedStay } from "./SavedStay.js";

/** A read-only view of the host's real stay card, with shared content as a fallback. */
export function TripPlannerStayPreview({ stay, renderStayCard }: { stay: Stay; renderStayCard?: (stay: Stay) => ReactNode }) {
  return <div className="twig-browser twig-trip-listing-preview" role="img"
    aria-label={`${stayLabel(stay)}, ${stay.location}, ${stay.capacity} guests, ${stay.bathrooms} bath, ${nightlyPrice(stay)} per night USD`}>
    {/* React 18 needs a string for inert; React 19 accepts this truthy value too. */}
    <div inert={"inert" as unknown as boolean} aria-hidden="true">
      {renderStayCard ? renderStayCard(stay) : <article className="vac-card">
        <StayCardContent stay={stay} linked image={<div className="vac-image twig-trip-listing-photo" />} />
        <div className="vac-card-save"><SavedStay stayName={stayLabel(stay)} signedIn={false} onSignIn={() => {}} /></div>
      </article>}
    </div>
  </div>;
}
