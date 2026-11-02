/** Fixed teaching fixtures. No visitor text, model calls, or network access. */
export type SupportCase = "saved" | "synthetic" | "production";
export type EvalType = "judge" | "code" | "sentiment";
export type EvalFlow = "offline" | "online";
export const supportEvaluatorIds: Record<EvalType, string> = {
  judge: "b904aa31-8285-4439-97bb-85078ada2211",
  code: "b904aa31-8285-4439-97bb-85078ada2212",
  sentiment: "b904aa31-8285-4439-97bb-85078ada2213",
};
export const evalTypes: EvalType[] = ["judge", "code", "sentiment"];
export const evalNames: Record<EvalType, string> = {
  judge: "LLM judge",
  code: "Code",
  sentiment: "Sentiment",
};
// Demo policy, deliberately separate from the stays' unpublished cancellation policies.
export const supportPolicy =
  "Cancellations need 7 days’ notice for a full refund. Unrepairable essential heating qualifies for relocation or a refund anytime.";
export const supportCases: Record<
  SupportCase,
  { input: string; expected: string; sentiment: "Neutral" | "Negative" }
> = {
  saved: {
    input:
      "My plans changed. Can I cancel 2 days before arrival for a full refund?",
    expected:
      "Explain that an ordinary cancellation needs at least 7 days’ notice for a full refund.",
    sentiment: "Neutral",
  },
  synthetic: {
    input:
      "I changed my mind. Can I get a full refund if I cancel 1 day before arrival?",
    expected:
      "Explain that an ordinary cancellation needs at least 7 days’ notice for a full refund.",
    sentiment: "Neutral",
  },
  production: {
    input:
      "The heating is broken and cannot be repaired. I’m freezing and frustrated. Can you refund my stay?",
    expected:
      "Apply the essential-heating exception and offer relocation or a refund.",
    sentiment: "Negative",
  },
};
export type SupportRun = {
  id: string;
  traceId: string;
  sessionId: string;
  timestamp: string;
  caseId: SupportCase;
  fixed: boolean;
  source: "lab" | "free";
  input: string;
  output: string;
};
export type EvalResult = {
  id: string;
  generationId: string;
  timestamp: string;
  flow: EvalFlow;
  type: EvalType;
  value: boolean | "Neutral" | "Negative";
  reasoning: string;
};
export function createSupportRun(
  caseId: SupportCase,
  fixed: boolean,
  identity: {
    id: string;
    traceId: string;
    sessionId: string;
    timestamp: string;
  }
): SupportRun {
  return {
    ...identity,
    caseId,
    fixed,
    source: "lab",
    input: supportCases[caseId].input,
    output:
      fixed && caseId === "production"
        ? "The usual 7 days’ notice rule does not apply when essential heating is broken and cannot be repaired. We can offer relocation or a refund."
        : "A full refund requires at least 7 days’ notice before arrival. This request is inside that window, so I can’t offer a full refund.",
  };
}
/** Free chat keeps visitor text in the UI. Captures contain only redacted input and fixed replies. */
export function createFreeSupportRun(
  message: string,
  identity: Parameters<typeof createSupportRun>[2]
): SupportRun {
  const caseId = /heat|freezing|cold/i.test(message) ? "production" : "saved";
  const run = createSupportRun(caseId, false, identity);
  const notice = /(?:^|\s)(\d+)\s*days?/i.exec(message);
  const cancellation = /cancel|refund/i.test(message) || !!notice;
  const output = /heat|freezing|cold/i.test(message)
    ? run.output
    : cancellation
    ? notice
      ? Number(notice[1]) >= 7
        ? "Yes. An ordinary cancellation made at least 7 days before arrival qualifies for a full refund."
        : run.output
      : "Ordinary cancellations need at least 7 days’ notice for a full refund. How many days until your arrival?"
    : /policy|rules/i.test(message)
    ? supportPolicy
    : /^(hi|hello|hey|good morning|good evening)[!. ]*$/i.test(message.trim())
    ? "Hi! What can I help you with about your stay?"
    : "I can help with cancellations, refunds, or a problem with your stay. What’s happened?";
  return { ...run, source: "free", input: "[Visitor message omitted]", output };
}
/** These deterministic checks simulate outcomes, not an actual LLM or sentiment model. */
export function evaluateSupportRun(
  run: SupportRun,
  type: EvalType,
  flow: EvalFlow,
  identity: { id: string; timestamp: string }
): EvalResult {
  const correct = run.caseId !== "production" || run.fixed;
  const value =
    type === "judge"
      ? correct
      : type === "code"
      ? run.output.includes("7 days")
      : supportCases[run.caseId].sentiment;
  const reasoning =
    type === "judge"
      ? correct
        ? "The answer applies the relevant policy to this request."
        : "The answer applies the cancellation window but ignores the essential-heating exception."
      : type === "code"
      ? "The answer contains ‘7 days’. This wording check does not establish that the right policy was applied."
      : "This classifies the customer’s input, not the correctness of the support answer.";
  return { ...identity, generationId: run.id, flow, type, value, reasoning };
}
export function supportEvidence(run: SupportRun) {
  const common = {
    $ai_trace_id: run.traceId,
    $ai_session_id: run.sessionId,
    demo_data: true,
    feature: "support-agent",
    fixture_version: "support-evals-v1",
    conversation_source: run.source,
  };
  return [
    {
      event: "$ai_trace",
      timestamp: run.timestamp,
      properties: {
        ...common,
        $ai_span_id: `${run.traceId}-root`,
        $ai_trace_name: "Support request",
      },
    },
    {
      event: "$ai_span",
      timestamp: run.timestamp,
      properties: {
        ...common,
        $ai_span_id: `${run.traceId}-policy`,
        $ai_parent_id: `${run.traceId}-root`,
        $ai_span_name: "lookup_policy",
        $ai_input_state: { policy: "demo-cancellation" },
        $ai_output_state: supportPolicy,
      },
    },
    {
      event: "$ai_generation",
      timestamp: run.timestamp,
      properties: {
        ...common,
        $ai_span_id: run.id,
        $ai_parent_id: `${run.traceId}-root`,
        $ai_span_name: "Support answer",
        $ai_input: [{ role: "user", content: run.input }],
        $ai_output_choices: [{ role: "assistant", content: run.output }],
        $ai_model: "scripted-support-fixture",
        $ai_provider: "local-simulation",
        $ai_is_error: false,
        $ai_latency: 0,
        $ai_total_cost_usd: 0,
      },
    },
  ];
}
export function evaluationEvidence(result: EvalResult, run: SupportRun) {
  return {
    event: "$ai_evaluation",
    timestamp: result.timestamp,
    properties: {
      $ai_evaluation_id: supportEvaluatorIds[result.type],
      evaluation_run_id: result.id,
      $ai_target_event_id: run.id,
      $ai_trace_id: run.traceId,
      $ai_evaluation_result:
        typeof result.value === "boolean" ? result.value : null,
      ...(typeof result.value === "string"
        ? { $ai_sentiment_label: result.value.toLowerCase() }
        : {}),
      $ai_evaluation_reasoning: result.reasoning,
      evaluation_type:
        result.type === "judge"
          ? "llm_judge"
          : result.type === "code"
          ? "hog"
          : "sentiment",
      evaluation_source: result.flow,
      demo_data: true,
    },
  };
}
