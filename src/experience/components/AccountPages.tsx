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
const {publishInspectionActivity,captureTwigBookingCanceled,captureTwigException}=useExperienceRuntime();

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
  const needsTripClick = errorLab.active && (
    (errorStage === 2 && errorLab.state.occurrences.length === 0) ||
    errorStage === 4 ||
    (errorStage === 6 && !errorLab.state.successfulRetry) ||
    ((errorStage === 8 || errorStage === 9) && !errorLab.state.hostVerified)
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
    try {
      const hostName = readTripHost(
        isLabBooking && !errorLab.state.hostLookupRepaired ? {} : hosts,
        booking.stay.hostId,
        isLabBooking && errorLab.state.fixed
      );
      setDetail({ revision: errorLab.state.revision, bookingId: booking.id, error: null, host: hostName });
      if (isLabBooking && errorLab.state.hostLookupRepaired) errorLab.dispatch({ type: "verify-host" });
      else if (isLabBooking && errorLab.state.fixed) errorLab.dispatch({ type: "retry-success" });
    } catch (error) {
      setDetail({ revision: errorLab.state.revision, bookingId: booking.id, error: "Try to load details again.", host: null });
      if (isLabBooking) {
        publishInspectionActivity(
          "$exception",
          {
            exception_type: error instanceof TypeError
              ? "TypeError"
              : "Error",
            surface: "trip_details"
          },
          {
            simulated: true
          }
        );
        errorLab.dispatch({
          type: "capture",
          message: error instanceof Error ? error.message : "Could not read trip host",
          stayId: booking.stay.id,
        });
      } else {
        captureTwigException(error, { surface: "trip_details", stayId: booking.stay.id });
      }
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
            headingAccessory={<Marker id="errors" />}
            selectedBookingId={visibleDetail?.bookingId}
            highlightedDetailsBookingId={needsTripClick && (!linkedDetailsOpen || errorStage === 8 || errorStage === 9) ? linkedBookingId : undefined}
            highlightedTripDetailsBookingId={errorLab.active && errorStage === 6 && errorLab.state.successfulRetry && visibleDetail?.host === "Host information unavailable" ? linkedBookingId : undefined}
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
