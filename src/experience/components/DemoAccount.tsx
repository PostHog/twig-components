"use client";
import {useExperienceRuntime} from "../Runtime.js";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AccountSettingsValue } from "../../Account.js";
import type { ErrorTrackingAction } from "../../error-tracking-lab.js";

import {
  type DemoAccountAction,
  demoAccountReducer,
  demoAccountStorageKey,
  initialDemoAccountState,
  parseDemoAccountState,
  type DemoBooking,
  type ErrorTrackingSession,
} from "../lib/vacation/demo-account.js";
import { clearTwigStorage } from "../lib/vacation/lab-reset.js";

type DemoAccountContextValue = {
  ready: boolean;
  signedIn: boolean;
  savedStayIds: readonly string[];
  bookings: readonly DemoBooking[];
  errorTracking: ErrorTrackingSession;
  settings: AccountSettingsValue;
  login: () => void;
  confirmBooking: (booking: DemoBooking, errorLabStayTitle?: string) => void;
  logout: () => void;
  toggleSaved: (stayId: string, source: "discover" | "stay" | "saved") => void;
  book: (booking: DemoBooking, source: "lab" | "stay") => void;
  cancelBooking: (bookingId: string) => void;
  dispatchErrorTracking: (action: ErrorTrackingAction) => void;
  setErrorTrackingStage: (stage: number) => void;
  updateSettings: (settings: AccountSettingsValue) => void;
  resetBrowserState: () => void;
};

const DemoAccountContext = createContext<DemoAccountContextValue | null>(null);
const serverSnapshot = JSON.stringify(initialDemoAccountState);
const accountSubscribers = new Set<() => void>();

function subscribeToAccount(callback: () => void): () => void {
  accountSubscribers.add(callback);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === demoAccountStorageKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    accountSubscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getAccountSnapshot(): string {
  try {
    return window.localStorage.getItem(demoAccountStorageKey) ?? serverSnapshot;
  } catch {
    return serverSnapshot;
  }
}

function updateAccount(action: DemoAccountAction) {
  const previous = parseDemoAccountState(getAccountSnapshot());
  const next = demoAccountReducer(previous, action);
  if (next === previous) return null;
  try {
    window.localStorage.setItem(demoAccountStorageKey, JSON.stringify(next));
  } catch {
    return null;
  }
  accountSubscribers.forEach((notify) => notify());
  return { previous, next };
}

function resetBrowserState(): void {
  clearTwigStorage(window.localStorage);
  clearTwigStorage(window.sessionStorage);
  // The storage event only reaches other tabs, so notify this tab directly.
  accountSubscribers.forEach((notify) => notify());
}

function subscribeToClient(): () => void {
  return () => undefined;
}

export function DemoAccountProvider({ children }: { children: ReactNode }) {
const {trackTwigEvent}=useExperienceRuntime();

  const snapshot = useSyncExternalStore(subscribeToAccount, getAccountSnapshot, () => serverSnapshot);
  const ready = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const state = parseDemoAccountState(snapshot);

  return (
    <DemoAccountContext.Provider
      value={{
        ready,
        signedIn: state.signedIn,
        savedStayIds: state.savedStayIds,
        bookings: state.bookings,
        errorTracking: state.errorTracking,
        settings: state.settings,
        login: () => {
          const result = updateAccount({ type: "login" });
          if (result && !result.previous.signedIn) {
            trackTwigEvent(
              "twig_demo_account_logged_in",
              {

              }
            );
          }
        },
        logout: () => {
          const result = updateAccount({ type: "logout" });
          if (result?.previous.signedIn) {
            trackTwigEvent(
              "twig_demo_account_logged_out",
              {

              }
            );
          }
        },
        confirmBooking: (booking, errorLabStayTitle) => {
          const result = updateAccount({ type: "confirm-booking", booking, errorLabStayTitle });
          if (result && !result.previous.bookings.some((item) => item.status === "confirmed" && item.stayId === booking.stayId && item.checkIn === booking.checkIn && item.checkOut === booking.checkOut)) {
            trackTwigEvent(
              "twig_demo_booking_saved",
              {
                stay_id: booking.stayId,
                source: "stay"
              }
            );
          }
        },
        toggleSaved: (stayId, source) => {
          const result = updateAccount({ type: "toggle-saved", stayId });
          if (!result) return;
          const saved = result.next.savedStayIds.includes(stayId);
          if (saved && source !== "saved") {
            trackTwigEvent(
              "twig_stay_saved",
              {
                stay_id: stayId,
                source
              }
            );
          } else if (!saved) {
            trackTwigEvent(
              "twig_stay_unsaved",
              {
                stay_id: stayId,
                source
              }
            );
          }
        },
        book: (booking, source) => {
          const result = updateAccount({ type: "book", booking });
          if (result && !result.previous.bookings.some((item) => item.id === booking.id)) {
            trackTwigEvent(
              "twig_demo_booking_saved",
              {
                stay_id: booking.stayId,
                source,
              }
            );
          }
        },
        cancelBooking: (bookingId) => updateAccount({ type: "cancel-booking", bookingId }),
        dispatchErrorTracking: (action) => updateAccount({ type: "error-tracking-action", action }),
        setErrorTrackingStage: (stage) => updateAccount({ type: "error-tracking-stage", stage }),
        updateSettings: (settings) => {
          const result = updateAccount({ type: "update-settings", settings });
          if (!result) return;
          const changedFields: Array<"trip_reminders" | "product_updates"> = [];
          if (result.previous.settings.tripReminders !== result.next.settings.tripReminders) {
            changedFields.push("trip_reminders");
          }
          if (result.previous.settings.productUpdates !== result.next.settings.productUpdates) {
            changedFields.push("product_updates");
          }
          if (changedFields.length) {
            trackTwigEvent(
              "twig_demo_account_settings_saved",
              {
                changed_fields: changedFields,
              }
            );
          }
        },
        resetBrowserState,
      }}
    >
      {children}
    </DemoAccountContext.Provider>
  );
}

export function useDemoAccount(): DemoAccountContextValue {
  const account = useContext(DemoAccountContext);
  if (!account) throw new Error("useDemoAccount must be used inside DemoAccountProvider");
  return account;
}
