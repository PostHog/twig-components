import Image from "./TwigImage.js";

export function AboutPageView() {
  return (
    <main id="vac-main" className="vac-main vac-about">
      <h1>About Twig</h1>
      <p className="vac-intro">
        Twig is an example app built to help you learn how PostHog works in a
        product. Browse fictional stays and try things out without making a
        real reservation or payment. Open the playground to see how PostHog
        helps you understand what people do, where they get stuck, and what to
        improve.
      </p>
      <p className="vac-about-credit">
        <span className="vac-about-credit-love">
          Made with{" "}
          <Image src="/twig/heart-hoggie.svg" width={40} height={40} alt="love" loading="eager" />
        </span>{" "}
        <span>by the PostHog Wizard &amp; <span className="vac-about-credit-team">Docs team</span></span>
      </p>
    </main>
  );
}
