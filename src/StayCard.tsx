import type { ReactNode } from "react";
import { characters, nightlyPrice, stayLabel, type Stay } from "./catalog.js";

export function StayCardContent({
  stay,
  image,
  linked = false,
}: {
  stay: Stay;
  image: ReactNode;
  linked?: boolean;
}) {
  const host = characters.find(character => character.id === stay.hostId);
  return (
    <>
      {image}
      <div className="vac-card-body">
        <div className="vac-row">
          <h3>{stayLabel(stay)}</h3>
          <p className="vac-card-price"><strong>{nightlyPrice(stay)}</strong><span className="vac-muted"> / night USD</span></p>
          {linked && <span className="vac-sr-only">View stay</span>}
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
        {host?.name && <div className="vac-card-host">
          <span className="vac-card-host-avatar" aria-hidden="true">
            {host.portrait
              ? <img src={host.portrait.src} alt="" width={36} height={36} />
              : null}
          </span>
          <span className="vac-card-host-identity">
            <span className="vac-card-host-name">Hosted by {host.name}</span>
            {host.species && <span className="vac-card-host-species">{host.species}</span>}
          </span>
        </div>}
      </div>
    </>
  );
}
