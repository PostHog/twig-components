import { parseAuthorRichText, richTextPlain, type AuthorRichText } from "./author-rich-text.js";
export const authorActions = [
  { value: "trip_request_sent", label: "Send a trip request" },
  { value: "filter_any", label: "Choose any setting" },
  { value: "filter_forest", label: "Choose Forest" },
  { value: "filter_coast", label: "Choose Coast" },
  { value: "filter_city", label: "Choose City" },
  { value: "event_selected", label: "Select a captured event" },
] as const;
export type AuthorAction = typeof authorActions[number]["value"];
export type AuthorBlock =
  | { id: string; type: "context"; text: string; richText?: AuthorRichText }
  | { id: string; type: "checklist"; items: { text: string; richText?: AuthorRichText; action: AuthorAction }[] }
  | { id: string; type: "evidence" }
  | { id: string; type: "code"; label: string; code: string }
  | { id: string; type: "detail"; title: string; text: string; richText?: AuthorRichText };
export type AuthorBlockType = AuthorBlock["type"];
export type AuthorStep = { id: string; name: string; blocks: AuthorBlock[] };
export const authorProducts = ["Product Analytics", "AI Observability", "Session Replay", "Error Tracking"] as const;
export type AuthorProduct = typeof authorProducts[number];
export type LabDraft = { startingPath?: string; context?: "stay-filters" | "ai-trip-planner"; product?: AuthorProduct | null; version: 1; template: "guided-activity"; title: string; steps: AuthorStep[] };
export const authorComponents: { type: AuthorBlockType; label: string; description: string; icon: string }[] = [
  { type: "context", label: "Plain text", description: "Set the scene", icon: "T" },
  { type: "checklist", label: "User instructions", description: "An action with a completion rule", icon: "☑" },
  { type: "evidence", label: "Event inspector", description: "Captured events and properties", icon: "▤" },
  { type: "code", label: "Code block", description: "A snippet to inspect and copy", icon: "{}" },
  { type: "detail", label: "Expandable detail", description: "A little more, on demand", icon: "+" },
];
/** Only site routes, never external URLs, editor nesting, queries or user input. */
export function isAuthorStartingPath(path: unknown): path is string {
  return typeof path === "string" && /^(?:\/|\/about|\/login|\/profile(?:\/(?:saved|bookings|settings))?|\/stays\/[a-z0-9-]+)$/.test(path);
}
export function createEmptyLabDraft(): LabDraft {
  return { version: 1, template: "guided-activity", title: "", product: null, context: "ai-trip-planner", steps: [{ id: "title-page", name: "", blocks: [] }] };
}
export function createEmptyAuthorPage(id: string): AuthorStep {
  return { id, name: "", blocks: [] };
}
export function createEmptyAuthorBlock(type: AuthorBlockType, id: string): AuthorBlock {
  switch (type) {
    case "context": return { id, type, text: "" };
    case "checklist": return { id, type, items: [{ text: "", action: "filter_any" }] };
    case "evidence": return { id, type };
    case "code": return { id, type, label: "", code: "" };
    case "detail": return { id, type, title: "", text: "" };
  }
}
export function createAuthorBlock(type: AuthorBlockType, id: string): AuthorBlock {
  switch (type) {
    case "context": return { id, type, text: "What will the learner discover?" };
    case "checklist": return { id, type, items: [{ text: "Choose Forest in the Twig preview.", action: "filter_forest" }] };
    case "evidence": return { id, type };
    case "code": return { id, type, label: "JavaScript", code: 'posthog.capture("filter_clicked", {\n  destination_type: setting\n})' };
    case "detail": return { id, type, title: "Why this matters", text: "Properties give an event context. Use them to compare how people interact with your product." };
  }
}
export function createAuthorStep(id: string): AuthorStep {
  return { id, name: "Guided activity", blocks: [createAuthorBlock("context", `${id}-context`), createAuthorBlock("checklist", `${id}-checklist`), createAuthorBlock("evidence", `${id}-evidence`)] };
}
export function createLabDraft(): LabDraft {
  const first = createAuthorStep("capture");
  first.name = "Capture an event";
  first.blocks[0] = { id: "capture-context", type: "context", text: "Every interaction tells a story. Change a setting on Twig to see the event and properties it creates." };
  first.blocks.push(createAuthorBlock("detail", "capture-detail"));
  return { version: 1, template: "guided-activity", title: "Events and properties", steps: [first] };
}
export function validateLabDraft(draft: LabDraft): string[] {
  const errors: string[] = [];
  if (draft.product === null) errors.push("Choose a product.");
  if (!draft.title.trim()) errors.push("Give your lab a title.");
  draft.steps.forEach((step, index) => {
    const name = `Page ${index + 1}`;
    if (index > 0 && !step.name.trim()) errors.push(`${name} needs a name.`);
    if (index > 0 && !step.blocks.length) errors.push(`${name} needs a component.`);
    step.blocks.forEach(block => {
      if (draft.startingPath === undefined && block.type === "checklist" && block.items.some(item => (item.action === "trip_request_sent") !== (draft.context === "ai-trip-planner") && item.action !== "event_selected")) errors.push(`${name}: choose completion rules for the selected Twig context.`);
      if (block.type === "context" && !block.text.trim()) errors.push(`${name}: add your plain text.`);
      if (block.type === "code" && (!block.code.trim() || !block.label.trim())) errors.push(`${name}: add code and its language or filename.`);
      if (block.type === "detail" && (!block.text.trim() || !block.title.trim())) errors.push(`${name}: fill in the expandable detail.`);
      if (block.type === "checklist" && (!block.items.length || block.items.some(item => !item.text.trim()))) errors.push(`${name}: write every checklist action.`);
      if (block.type === "checklist" && block.items.some(item => item.action === "event_selected") && !step.blocks.some(item => item.type === "evidence")) errors.push(`${name}: add Event inspector so the learner can select an event.`);
    });
  });
  return errors;
}
/** Accept only the bounded, versioned component vocabulary. Never execute imported code. */
export function parseLabDraft(value: unknown): LabDraft {
  const fail = (): never => { throw new Error("Choose a valid guided activity JSON export (version 1)."); };
  const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : fail();
  const string = (v: unknown): string => typeof v === "string" && v.length <= 20000 ? v : fail();
  const ids = new Set<string>();
  const id = (v: unknown): string => { const result = string(v); if (!result || ids.has(result)) fail(); ids.add(result); return result; };
  const data = object(value);
  if (data.version !== 1 || data.template !== "guided-activity" || !Array.isArray(data.steps) || !data.steps.length || data.steps.length > 30) fail();
  if (data.product !== undefined && data.product !== null && !authorProducts.includes(data.product as AuthorProduct)) fail();
  if (data.context !== undefined && data.context !== "stay-filters" && data.context !== "ai-trip-planner") fail();
  if (data.startingPath !== undefined && !isAuthorStartingPath(data.startingPath)) fail();
  const rich = (block: Record<string, unknown>) => block.richText === undefined ? { text: string(block.text) } : (() => { const richText = parseAuthorRichText(block.richText); return { text: richTextPlain(richText), richText }; })();
  const steps = (data.steps as unknown[]).map(value => {
    const step = object(value);
    if (!Array.isArray(step.blocks) || step.blocks.length > 30) fail();
    return { id: id(step.id), name: string(step.name), blocks: (step.blocks as unknown[]).map(value => {
      const block = object(value), blockId = id(block.id);
      switch (block.type) {
        case "context": return { id: blockId, type: "context" as const, ...rich(block) };
        case "evidence": return { id: blockId, type: "evidence" as const };
        case "code": return { id: blockId, type: "code" as const, label: string(block.label), code: string(block.code) };
        case "detail": return { id: blockId, type: "detail" as const, title: string(block.title), ...rich(block) };
        case "checklist": {
          if (!Array.isArray(block.items) || !block.items.length || block.items.length > 12) fail();
          return { id: blockId, type: "checklist" as const, items: (block.items as unknown[]).map(value => {
            const item = object(value);
            if (!authorActions.some(action => action.value === item.action)) fail();
            return { ...rich(item), action: item.action as AuthorAction };
          }) };
        }
        default: return fail();
      }
    }) };
  });
  return { version: 1, template: "guided-activity", title: string(data.title), steps, ...(data.startingPath !== undefined ? { startingPath: data.startingPath as string } : {}), ...(data.context !== undefined ? { context: data.context as "stay-filters" | "ai-trip-planner" } : {}), ...(data.product !== undefined ? { product: data.product as AuthorProduct | null } : {}) };
}
export function authorStepComplete(step: AuthorStep, completed: readonly string[]): boolean {
  return step.blocks.every(block => block.type !== "checklist" || block.items.every((_, index) => completed.includes(`${block.id}:${index}`)));
}
export function advanceAuthorProgress(step: AuthorStep, completed: readonly string[], action: AuthorAction): string[] {
  const instructions = step.blocks.flatMap(block => block.type === "checklist" ? block.items.map((item, index) => ({ ...item, key: `${block.id}:${index}` })) : []);
  const next = instructions.find(item => !completed.includes(item.key));
  if (!next || (next.action !== action && !(action.startsWith("filter_") && next.action === "filter_any"))) return [...completed];
  return [...completed, next.key];
}
export const authorTemplateUrl = "https://www.figma.com/design/yIdCpZmhuIUrfaKxqta8q8/Learn-platform?node-id=412-1392";
export function authorHandoff(draft: LabDraft): string {
  return `# ${draft.title}\n\nImplement this guided activity in Twig using the approved @posthog/twig-components. Follow both repositories' AGENTS.md and design guides.\n\nStarting page: ${draft.startingPath ?? "/"}\n\nTwig context: ${draft.context ?? "stay-filters"}\n\nProduct placement: ${draft.product ?? "Product Analytics"}\n\nTemplate reference: ${authorTemplateUrl}\nThis link is the original template, not a published version of this draft.\n\nThe JSON below is the source of truth for content, component order, and completion rules. Bind trip_request_sent to the shared TripPlanner accepted-send callback. Bind filter rules to real Twig setting controls and event_selected to a locally captured event selection. Keep simulated evidence local. Code blocks are read-only teaching snippets, never executable. Preserve the Playground shell, accessible navigation, reset behavior, and desktop/390px/320px layouts.\n\nAdd production-safe feature tracking without authored content. Verify gates and analytics, then run the required repository checks and open a PR.\n\n\`\`\`json\n${JSON.stringify(draft, null, 2)}\n\`\`\`\n`;
}
