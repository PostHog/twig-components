import type { ReactElement } from "react";
import type { Stay } from "./catalog.js";

/** Stay facts and descriptions shared with focused editorial views. */
export function StayDetails({ stay }: { stay: Stay }): ReactElement {
  return (
    <>
      <section className="vac-detail-section">
        <h2>About this stay</h2>
        {stay.description && <p>{stay.description}</p>}
        <dl className="vac-facts">
          {stay.capacity !== null && (
            <div><dt>Guests</dt><dd>{stay.capacity}</dd></div>
          )}
          {typeof stay.bedrooms === "number" && stay.bedrooms > 0 && (
            <div><dt>Bedrooms</dt><dd>{stay.bedrooms}</dd></div>
          )}
          {stay.bathrooms && (
            <div><dt>Bathrooms</dt><dd>{stay.bathrooms}</dd></div>
          )}
          {stay.vibe && (
            <div className="vac-vibe"><dt>Vibe</dt><dd>{stay.vibe}</dd></div>
          )}
        </dl>
      </section>
      {stay.sleepingArrangements && (
        <section className="vac-detail-section">
          <h2>Where you’ll sleep</h2>
          <div className="vac-bedrooms">
            {stay.sleepingArrangements.map((room, index) => (
              <div key={index}>
                <h3>
                  {stay.bedrooms === 0
                    ? "Sleeping area"
                    : index < (stay.bedrooms ?? 0)
                      ? `Bedroom ${index + 1}`
                      : "Additional sleeping area"}
                </h3>
                <p>{room}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {stay.amenities.length > 0 && (
        <section className="vac-detail-section">
          <h2>What’s here</h2>
          <ul className="vac-amenities">
            {stay.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}
