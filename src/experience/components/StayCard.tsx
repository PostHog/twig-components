"use client";
import {useExperienceRuntime} from "../Runtime.js";

import Image from "./TwigImage.js";
import Link from "./TwigNavigation.js";
import { usePathname, useRouter } from "./TwigNavigation.js";
import { stayPhotoClassName, type Stay } from "../lib/vacation/catalog.js";
import { loginHref } from "../lib/vacation/account-links.js";
import { StayCardContent } from "../../StayCard.js";
import { SavedStay } from "../../SavedStay.js";

import { useDemoAccount } from "./DemoAccount.js";

export function StayImage({
  stay,
  large = false,
  eager = false,
}: {
  stay: Stay;
  large?: boolean;
  eager?: boolean;
}) {
  const image = stay.images[0];
  return (
    <div className={`vac-image${large ? " vac-image-large" : ""}`}>
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          loading={eager ? "eager" : "lazy"}
          className={stayPhotoClassName(image)}
          sizes={
            large
              ? "(max-width: 800px) 100vw, 65vw"
              : "(max-width: 600px) 100vw, 33vw"
          }
        />
      ) : (
        <span>Photos unavailable</span>
      )}
    </div>
  );
}

export function StayCard({
  stay,
  linked = true,
  eager = false,
}: {
  stay: Stay;
  linked?: boolean;
  eager?: boolean;
}) {
  return (
    <article className="vac-card">
      {linked ? (
        <Link
          data-replay-label={`Open stay: ${stay.id}`}
          href={`/stays/${stay.id}`}
        >
          <StayCardContent
            stay={stay}
            image={<StayImage stay={stay} eager={eager} />}
            linked
          />
        </Link>
      ) : (
        <StayCardContent stay={stay} image={<StayImage stay={stay} eager={eager} />} />
      )}
      <div className="vac-card-save"><StaySaveControl stay={stay} /></div>
    </article>
  );
}

export function StaySaveControl({ stay }: { stay: Stay }) {
const {trackTwigEvent}=useExperienceRuntime();

  const account = useDemoAccount();
  const pathname = usePathname();
  const router = useRouter();
  const saved = account.savedStayIds.includes(stay.id);
  const source = pathname === "/" ? "discover" : "stay";
  return account.signedIn ? (
    <SavedStay
      stayName={stay.title ?? `${stay.setting} stay`}
      signedIn
      saved={saved}
      onSavedChange={() => account.toggleSaved(stay.id, source)}
    />
  ) : (
    <SavedStay
      stayName={stay.title ?? `${stay.setting} stay`}
      signedIn={false}
      onSignIn={() => {
        trackTwigEvent(
          "twig_demo_login_prompted",
          {
            source: "save"
          }
        );
        router.push(loginHref(pathname));
      }}
    />
  );
}
