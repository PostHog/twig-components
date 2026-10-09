/** The four properties introduced by the opening lesson. */
export const generationCaptureExample = `posthog.capture("$ai_generation", {
  $ai_input: messages,
  $ai_output_choices: output,
  $ai_trace_id: traceId,
  $ai_session_id: sessionId,
});`;
