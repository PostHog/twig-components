import Image from "./TwigImage.js";
import { stayPhotoClassName, type Stay } from "../lib/vacation/catalog.js";
import { StayImage } from "./StayCard.js";

export function StayGallery({ stay }: { stay: Stay }) {
  if (stay.images.length < 2) return <StayImage stay={stay} large />;

  return (
    <div className="vac-gallery">
      <div className="vac-gallery-grid">
        {stay.images.map((image, index) => (
          <figure key={image.src}>
            <a
              href={image.src}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open photo ${index + 1} of ${
                stay.images.length
              } in a new tab`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                className={stayPhotoClassName(image)}
                width={1500}
                height={1000}
                sizes="(max-width: 800px) 100vw, 50vw"
                priority={index === 0}
              />
            </a>
            {(image.credit || stay.photoCredit) && (
              <figcaption className="vac-muted">
                {image.creditUrl ? (
                  <a href={image.creditUrl} target="_blank" rel="noreferrer">
                    Photo: {image.credit || stay.photoCredit} ↗
                  </a>
                ) : (
                  <>Photo: {image.credit || stay.photoCredit}</>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
