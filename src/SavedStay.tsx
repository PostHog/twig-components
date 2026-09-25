"use client";

import { stayLabel, type Stay } from "./catalog.js";

export type SavedStayProps = {
  stay: Stay;
  accountId: string | null;
  saved: boolean;
  onSignIn: () => void;
  signInLabel?: string;
  onSignOut: () => void;
  onToggleSave: () => void;
};

/** Twig account and saved-stay controls. The host owns identity and persistence. */
export function SavedStay({
  stay,
  accountId,
  saved,
  onSignIn,
  signInLabel = "Sign in",
  onSignOut,
  onToggleSave,
}: SavedStayProps) {
  return (
    <section className="vac-saved-stay" aria-label="Save this stay">
      {accountId ? (
        <>
          <p>Signed in as <strong>{accountId}</strong></p>
          <div className="vac-saved-stay-actions">
            <button type="button" onClick={onToggleSave} aria-pressed={saved}>
              {saved ? "Saved to your stays" : `Save ${stayLabel(stay)}`}
            </button>
            <button type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </>
      ) : (
        <>
          <p>Sign in to save this stay.</p>
          <button type="button" onClick={onSignIn}>{signInLabel}</button>
        </>
      )}
    </section>
  );
}
