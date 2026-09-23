/** Fictional stays. Adiron-shack content supplied by Sarah; other entries remain fixtures. */

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
  setting: "Forest" | "Coast" | "Mountain";
  location: string | null;
  images: readonly {
    src: string;
    alt: string;
    source: string;
    creditUrl?: string;
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
  ...[1, 2, 3].map((index) => ({
    id: `host-${index}`,
    revision: null,
    name: null,
    species: null,
    portrait: null,
    biography: null,
    voiceGuidance: null,
    approvedExamples: [],
  })),
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
  ...[
    { id: "stay-02", hostId: "host-2", setting: "Coast", nightlyRate: 180 },
    { id: "stay-03", hostId: "host-3", setting: "Mountain", nightlyRate: 160 },
    { id: "stay-04", hostId: "host-1", setting: "Forest", nightlyRate: 190 },
  ].map<Stay>((stay) => ({
    ...stay,
    setting: stay.setting as Stay["setting"],
    title: null,
    location: null,
    images: [],
    currency: "USD",
    capacity: null,
    amenities: [],
    cancellationPolicy: null,
  })),
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
