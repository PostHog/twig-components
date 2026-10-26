const mark = new URL("./assets/posthog-logomark.svg", import.meta.url).href;

export function AuthorBrand() {
  return <a href="/author" className="ph-author-header-name" aria-label="PostHog Learn Studio"><img src={mark} width="36" height="20" alt=""/><span>Learn Studio</span></a>;
}
