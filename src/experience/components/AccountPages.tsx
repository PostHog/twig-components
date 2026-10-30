"use client";
import {useExperienceRuntime} from "../Runtime.js";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "./TwigNavigation.js";
import {
  AccountLayout,
  AccountSettingsView,
  BookedStaysView,
  TripDetailsView,
  LoginView,
  ProfileOverview,
  SavedStaysView,
  type AccountSection,
  type AccountSettingsValue,
  type BookedStaySummary,
} from "../../Account.js";
import { characters, stays } from "../lib/vacation/catalog.js";
import { accountLinks } from "../lib/vacation/account-links.js";
import { demoLoginEmail, demoTravelerProfile } from "../lib/vacation/demo-account.js";
import { StayImage } from "./StayCard.js";
import { useDemoAccount } from "./DemoAccount.js";
import { Marker } from "./Playground.js";

import { useErrorTrackingLab } from "./ErrorTrackingLab.js";
import { readTripHost } from "../lib/vacation/trip-details.js";
import { latestOccurrence } from "../../error-tracking-lab.js";


export function LoginPageView({ next = "/profile" }: { next?: string }) {
  const account = useDemoAccount();
  const router = useRouter();

  useEffect(() => {
    if (account.ready && account.signedIn) router.replace(next);
  }, [account.ready, account.signedIn, next, router]);

  return (
    <main id="vac-main">
      <LoginView
        email={demoLoginEmail}
        onLogin={() => {
          account.login();
          router.replace(next);
        }}
      />
    </main>
  );
}

export function AccountPageView({ section }: { section: AccountSection }) {
const {captureTwigBookingCanceled,captureTwigException}=useExperienceRuntime();

  const account = useDemoAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [profileBio, setProfileBio] = useState<string>(demoTravelerProfile.bio);
  const errorLab = useErrorTrackingLab();
  const [detail, setDetail] = useState<{
    revision: number;
    bookingId: string;
    error: string | null;
    host: string | null;
  } | null>(null);
  const visibleDetail = detail?.revision === errorLab.state.revision ? detail : null;
  const errorStage = account.errorTracking.stage;
  const lab = errorLab.state;
  const needsTripClick = errorLab.active && (
    (errorStage === 2 && lab.occurrences.length === 0) ||
    (errorStage === 4 && lab.caught && !latestOccurrence(lab, (occurrence) => occurrence.handled)) ||
    (errorStage === 10 && lab.fingerprinted && !latestOccurrence(lab, (occurrence) => Boolean(occurrence.fingerprint))) ||
    (errorStage === 11 && lab.repaired && !lab.verified)
  );
  const linkedBookingId = errorLab.state.booking?.id;
  const linkedDetailsOpen = visibleDetail?.bookingId === linkedBookingId;

  useEffect(() => {
    if (!account.ready || account.signedIn) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [account.ready, account.signedIn, pathname, router]);

  if (!account.ready || !account.signedIn) {
    return <main id="vac-main" className="vac-main"><p role="status">Loading your account…</p></main>;
  }

  const profile = {
    displayName: account.settings.displayName,
    email: account.settings.email,
    homeTown: demoTravelerProfile.homeTown,
    bio: profileBio,
  };
  const savedStays = stays.filter((stay) => account.savedStayIds.includes(stay.id));
  const bookings: BookedStaySummary[] = account.bookings.flatMap((booking) => {
    const stay = stays.find((item) => item.id === booking.stayId);
    if (!stay) return [];
    return [{
      id: booking.id,
      stay,
      dateLabel: formatBookingDates(booking.checkIn, booking.checkOut),
      guestsLabel: `${booking.guests} ${booking.guests === 1 ? "guest" : "guests"}`,
      status: booking.status,
      statusLabel: booking.status === "canceled" ? "Canceled" : "Upcoming",
    }];
  });
  const hosts = Object.fromEntries(characters.map((character) => [character.id, { name: character.name ?? "Twig host" }]));
  function openTripDetails(booking: BookedStaySummary) {
    if (booking.status === "canceled") {
      setDetail({ revision: errorLab.state.revision, bookingId: booking.id, error: null, host: null });
      return;
    }
    const isLabBooking = errorLab.active && booking.id === errorLab.state.booking?.id;
    const hostId = booking.stay.hostId;
    if (isLabBooking && !lab.repaired) {
      setDetail({ revision: lab.revision, bookingId: booking.id, error: "Try to load details again.", host: null });
      // No PostHog SDK runs in this preview, so the lab gets the fields the SDK would capture.
      errorLab.dispatch({ type: "capture", exception: {
        outcome: "local",
        type: lab.fingerprinted ? "HostNotFoundError" : "TypeError",
        handled: lab.caught,
        mechanism: "generic",
        frames: ["readTripHost", "openTripDetails"],
        ...(lab.caught ? { surface: "trip_details", stayId: booking.stay.id } : {}),
        ...(lab.fingerprinted ? { fingerprint: `host-not-found:${hostId}` } : {}),
        host: hostId,
      } });
      return;
    }
    try {
      setDetail({ revision: lab.revision, bookingId: booking.id, error: null, host: readTripHost(hosts, hostId) });
      if (isLabBooking) errorLab.dispatch({ type: "verify" });
    } catch (error) {
      setDetail({ revision: lab.revision, bookingId: booking.id, error: "Try to load details again.", host: null });
      captureTwigException(error, { surface: "trip_details", stayId: booking.stay.id });
    }
  }
  const navigate = (href: string) => router.push(href);
  const stayViewProps = {
    renderImage: (stay: (typeof stays)[number]) => <StayImage stay={stay} />,
    stayHref: (stay: (typeof stays)[number]) => `/stays/${stay.id}`,
    onNavigate: navigate,
  };

  return (
    <main id="vac-main" className="vac-main vac-account-main">
      <AccountLayout profile={profile} active={section} links={accountLinks} onNavigate={navigate}>
        {section === "profile" ? (
          <ProfileOverview profile={profile} onBioChange={setProfileBio} />
        ) : section === "saved" ? (
          <SavedStaysView
            {...stayViewProps}
            stays={savedStays}
            onRemoveStay={(stay) => account.toggleSaved(stay.id, "saved")}
          />
        ) : section === "bookings" ? (
          <BookedStaysView
            {...stayViewProps}
            bookings={bookings}
            detailsAccessory={(booking) => booking.id === linkedBookingId ? <Marker id="errors" /> : null}
            selectedBookingId={visibleDetail?.bookingId}
            highlightedDetailsBookingId={needsTripClick && (!linkedDetailsOpen || errorStage === 11) ? linkedBookingId : undefined}
            onViewDetails={openTripDetails}
            onCancelBooking={(booking) => {
              account.cancelBooking(booking.id);
              captureTwigBookingCanceled(booking.stay.id);
            }}
            renderDetails={(booking) => (
              <TripDetailsView
                booking={booking}
                hostName={visibleDetail?.host ?? undefined}
                errorMessage={visibleDetail?.error ?? undefined}
                onRetry={() => openTripDetails(booking)}
                highlightRetry={needsTripClick && linkedDetailsOpen && !!visibleDetail?.error && booking.id === linkedBookingId}
              />
            )}
          />
        ) : (
          <SettingsPage
            initialValue={account.settings}
            onSave={account.updateSettings}
          />
        )}
      </AccountLayout>
    </main>
  );
}

function SettingsPage({
  initialValue,
  onSave,
}: {
  initialValue: AccountSettingsValue;
  onSave: (value: AccountSettingsValue) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return (
    <AccountSettingsView
      value={draft}
      onChange={(value) => {
        setDraft(value);
        setStatusMessage(null);
      }}
      onSave={() => {
        onSave(draft);
        setStatusMessage("Changes saved in this browser.");
      }}
      statusMessage={statusMessage}
    />
  );
}

function formatBookingDates(checkIn: string, checkOut: string): string {
  const format = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${format.format(new Date(`${checkIn}T12:00:00`))} – ${format.format(new Date(`${checkOut}T12:00:00`))}`;
}
