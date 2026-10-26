"use client";

import Link from "./TwigNavigation.js";
import { characters, stays, stayLabel } from "../lib/vacation/catalog.js";
import { StayGallery } from "./StayGallery.js";
import { BookingForm } from "./BookingForm.js";
import { Marker } from "./Playground.js";
import { StayDetails } from "../../StayDetails.js";
import { StaySaveControl } from "./StayCard.js";

export function StayPageView({ stayId }: { stayId: string }) {
  const stay = stays.find(entry => entry.id === stayId);
  if (!stay) return <main className="vac-main"><h1>Stay not found</h1></main>;
  const host = characters.find((entry) => entry.id === stay.hostId);

  return (
    <main id="vac-main" className="vac-main">
      <Link
        data-replay-label="Navigate: Find a stay"
        href="/"
        className="vac-back"
      >
        ← Back
      </Link>
      <div className="vac-stay-heading">
        <div className="vac-stay-title-row">
          <div>
            <h1>{stayLabel(stay)}</h1>
            {stay.location && <p className="vac-muted">{stay.location}</p>}
          </div>
          <div className="vac-row">
            <StaySaveControl stay={stay} />
            <Marker id="stay" />
          </div>
        </div>
      </div>
      <StayGallery stay={stay} />
      <div className="vac-details-grid">
        <BookingForm key={stay.id} stay={stay} />
        <div className="vac-stay-information">
          <StayDetails stay={stay} />
          {host?.name && (
            <section className="vac-detail-section">
              <div className="vac-host-heading">
                <div className="vac-host-portrait" aria-hidden="true" />
                <div>
                  <span className="vac-eyebrow">Your host</span>
                  <h2>{host.name}</h2>
                  {host.species && (
                    <p className="vac-host-species">{host.species}</p>
                  )}
                </div>
              </div>
              {host.biography && <p>{host.biography}</p>}
            </section>
          )}
          {stay.cancellationPolicy && (
            <section className="vac-detail-section">
              <h2>Cancellation policy</h2>
              <p>{stay.cancellationPolicy}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
