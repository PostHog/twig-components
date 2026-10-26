/**
 * Teaching example, not Twig's runtime instrumentation.
 * Verified against https://posthog.com/docs/ai-observability/installation/manual-capture
 * Variables represent values available after a model call; latency is in seconds.
 */
export const aiGenerationCaptureExample = `posthog.capture({
  distinctId: userId,
  event: "$ai_generation",
  properties: {
    $ai_trace_id: traceId,
    $ai_model: model,
    $ai_provider: provider,
    $ai_input: inputMessages,
    $ai_output_choices: outputMessages,
    $ai_input_tokens: inputTokens,
    $ai_output_tokens: outputTokens,
    $ai_latency: latencySeconds
  }
})`;
