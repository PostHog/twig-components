import { nightlyPrice, stayLabel, type Stay } from "./catalog.js";

/** A bounded, local conversation. No model, network, storage, or analytics. */
export const tripPlannerPrompts = {
  forest: "Find me a forest getaway for four.",
  beach: "Actually, I’d prefer somewhere with beach access.",
  kitchen: "Does it have a full kitchen?",
} as const;

export type TripPlannerStage = "start" | "forest" | "beach" | "kitchen" | "complete";
export type TripPlannerTurn = {
  prompt: string;
  reply: string;
  kind: "recommendation" | "answer" | "fallback";
  stayId?: string;
};
export type TripPlannerState = {
  stage: TripPlannerStage;
  guests: number | null;
  selectedStayId: string | null;
  turns: readonly TripPlannerTurn[];
};

export const tripPlannerTurnLimit = 12;
export const tripPlannerInputLimit = 240;

export function initialTripPlannerState(): TripPlannerState {
  return { stage: "start", guests: null, selectedStayId: null, turns: [] };
}

export function tripPlannerSuggestions(state: TripPlannerState): readonly string[] {
  if (state.turns.length >= tripPlannerTurnLimit) return [];
  switch (state.stage) {
    case "start": return [tripPlannerPrompts.forest];
    case "forest": return [tripPlannerPrompts.beach];
    case "beach": return [tripPlannerPrompts.kitchen];
    case "kitchen": return ["Find me a city stay for four."];
    case "complete": return [];
  }
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[’']/g, "").replace(/[.,?!]/g, "").replace(/\s+/g, " ").trim();
}

// Deliberately match whole phrases. A keyword such as "beach" must not match
// "I don't want a beach" or silently discard an unsupported constraint.
const aliases = {
  forest: [tripPlannerPrompts.forest, "forest getaway for four", "forest getaway for 4", "find me a forest getaway for 4"],
  beach: [tripPlannerPrompts.beach, "somewhere with beach access", "id prefer beach access", "show me a beach stay"],
  kitchen: [tripPlannerPrompts.kitchen, "does it have a kitchen", "is there a full kitchen"],
};

export function tripPlannerIntentFor(input: string): keyof typeof aliases | undefined {
  const normalized = normalize(input);
  return (Object.keys(aliases) as (keyof typeof aliases)[])
    .find((intent) => aliases[intent].some((phrase) => normalize(phrase) === normalized));
}

export function replyToTripPlanner(
  state: TripPlannerState,
  input: string,
  stays: readonly Stay[],
): TripPlannerState {
  const prompt = input.trim();
  if (!prompt || prompt.length > tripPlannerInputLimit || state.turns.length >= tripPlannerTurnLimit) return state;

  const intent = tripPlannerIntentFor(prompt);
  let next = state;
  let turn: TripPlannerTurn = {
    prompt,
    reply: state.stage === "complete"
      ? "That’s the end of this example conversation. Open the recommended stay or start over to try it again."
      : "This demo follows a short trip-planning conversation. Try the example question in the message box.",
    kind: "fallback",
  };

  if (intent === "forest") {
    const stay = stays.find((stay) => stay.id === "stay-01");
    if (stay && stay.setting === "Forest" && (stay.capacity ?? 0) >= 4) {
      // Facts come from the supplied catalog, not a second copy of stay data.
      const features = [
        stay.amenities.includes("Fireplace / fire pit") ? "a fire pit" : null,
        stay.amenities.includes("Lake access via a walking path") ? "a walking path to the lake" : null,
      ].filter(Boolean);
      const beds = stay.bedrooms === 2 && stay.sleepingArrangements?.every((bed) => bed.startsWith("King bed")) && stay.sleepingArrangements.length === 2
        ? "two king bedrooms" : null;
      const facts = [beds, ...features].filter(Boolean);
      turn = {
        prompt,
        reply: `${stayLabel(stay)}${stay.location ? ` in ${stay.location}` : ""} sleeps ${stay.capacity}.${facts.length ? ` It has ${facts.join(", ").replace(/, ([^,]*)$/, ", and $1")}.` : ""}`,
        kind: "recommendation",
        stayId: stay.id,
      };
      next = { ...state, stage: "forest", guests: 4, selectedStayId: stay.id };
    } else {
      turn.reply = "The forest stay in this example isn’t available for four in the current catalog. You can still browse the stays below.";
    }
  } else if (intent === "beach" && state.stage === "forest" && state.guests !== null) {
    const stay = stays.find((stay) => stay.id === "stay-02");
    if (stay && stay.amenities.includes("Beach access") && (stay.capacity ?? 0) >= state.guests) {
      turn = {
        prompt,
        reply: `If you’re open to ${stay.location ?? "a different destination"}, ${stayLabel(stay)} has beach access${stay.amenities.includes("Balcony") ? " and a balcony" : ""}, with room for ${stay.capacity}. It fits your group of ${state.guests}. It’s ${nightlyPrice(stay)} ${stay.currency} per night.`,
        kind: "recommendation",
        stayId: stay.id,
      };
      next = { ...state, stage: "beach", selectedStayId: stay.id };
    } else {
      turn.reply = `The beach stay in this example doesn’t currently match your group of ${state.guests}. You can still browse the stays below.`;
    }
  } else if (intent === "kitchen" && (state.stage === "beach" || state.stage === "kitchen" || state.stage === "complete")) {
    const stay = stays.find((stay) => stay.id === state.selectedStayId);
    turn = {
      prompt,
      reply: stay?.amenities.includes("Full kitchen")
        ? `Yes, ${stayLabel(stay)} has a full kitchen.`
        : "A full kitchen isn’t listed for this stay. Check its details before planning around one.",
      kind: "answer",
    };
    next = { ...state, stage: "kitchen" };
  }

  return { ...next, turns: [...state.turns, turn] };
}
