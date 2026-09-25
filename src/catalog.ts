/** Fictional stays. Stay and host content is supplied by Sarah. */

export const guestType = "human" as const;

export type CharacterContent = {
  id: string;
  revision: string | null;
  name: string | null;
  species: string | null;
  portrait: { src: string; alt: string } | null;
  biography: string | null;
  voiceGuidance: string | null;
  approvedExamples: readonly string[];
};

export type Stay = {
  id: string;
  hostId: string;
  title: string | null;
  setting: "Forest" | "Coast" | "City";
  location: string | null;
  images: readonly {
    src: string;
    alt: string;
    source: string;
    credit?: string;
    creditUrl?: string;
    objectPosition?: string;
  }[];
  nightlyRate: number;
  currency: "USD";
  capacity: number | null;
  amenities: readonly string[];
  cancellationPolicy: string | null;
  accommodationType?: string;
  vibe?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sleepingArrangements?: readonly string[];
  lakeAccess?: string;
  photoCredit?: string;
};

// Sarah supplies all character fields. IDs are technical references, not names.
export const characters: readonly CharacterContent[] = [
  {
    id: "woodrow-sparks",
    revision: "2026-09-21",
    name: "Woodrow “Woody” Sparks",
    species: "Pileated woodpecker",
    portrait: null,
    biography:
      "I came up for Woodstock and never quite got around to leaving. I believe in sharing the harvest, looking after the land, and not letting a perfectly good afternoon become productive. You humans seem to struggle with that last one. Come sit by the fire. We’ll work on it. The chickens have asked me to clarify that they are residents, not amenities.",
    voiceGuidance:
      "Sarah’s character direction: a laid-back hippie who never left upstate New York after Woodstock, but migrated to a cabin upstate. Keeps chickens; big into sharecropping and saving the environment. Write in first person with warm, deadpan observations about human habits from an animal’s perspective. Be a welcoming host who finds humans mildly baffling. Keep practical facts clear; use occasional understated jokes, not a punchline in every sentence. Sarah requested Bear & Breakfast as a tonal reference; write original wording and retain Woody’s own character.",
    approvedExamples: [],
  },
  {
    id: "dolores",
    revision: "2026-09-23",
    name: "Dolores",
    species: "Australian galah cockatoo",
    portrait: null,
    biography:
      "I bought this Gold Coast beachfront condo for the ocean view and decorated it like Miami in 1987 had challenged me personally. The neighbors call it excessive. I call it easy to find from the beach.",
    voiceGuidance: null,
    approvedExamples: [],
  },
  {
    id: "colette",
    revision: "2026-09-23",
    name: "Colette",
    species: "Eurasian magpie",
    portrait: null,
    biography:
      "I'm from Paris. I own fewer things than most magpies, but each one has earned its place. The studio is small. The standards are not. Bring the outfit you were saving. The city is the occasion.",
    voiceGuidance:
      "Sarah's character direction: Colette is a Eurasian magpie from Paris, impossibly chic and effortlessly cool. Her voice is spare, self-assured, and fashion-forward. Keep practical stay details clear and avoid making her sound impressed with herself.",
    approvedExamples: [],
  },
];

export const conciergeContent = {
  revision: null,
  name: null,
  voiceGuidance: null,
  approvedExamples: [],
} satisfies Omit<CharacterContent, "id" | "species" | "portrait" | "biography">;

export const stays: readonly Stay[] = [
  {
    id: "stay-01",
    hostId: "woodrow-sparks",
    setting: "Forest",
    title: "Adiron-shack",
    location: "Adirondacks, New York",
    accommodationType: "A-frame cabin",
    vibe: "Get me out of the city. Preferably near a fire pit.",
    description:
      "An A-frame cabin in the Adirondacks for four humans. Two king bedrooms, each with a private bathroom. Humans have strong feelings about doors. There’s a path down to the lake, a grill, and a back patio with a fire pit. Woody’s chickens live on the property, too. They’ve been enjoying the outdoors without booking anything.",
    nightlyRate: 355,
    currency: "USD",
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    sleepingArrangements: [
      "King bed · Private bathroom",
      "King bed · Private bathroom",
    ],
    amenities: [
      "Lake access via a walking path",
      "Fireplace / fire pit",
      "Grill",
      "Back patio",
    ],
    lakeAccess:
      "The cabin is not lakefront. A walking path leads down to the lake.",
    cancellationPolicy: null,
    images: [
      {
        src: "/twig/stays/adiron-shack/cabin.jpg",
        alt: "Dark A-frame cabin among autumn trees, with a gravel path leading to the entrance at dusk",
        source: "clay-banks-gmQr2-qWkYQ-unsplash.jpg",
        creditUrl:
          "https://unsplash.com/photos/a-small-black-cabin-in-the-middle-of-a-forest-gmQr2-qWkYQ",
      },
      {
        src: "/twig/stays/adiron-shack/patio.jpg",
        alt: "A-frame cabin with a back patio, string lights, and chairs around an outdoor fire pit",
        source: "clay-banks-AZDyU1hXtCE-unsplash.jpg",
        creditUrl:
          "https://unsplash.com/photos/a-frame-cabin-in-the-woods-with-a-green-door-DS2rtg-Nbgk",
      },
    ],
    photoCredit: "Clay Banks / Unsplash",
  },
  {
    id: "stay-02",
    hostId: "dolores",
    setting: "Coast",
    title: "Flamingo's Envy",
    location: "Gold Coast, Queensland, Australia",
    accommodationType: "Beachfront condo",
    vibe: "So much '80s Miami that even the flamingos are jealous.",
    description:
      "Flamingo's Envy doesn't do understated. The pastel exterior makes the introduction, and Dolores has taken the same approach indoors. The Gold Coast beach is just outside, with a balcony and ocean view worth lingering over. Two queen bedrooms, two bathrooms, and a pullout couch make room for five. There's a full kitchen for the hours between beach trips.",
    nightlyRate: 240,
    currency: "USD",
    capacity: 5,
    bedrooms: 2,
    bathrooms: 2,
    sleepingArrangements: [
      "Queen bed",
      "Queen bed",
      "Double pullout couch · sleeps one guest",
    ],
    amenities: [
      "Beach access",
      "Balcony",
      "Full kitchen",
      "Air conditioning",
      "Wi-Fi",
      "Washer",
    ],
    cancellationPolicy: null,
    images: [
      {
        src: "/twig/stays/gold-coast-condo/pastel-buildings.jpg",
        alt: "Turquoise and pink buildings framed by palm trees",
        source: "viktorija-demjanenko-PB6Mr73wTaE-unsplash.jpg",
        credit: "Viktorija Demjanenko / Unsplash",
        creditUrl:
          "https://unsplash.com/photos/colorful-turquoise-and-pink-buildings-with-palm-trees-PB6Mr73wTaE",
        objectPosition: "center 74%",
      },
      {
        src: "/twig/stays/gold-coast-condo/gold-coast-beach-pastel.jpg",
        alt: "People walking along a Gold Coast beach with waves and the skyline beyond",
        source: "cameron-voyce-M9dozzTiNIo-unsplash.jpg",
        credit: "Cameron Voyce / Unsplash",
        creditUrl:
          "https://unsplash.com/photos/a-group-of-people-walking-along-a-beach-next-to-the-ocean-M9dozzTiNIo",
      },
    ],
  },
  {
    id: "stay-03",
    hostId: "colette",
    setting: "City",
    title: "Le Nid Chic",
    location: "Paris, France",
    accommodationType: "Paris studio",
    vibe: "The outfit has its own itinerary.",
    description:
      "Colette has made every inch of Le Nid Chic count. The Paris studio has a double bed for two, a kitchenette, and a full-length mirror for one last look before going out. Open the balcony doors, take in the city, then head out for art, clothes, and whatever catches your eye. When you come back, there's room to put it all away.",
    nightlyRate: 220,
    currency: "USD",
    capacity: 2,
    bedrooms: 0,
    bathrooms: 1,
    sleepingArrangements: ["1 double bed"],
    amenities: ["Kitchenette", "Wi-Fi", "Full-length mirror", "Clothes storage"],
    cancellationPolicy: null,
    images: [
      {
        src: "/twig/stays/paris-studio/paris-facade-editorial.jpg",
        alt: "Paris apartment buildings with wrought-iron balconies beneath a cloudy sky",
        source: "alex-boyd-HhFi1gKYosc-unsplash.jpg",
        credit: "Alex Boyd / Unsplash",
        creditUrl:
          "https://unsplash.com/photos/beige-concrete-building-near-green-trees-under-white-clouds-during-daytime-HhFi1gKYosc",
      },
      {
        src: "/twig/stays/paris-studio/studio-editorial.jpg",
        alt: "Blue bedding and a book beside open balcony doors overlooking Paris",
        source: "julia-cheperis-GmCI4X9Kz4s-unsplash.jpg",
        credit: "Julia Cheperis / Unsplash",
        creditUrl:
          "https://unsplash.com/photos/a-bed-with-pillows-and-a-book-on-it-GmCI4X9Kz4s",
      },
    ],
  },
];

export function stayLabel(stay: Stay) {
  return stay.title ?? `${stay.setting} stay`;
}

export function nightlyPrice(stay: Stay) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: stay.currency,
    maximumFractionDigits: 0,
  }).format(stay.nightlyRate);
}

export function filterStays(setting: "All" | Stay["setting"], search = "") {
  return stays.filter(
    (stay) =>
      (setting === "All" || stay.setting === setting) &&
      `${stay.title ?? ""} ${stay.location ?? ""} ${stay.setting}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
}

export const discoveryCopy = {
  title: "Vacation rentals.",
  subtitle: "Run by birds.",
  introduction:
    "Birds know how to build a home. Now they’re designing your next getaway.",
};
