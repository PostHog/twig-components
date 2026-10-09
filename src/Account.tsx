"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { StayCardContent } from "./StayCard.js";
import { SavedStay } from "./SavedStay.js";
import type { Stay } from "./catalog.js";

export type TravelerProfile = {
  displayName: string;
  email: string;
  homeTown?: string;
  bio?: string;
};

export type AccountSection = "profile" | "saved" | "bookings" | "settings";

export type AccountLink = {
  id: AccountSection;
  label: string;
  href: string;
};

export type AccountNavigationHandler = (href: string) => void;

export type BookedStaySummary = {
  id: string;
  stay: Stay;
  dateLabel: string;
  guestsLabel: string;
  statusLabel: string;
};

export type AccountSettingsValue = TravelerProfile & {
  tripReminders: boolean;
  productUpdates: boolean;
};

function followLink(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate?: AccountNavigationHandler
) {
  if (!onNavigate) return;
  event.preventDefault();
  onNavigate(href);
}

export function DefaultAvatarIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`twig-account-avatar${className ? ` ${className}` : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3" />
      </svg>
    </span>
  );
}

export type LoginViewProps = {
  email: string;
  passwordMask?: string;
  loading?: boolean;
  errorMessage?: string | null;
  onLogin: () => void;
  className?: string;
};

/** A fixed-credential login view. No credential value is submitted to the host. */
export function LoginView({
  email,
  passwordMask = "••••••••••••",
  loading = false,
  errorMessage,
  onLogin,
  className = "",
}: LoginViewProps): ReactElement {
  const titleId = useId();
  const errorId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin();
  }

  return (
    <section className={`twig-login-view${className ? ` ${className}` : ""}`} aria-labelledby={titleId}>
      <div className="twig-login-card">
        <h1 id={titleId}>Log in to Twig</h1>
        <p className="twig-login-hint twig-account-muted">
          <svg className="twig-login-hint-icon" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 9v5" />
            <circle cx="10" cy="6" r="0.7" fill="currentColor" stroke="none" />
          </svg>
          <span>Use the pre-filled demo account</span>
        </p>
        <form onSubmit={submit} aria-describedby={errorMessage ? errorId : undefined}>
          <label htmlFor={`${titleId}-email`}>Email</label>
          <input id={`${titleId}-email`} type="email" value={email} readOnly />
          <label htmlFor={`${titleId}-password`}>Password</label>
          <input
            id={`${titleId}-password`}
            type="text"
            value={passwordMask}
            aria-label="Password, masked"
            readOnly
          />
          {errorMessage && <p id={errorId} className="twig-account-error" role="alert">{errorMessage}</p>}
          <button className="vac-button vac-primary twig-login-submit" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </section>
  );
}

export type ProfileMenuProps = {
  profile: TravelerProfile;
  links: readonly AccountLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
  onNavigate?: AccountNavigationHandler;
  className?: string;
};

/** A controlled profile disclosure. The package owns its accessible interaction behavior. */
export function ProfileMenu({
  profile,
  links,
  open,
  onOpenChange,
  onSignOut,
  onNavigate,
  className = "",
}: ProfileMenuProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function closeOnPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onOpenChange(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeOnPointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className={`twig-profile-menu${className ? ` ${className}` : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="twig-profile-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => onOpenChange(!open)}
      >
        <DefaultAvatarIcon />
        <span className="twig-profile-trigger-name">{profile.displayName}</span>
        <svg className="twig-profile-chevron" viewBox="0 0 12 8" aria-hidden="true" focusable="false">
          <path d="m1 1 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="twig-profile-popover">
          <div className="twig-profile-summary">
            <DefaultAvatarIcon />
            <span><strong>{profile.displayName}</strong><small>{profile.email}</small></span>
          </div>
          <nav aria-label="Profile">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(event) => {
                  followLink(event, link.href, onNavigate);
                  onOpenChange(false);
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <button type="button" className="twig-profile-signout" onClick={onSignOut}>Log out</button>
        </div>
      )}
    </div>
  );
}

export type AccountLayoutProps = {
  profile: TravelerProfile;
  active: AccountSection;
  links: readonly AccountLink[];
  onNavigate?: AccountNavigationHandler;
  children: ReactNode;
};

export function AccountLayout({
  profile,
  active,
  links,
  onNavigate,
  children,
}: AccountLayoutProps): ReactElement {
  return (
    <div className="twig-account-layout">
      <aside className="twig-account-sidebar">
        <div className="twig-account-identity">
          <DefaultAvatarIcon />
          <span><strong>{profile.displayName}</strong><small>{profile.email}</small></span>
        </div>
        <nav aria-label="Account">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              aria-current={link.id === active ? "page" : undefined}
              onClick={(event) => followLink(event, link.href, onNavigate)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="twig-account-content">{children}</div>
    </div>
  );
}

export type ProfileOverviewProps = {
  profile: TravelerProfile;
  onBioChange?: (bio: string) => void;
};

export function ProfileOverview({ profile, onBioChange }: ProfileOverviewProps): ReactElement {
  const bioId = useId();
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile.bio ?? "");

  function startEditingBio() {
    setBioDraft(profile.bio ?? "");
    setEditingBio(true);
  }

  function saveBio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bio = bioDraft.trim();
    if (!bio || !onBioChange) return;
    onBioChange(bio);
    setEditingBio(false);
  }

  return (
    <section className="twig-account-page twig-profile-page" aria-labelledby="twig-profile-title">
      <span className="vac-eyebrow">Traveler profile</span>
      <h1 id="twig-profile-title">{profile.displayName}</h1>
      <p className="twig-account-muted">View or edit your Twig profile. This profile is shared with your host when you book a stay.</p>
      <div className="twig-profile-card">
        <div className="twig-profile-card-intro">
          <DefaultAvatarIcon className="twig-profile-avatar-large" />
          <div>
            <span className="vac-eyebrow">Twig traveler</span>
            <h2>{profile.displayName}</h2>
          </div>
        </div>
        {profile.bio && (
          <div className="twig-profile-bio">
            <div className="twig-profile-bio-header">
              <h2>About</h2>
              {onBioChange && !editingBio && (
                <button className="twig-profile-edit" type="button" aria-label="Edit About" onClick={startEditingBio}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m4 20 4.4-1 10.8-10.8-3.4-3.4L5 15.6 4 20Z" />
                    <path d="m13.9 6.7 3.4 3.4" />
                  </svg>
                </button>
              )}
            </div>
            {editingBio ? (
              <form className="twig-profile-bio-form" onSubmit={saveBio}>
                <label className="vac-sr-only" htmlFor={bioId}>About</label>
                <textarea id={bioId} value={bioDraft} onChange={(event) => setBioDraft(event.target.value)} rows={5} />
                <div>
                  <button className="vac-button vac-primary" type="submit" disabled={!bioDraft.trim()}>Save</button>
                  <button className="vac-button" type="button" onClick={() => setEditingBio(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <p>{profile.bio}</p>
            )}
          </div>
        )}
        <dl className="twig-profile-facts">
          {profile.homeTown && <div><dt>Home town</dt><dd>{profile.homeTown}</dd></div>}
        </dl>
      </div>
    </section>
  );
}

type StayViewProps = {
  renderImage: (stay: Stay) => ReactNode;
  stayHref: (stay: Stay) => string;
  onNavigate?: AccountNavigationHandler;
};

export type SavedStaysViewProps = StayViewProps & {
  stays: readonly Stay[];
  browseHref?: string;
  onRemoveStay?: (stay: Stay) => void;
};

export function SavedStaysView({
  stays,
  renderImage,
  stayHref,
  browseHref = "/",
  onNavigate,
  onRemoveStay,
}: SavedStaysViewProps): ReactElement {
  return (
    <section className="twig-account-page" aria-labelledby="twig-saved-title">
      <span className="vac-eyebrow">Your account</span>
      <h1 id="twig-saved-title">Saved stays</h1>
      <p className="twig-account-muted">Keep the places you want to come back to.</p>
      {stays.length ? (
        <div className="twig-account-stay-grid">
          {stays.map((stay) => {
            const href = stayHref(stay);
            return (
              <article className="twig-account-stay-card" key={stay.id}>
                <a href={href} onClick={(event) => followLink(event, href, onNavigate)}>
                  <StayCardContent stay={stay} image={renderImage(stay)} linked />
                </a>
                {onRemoveStay && (
                  <div className="twig-account-stay-save">
                    <SavedStay
                      stayName={stay.title ?? `${stay.setting} stay`}
                      signedIn
                      saved
                      onSavedChange={() => onRemoveStay(stay)}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="twig-account-empty">
          <span className="twig-account-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 20 24" focusable="false"><path d="M2.5 2.5h15v19l-7.5-5-7.5 5v-19Z" /></svg>
          </span>
          <h2>No saved stays yet</h2>
          <p>Save a stay and it will appear here.</p>
          <a className="vac-button vac-primary" href={browseHref} onClick={(event) => followLink(event, browseHref, onNavigate)}>Browse stays</a>
        </div>
      )}
    </section>
  );
}

export type BookedStaysViewProps = StayViewProps & {
  bookings: readonly BookedStaySummary[];
  browseHref?: string;
};

export function BookedStaysView({
  bookings,
  renderImage,
  stayHref,
  browseHref = "/",
  onNavigate,
}: BookedStaysViewProps): ReactElement {
  return (
    <section className="twig-account-page" aria-labelledby="twig-bookings-title">
      <span className="vac-eyebrow">Your account</span>
      <h1 id="twig-bookings-title">Booked stays</h1>
      <p className="twig-account-muted">Your upcoming and previous Twig trips.</p>
      {bookings.length ? (
        <div className="twig-booking-list">
          {bookings.map((booking) => {
            const href = stayHref(booking.stay);
            return (
              <article className="twig-booking-card" key={booking.id}>
                <a className="twig-booking-image" href={href} onClick={(event) => followLink(event, href, onNavigate)}>
                  {renderImage(booking.stay)}
                </a>
                <div className="twig-booking-body">
                  <span className="twig-booking-status">{booking.statusLabel}</span>
                  <h2><a href={href} onClick={(event) => followLink(event, href, onNavigate)}>{booking.stay.title ?? `${booking.stay.setting} stay`}</a></h2>
                  <p>{booking.stay.location ?? booking.stay.setting}</p>
                  <dl><div><dt>Dates</dt><dd>{booking.dateLabel}</dd></div><div><dt>Guests</dt><dd>{booking.guestsLabel}</dd></div></dl>
                  <button
                    className="vac-button twig-booking-details"
                    type="button"
                    disabled
                    aria-label={`Stay details for ${booking.stay.title ?? booking.stay.setting} (coming later)`}
                  >
                    Stay details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="twig-account-empty">
          <span className="twig-account-empty-icon" aria-hidden="true">⌂</span>
          <h2>No booked stays yet</h2>
          <p>Complete a booking and your trip will appear here.</p>
          <a className="vac-button vac-primary" href={browseHref} onClick={(event) => followLink(event, browseHref, onNavigate)}>Find a stay</a>
        </div>
      )}
    </section>
  );
}

export type AccountSettingsViewProps = {
  value: AccountSettingsValue;
  onChange: (value: AccountSettingsValue) => void;
  onSave: () => void;
  saving?: boolean;
  statusMessage?: string | null;
};

export function AccountSettingsView({
  value,
  onChange,
  onSave,
  saving = false,
  statusMessage,
}: AccountSettingsViewProps): ReactElement {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }
  return (
    <section className="twig-account-page" aria-labelledby="twig-settings-title">
      <span className="vac-eyebrow">Your account</span>
      <h1 id="twig-settings-title">Account settings</h1>
      <p className="twig-account-muted">Review your profile and choose which messages you receive.</p>
      <form className="twig-account-settings" onSubmit={submit}>
        <fieldset>
          <legend>Personal details</legend>
          <dl className="twig-account-static-details">
            <div><dt>Display name</dt><dd>{value.displayName}</dd></div>
            <div><dt>Email</dt><dd>{value.email}</dd></div>
          </dl>
        </fieldset>
        <fieldset>
          <legend>Messages</legend>
          <label className="twig-account-check"><input type="checkbox" checked={value.tripReminders} onChange={(event) => onChange({ ...value, tripReminders: event.target.checked })} /><span><strong>Trip reminders</strong><small>Important updates about booked stays.</small></span></label>
          <label className="twig-account-check"><input type="checkbox" checked={value.productUpdates} onChange={(event) => onChange({ ...value, productUpdates: event.target.checked })} /><span><strong>News from Twig</strong><small>Occasional product and stay updates.</small></span></label>
        </fieldset>
        <div className="twig-account-settings-actions">
          <button className="vac-button vac-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          {statusMessage && <p role="status">{statusMessage}</p>}
        </div>
      </form>
    </section>
  );
}
