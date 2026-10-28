"use client";

/** Twig's page fallback when a route fails to render. The host captures the error and passes `onRetry`. */
export function RouteErrorView({ onRetry }: { onRetry?: () => void }) {
  return (
    <main id="vac-main" className="vac-main" role="alert">
      <h1>Something went wrong</h1>
      <p>Twig couldn’t show this page. Please try again.</p>
      {onRetry && <button type="button" className="vac-button" onClick={onRetry}>Try again</button>}
    </main>
  );
}
