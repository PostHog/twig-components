import type { ReactNode } from "react";
import { nightlyPrice, stayLabel, type Stay } from "./catalog.js";

export function StayCardContent({
  stay,
  image,
  linked = false,
}: {
  stay: Stay;
  image: ReactNode;
  linked?: boolean;
}) {
  return (
    <>
      {image}
      <div className="vac-card-body">
        <div className="vac-row">
          <h3>{stayLabel(stay)}</h3>
          {linked && <span aria-hidden="true">↗</span>}
        </div>
        <p className="vac-muted">{stay.location ?? stay.setting}</p>
        {stay.capacity && (
          <p className="vac-muted">
            {stay.capacity} guests
            {stay.bedrooms
              ? ` · ${stay.bedrooms} ${stay.bedrooms === 1 ? "bedroom" : "bedrooms"}`
              : ""}
            {stay.bathrooms
              ? ` · ${stay.bathrooms} ${stay.bathrooms === 1 ? "bath" : "baths"}`
              : ""}
          </p>
        )}
        <p>
          <strong>{nightlyPrice(stay)}</strong> / night{" "}
          <span className="vac-muted">USD</span>
        </p>
      </div>
    </>
  );
}
