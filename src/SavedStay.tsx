"use client";

import { useId, type ReactElement } from "react";

type SavedStayBaseProps = {
  /** The stay name used in the button's accessible label. */
  stayName: string;
  /** Prevents interaction. Loading also disables the button. */
  disabled?: boolean;
  /** Shows the pending state while the host signs in, saves, or removes. */
  loading?: boolean;
  /** A host-supplied error shown directly below the control. */
  errorMessage?: string | null;
  className?: string;
};

export type SignedOutSavedStayProps = SavedStayBaseProps & {
  signedIn: false;
  onSignIn: () => void;
  saved?: never;
  onSavedChange?: never;
};

export type SignedInSavedStayProps = SavedStayBaseProps & {
  signedIn: true;
  saved: boolean;
  onSavedChange: (nextSaved: boolean) => void;
  onSignIn?: never;
};

export type SavedStayProps =
  | SignedOutSavedStayProps
  | SignedInSavedStayProps;

/**
 * A controlled Twig save control. The host owns authentication, persistence,
 * analytics, and the async request represented by `loading`.
 */
export function SavedStay(props: SavedStayProps): ReactElement {
  const errorId = useId();
  const saved = props.signedIn ? props.saved : false;
  const loading = props.loading ?? false;
  const disabled = props.disabled || loading;
  const visibleLabel = loading
    ? props.signedIn
      ? saved
        ? "Removing…"
        : "Saving…"
      : "Signing in…"
    : saved
      ? "Saved"
      : props.signedIn
        ? "Save"
        : "Log in to save";
  const accessibleLabel = props.signedIn
    ? saved
      ? `${loading ? "Removing" : "Remove"} ${props.stayName} from saved stays`
      : `${loading ? "Saving" : "Save"} ${props.stayName}`
    : `${loading ? "Signing in to save" : "Sign in to save"} ${props.stayName}`;

  function handleClick() {
    if (props.signedIn) {
      props.onSavedChange(!props.saved);
    } else {
      props.onSignIn();
    }
  }

  return (
    <span
      className={`twig-saved-stay${props.className ? ` ${props.className}` : ""}`}
      data-signed-in={props.signedIn}
      data-saved={saved}
      data-loading={loading}
    >
      <button
        type="button"
        className="twig-saved-stay-button"
        aria-label={accessibleLabel}
        aria-pressed={props.signedIn ? saved : undefined}
        aria-busy={loading || undefined}
        aria-describedby={props.errorMessage ? errorId : undefined}
        disabled={disabled}
        onClick={handleClick}
      >
        <svg
          className="twig-saved-stay-icon"
          viewBox="0 0 20 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3.5 2.5h13v18.2L10 16.3l-6.5 4.4V2.5Z" />
        </svg>
        <span className="twig-saved-stay-status" aria-live="polite">{visibleLabel}</span>
      </button>
      {props.errorMessage && (
        <span id={errorId} className="twig-saved-stay-error" role="alert">
          {props.errorMessage}
        </span>
      )}
    </span>
  );
}
