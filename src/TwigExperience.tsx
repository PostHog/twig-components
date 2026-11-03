"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ExperienceRuntime, type TwigExperienceEvent } from "./experience/Runtime.js";
export type {TwigExperienceEvent} from "./experience/Runtime.js";
function isStartingPath(path:string) { return /^(\/|\/about|\/login|\/profile(?:\/(?:saved|bookings|settings))?|\/stays\/stay-0[123])$/.test(path); }

import { TwigNavigationProvider, type TwigNavigationValue } from "./experience/components/TwigNavigation.js";
import { VacationShell } from "./experience/components/Playground.js";
import Discover from "./experience/components/Discover.js";
import { AboutPageView } from "./experience/components/AboutPageView.js";
import { StayPageView } from "./experience/components/StayPageView.js";
import { AccountPageView, LoginPageView } from "./experience/components/AccountPages.js";
import { safeAccountRedirect } from "./experience/lib/vacation/account-links.js";

function TwigPage({ url }: { url: URL }) {
  const path = url.pathname;
  if (path === "/") return <Discover />;
  if (path === "/about") return <AboutPageView />;
  if (path.startsWith("/stays/")) return <StayPageView stayId={path.split("/")[2]} />;
  if (path === "/login") return <LoginPageView next={safeAccountRedirect(url.searchParams.get("next") ?? undefined)} />;
  const section = path.split("/")[2];
  return <AccountPageView section={section === "saved" || section === "bookings" || section === "settings" ? section : "profile"} />;
}

export type AuthorLabPreview = {
  content: ReactNode; footer: ReactNode; progress: string;
  navigation?: ReactNode; headerActions?: ReactNode;
  product?: "Product Analytics" | "AI Observability" | "Session Replay" | "Error Tracking" | null;
  onProductSelect?: (product: NonNullable<AuthorLabPreview["product"]>) => void;
};

/** Render real Twig components directly; Shadow DOM isolates their existing styles. */
export function TwigExperience({ startingPath = "/", onReset, onEvent, lab }: {
  lab?: AuthorLabPreview; startingPath?: string; onReset: () => void;
  onEvent?: (event: TwigExperienceEvent) => void;
}) {
  const [history, setHistory] = useState({ entries: [isStartingPath(startingPath) ? startingPath : "/"], index: 0 });
  const [surface, setSurface] = useState<{ host: HTMLDivElement; root: ShadowRoot; content: HTMLDivElement } | null>(null);
  const url = new URL(history.entries[history.index], "https://twig.local");
  const mount = useCallback((host: HTMLDivElement | null) => {
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    const content = document.createElement("div");
    content.className = "twig-preview-viewport";
    root.replaceChildren(content);
    setSurface({ host, root, content });
  }, []);
  useEffect(() => {
    if (!surface) return;
    // Reuse the exact loaded app styles; keep HMR stylesheet replacements in sync.
    const styles = document.createElement("div");
    surface.root.prepend(styles);
    const sync = () => styles.replaceChildren(...Array.from(document.head.querySelectorAll('link[rel="stylesheet"],style')).map(node => node.cloneNode(true)));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => { observer.disconnect(); styles.remove(); };
  }, [surface]);

  const navigate = useCallback((href: string, replace = false) => {
    const next = new URL(href, "https://twig.local");
    if (next.origin !== "https://twig.local" || !isStartingPath(next.pathname)) return;
    const path = next.pathname + next.search;
    setHistory(previous => replace ? { ...previous, entries: previous.entries.map((entry, i) => i === previous.index ? path : entry) } : { entries: [...previous.entries.slice(0, previous.index + 1), path], index: previous.index + 1 });
    surface?.content.scrollTo({ top: 0 });
  }, [surface]);
  const router = useMemo<TwigNavigationValue["router"]>(() => ({
    push: href => navigate(href), replace: href => navigate(href, true),
    back: () => setHistory(previous => ({ ...previous, index: Math.max(0, previous.index - 1) })),
    forward: () => setHistory(previous => ({ ...previous, index: Math.min(previous.entries.length - 1, previous.index + 1) })),
    refresh: onReset, prefetch: () => {},
  }), [navigate, onReset]);
  return <>
    <div ref={mount} className="twig-experience-frame" role="region" aria-label="Twig website" />
    {surface && createPortal(<ExperienceRuntime onEvent={onEvent}><TwigNavigationProvider value={{ pathname: url.pathname, router, portalRoot: surface.content }}><VacationShell authorLab={lab}><TwigPage key={url.pathname} url={url} /></VacationShell></TwigNavigationProvider></ExperienceRuntime>, surface.content)}
  </>;
}

export {twigExperienceAsset} from "./experience/assets.js";
