/** A local teaching model. These records never leave the browser. */
export type AiConfig = {
  input: boolean;
  output: boolean;
  linked: boolean;
  errors: boolean;
};
export type AiScenario = "success" | "timeout";
export type AiRun = {
  id: number;
  prompt: string;
  response: string | null;
  scenario: AiScenario;
  config: AiConfig;
  traceId: string;
  event: { event: "$ai_generation"; properties: Record<string, unknown> };
};
export type AiState = {
  config: AiConfig;
  applied: AiConfig | null;
  runs: AiRun[];
  awaitingRun: boolean;
};
export const initialAiState: AiState = {
  config: { input: true, output: false, linked: false, errors: false },
  applied: null,
  runs: [],
  awaitingRun: true,
};
export type AiAction =
  | { type: "edit"; config: Partial<AiConfig> }
  | { type: "apply" }
  | { type: "run"; prompt: string; scenario: AiScenario }
  | { type: "clear" }
  | { type: "reset" };
export const fixtureRequest =
  "A forest weekend for four, with a fire pit and lake access.";
export const fixtureResponse =
  "Try Adiron-shack: an A-frame in the Adirondacks with two king suites, a path to the lake, and a fire pit. Sleeps four, $355 per night.";
export function aiReducer(state: AiState, action: AiAction): AiState {
  switch (action.type) {
    case "edit":
      return {
        ...state,
        config: { ...state.config, ...action.config },
        applied: null,
      };
    case "apply":
      return { ...state, applied: { ...state.config }, awaitingRun: true };
    case "clear":
      return { ...state, runs: [], awaitingRun: true };
    case "reset":
      return initialAiState;
    case "run": {
      const prompt = action.prompt.trim().slice(0, 1000);
      if (!state.applied || !prompt || state.runs.length >= 10) return state;
      const id = state.runs.length + 1;
      const traceId = `local-trip-${id}`;
      const config = { ...state.applied };
      const response = action.scenario === "success" ? fixtureResponse : null;
      const properties: Record<string, unknown> = {
        $ai_span_id: `local-generation-${id}`,
        $ai_span_name: "Recommend a stay",
        $ai_model: "twig-fixture",
        $ai_provider: "local-simulation",
        $ai_latency: action.scenario === "success" ? 1.2 : 5,
      };
      if (config.linked) properties.$ai_trace_id = traceId;
      if (config.input)
        properties.$ai_input = [{ role: "user", content: prompt }];
      if (config.output && response)
        properties.$ai_output_choices = [
          { role: "assistant", content: response },
        ];
      if (config.errors) {
        properties.$ai_is_error = action.scenario === "timeout";
        if (action.scenario === "timeout")
          properties.$ai_error = "Simulated provider timeout";
      }
      return {
        ...state,
        awaitingRun: false,
        runs: [
          ...state.runs,
          {
            id,
            prompt,
            response,
            scenario: action.scenario,
            config,
            traceId,
            event: { event: "$ai_generation", properties },
          },
        ],
      };
    }
  }
}
export function aiChecks(run: AiRun) {
  const p = run.event.properties;
  return [
    {
      label: "Request captured",
      passed: Array.isArray(p.$ai_input),
      help: "Without input, you cannot inspect what the visitor asked.",
    },
    {
      label: "Linked to this trip",
      passed: p.$ai_trace_id === run.traceId,
      help: "Use the trip’s trace ID to group its model calls.",
    },
    run.scenario === "timeout"
      ? {
          label: "Failure recorded",
          passed: p.$ai_is_error === true && !!p.$ai_error,
          help: "Capture the error when the model call fails, too.",
        }
      : {
          label: "Response captured",
          passed: Array.isArray(p.$ai_output_choices),
          help: "Without output, you cannot inspect the recommendation.",
        },
  ];
}
export function aiCode(config: AiConfig) {
  return `// Capture after the model call settles, using values from your application.\nposthog.capture({\n  distinctId: visitorId,\n  event: '$ai_generation',\n  properties: {\n    $ai_model: model,\n    $ai_provider: provider,\n    $ai_span_id: generationId,\n    $ai_latency: durationSeconds,${
    config.linked ? "\n    $ai_trace_id: tripTraceId," : ""
  }${
    config.input ? "\n    $ai_input: [{ role: 'user', content: request }]," : ""
  }${
    config.output
      ? "\n    ...(!error && { $ai_output_choices: [\n      { role: 'assistant', content: response }\n    ] }),"
      : ""
  }${
    config.errors
      ? "\n    $ai_is_error: Boolean(error),\n    ...(error && { $ai_error: error.message }),"
      : ""
  }\n  },\n})`;
}

/** Feedback follows captured evidence, not whether every optional field was selected. */
export function recommendationEvidence(run: AiRun): {
  complete: boolean;
  explanation: string;
} {
  const input = Array.isArray(run.event.properties.$ai_input);
  const outcome =
    run.scenario === "success"
      ? Array.isArray(run.event.properties.$ai_output_choices)
      : run.event.properties.$ai_is_error === true &&
        !!run.event.properties.$ai_error;
  const label = run.scenario === "success" ? "response" : "error";
  if (input && outcome)
    return {
      complete: true,
      explanation: `You recorded both the request and ${label}. You can compare what the visitor asked with what happened.`,
    };
  if (input)
    return {
      complete: false,
      explanation: `You can see what the visitor asked, but not the ${label}, because ${label} capture was off. Showing a result on Twig does not automatically record it.`,
    };
  if (outcome)
    return {
      complete: false,
      explanation: `You recorded the ${label}, but left out the request. Without it, you cannot compare the outcome with what the visitor wanted.`,
    };
  return {
    complete: false,
    explanation: `Neither the request nor the ${label} was captured. Timing alone cannot tell you whether the recommendation matched the visitor’s needs.`,
  };
}
