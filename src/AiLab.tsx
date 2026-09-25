"use client";

import { LabChoices } from "./LabChoices.js";

import { FinishLabButton } from "./FinishLabButton.js";

import { LabChecklist } from "./LabChecklist.js";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  aiReducer,
  recommendationEvidence,
  aiCode,
  fixtureRequest,
  initialAiState,
  type AiAction,
  type AiConfig,
  type AiScenario,
  type AiState,
} from "./ai-lab.js";

type Lesson = "example" | "observe" | "repair" | "timeout" | "explore";
const AiContext = createContext<{
  state: AiState;
  dispatch: (action: AiAction) => void;
  active: boolean;
  scenario: AiScenario;
  setScenario: (scenario: AiScenario) => void;
  lesson: Lesson;
  setLesson: (lesson: Lesson) => void;
}>({
  state: initialAiState,
  dispatch: () => {},
  active: false,
  scenario: "success",
  setScenario: () => {},
  lesson: "example",
  setLesson: () => {},
});
export function AiLabProvider({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) {
  const [state, dispatch] = useReducer(aiReducer, initialAiState);
  const [scenario, setScenario] = useState<AiScenario>("success");
  const [lesson, setLesson] = useState<Lesson>("example");
  return (
    <AiContext.Provider
      value={{
        state,
        dispatch,
        active,
        scenario,
        setScenario,
        lesson,
        setLesson,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export const useAiLab = () => useContext(AiContext);

export function useResetAiLab() {
  const { dispatch, setScenario, setLesson } = useContext(AiContext);
  return () => {
    dispatch({ type: "reset" });
    setScenario("success");
    setLesson("example");
  };
}

export function AiIntroduction({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="vac-guide-intro">
      <h3>Can you investigate a bad recommendation?</h3>
      <p>
        A visitor says Twig suggested the wrong stay. What would you need to see
        to investigate?
      </p>
      <div className="vac-guide-example vac-guide-lesson">
        <p>
          Follow a request from Twig into a captured event. Then connect the
          model’s response and see the difference.
        </p>
      </div>
      <p>
        The goal: compare what the visitor asked with what Twig recommended.
      </p>
      <button className="vac-button" onClick={onContinue}>
        <span className="vac-os-button-face">See the worked example →</span>
      </button>
      <details className="vac-lab-step">
        <summary>How this simulation works</summary>
        <p>
          Twig uses a preset request and recommendation. You’re changing what
          gets recorded, not the recommendation itself. No model runs and
          nothing is sent to PostHog.
        </p>
      </details>
    </div>
  );
}

const fields: { key: keyof AiConfig; label: string; detail: string }[] = [
  { key: "input", label: "Request", detail: "$ai_input" },
  { key: "output", label: "Response", detail: "$ai_output_choices" },
  { key: "linked", label: "Trip trace ID", detail: "$ai_trace_id" },
  { key: "errors", label: "Error details", detail: "$ai_is_error + $ai_error" },
];
function CaptureMapping({ config }: { config: AiConfig }) {
  return (
    <div className="vac-ai-mapping">
      <span className="vac-muted">
        Inside the generation event’s properties
      </span>
      <pre>
        <code>
          {"{\n"}
          {config.input && (
            <mark
              className={
                config.output ? "vac-ai-code-context" : "vac-ai-code-highlight"
              }
            >
              {'  $ai_input: [\n    { role: "user", content: request }\n  ],\n'}
            </mark>
          )}
          {config.output && (
            <mark className="vac-ai-code-highlight">
              {
                '  $ai_output_choices: [\n    { role: "assistant", content: response }\n  ],\n'
              }
            </mark>
          )}
          {"  // Other fields omitted\n}"}
        </code>
      </pre>
    </div>
  );
}

export function AiLab({
  stage,
  onStage,
  onFocusPlanner,
}: {
  stage: number;
  onStage: (stage: number) => void;
  onFocusPlanner: () => void;
}) {
  const { state, dispatch, scenario, setScenario, lesson, setLesson } =
    useContext(AiContext);
  const [selected, select] = useState<AiState["runs"][number] | null>(null);
  const run =
    selected && state.runs.includes(selected) ? selected : state.runs.at(-1);
  return (
    <section className="vac-lab vac-builder vac-ai-lab">
      {stage === 1 ? (
        <>
          {lesson === "example" ? (
            <>
              <h3>From Twig to an event</h3>
              <div className="vac-ai-compare">
                <h4>Twig’s request</h4>
                <p>{fixtureRequest}</p>
              </div>
              <p>
                The app holds that text in <code>request</code>. This capture
                code puts it in PostHog’s <code>$ai_input</code> field.
              </p>
              <CaptureMapping config={initialAiState.config} />
              <p>Run it once to see those values in the recorded event.</p>
              <button
                className="vac-button"
                onClick={() => {
                  dispatch({ type: "edit", config: initialAiState.config });
                  dispatch({ type: "apply" });
                  setScenario("success");
                  setLesson("observe");
                  onFocusPlanner();
                }}
              >
                <span className="vac-os-button-face">Apply the code →</span>
              </button>
            </>
          ) : !state.applied ? (
            <>
              <h3>
                {lesson === "repair"
                  ? "Connect the response"
                  : lesson === "timeout"
                  ? "Record a failed model request"
                  : "Explore captured fields"}
              </h3>
              <p>
                {lesson === "repair" ? (
                  <>
                    Twig holds the recommendation in <code>response</code>.
                    Connect it to <code>$ai_output_choices</code> to record it
                    too.
                  </>
                ) : lesson === "timeout" ? (
                  <>
                    The next request will time out. Enable{" "}
                    <strong>Error details</strong> to capture why it failed.
                  </>
                ) : (
                  "Choose the fields that help answer your question. These fields are optional."
                )}
              </p>
              <fieldset className="vac-ai-fields">
                <legend>
                  {lesson === "repair"
                    ? "Add to the capture code"
                    : "Choose your fields"}
                </legend>
                {fields
                  .filter((field) =>
                    lesson === "repair"
                      ? field.key === "output"
                      : lesson === "timeout"
                      ? field.key === "errors"
                      : true
                  )
                  .map((field) => (
                    <label key={field.key}>
                      <input
                        type="checkbox"
                        checked={state.config[field.key]}
                        onChange={(e) =>
                          dispatch({
                            type: "edit",
                            config: { [field.key]: e.target.checked },
                          })
                        }
                      />
                      <span>
                        {lesson === "repair"
                          ? "Record the model’s response"
                          : field.label}
                        <code>{field.detail}</code>
                      </span>
                    </label>
                  ))}
              </fieldset>
              {lesson === "explore" && (
                <LabChoices<AiScenario>
                  label="Response for the next exercise"
                  value={scenario}
                  onChange={setScenario}
                  options={[
                    { value: "success", label: "Recommendation" },
                    { value: "timeout", label: "Provider timeout" },
                  ]}
                />
              )}
              {lesson === "timeout" ? (
                <pre>
                  {state.config.errors
                    ? `$ai_is_error: Boolean(error),\n$ai_error: error?.message`
                    : "// Error fields are not captured yet"}
                </pre>
              ) : (
                <CaptureMapping config={state.config} />
              )}
              {lesson !== "timeout" && (
                <p className="vac-muted">
                  {state.config.output
                    ? "The highlighted response field will be included on the next run."
                    : "The response field is absent from this capture code."}
                </p>
              )}
              <button
                className="vac-button"
                disabled={
                  (lesson === "repair" && !state.config.output) ||
                  (lesson === "timeout" && !state.config.errors)
                }
                onClick={() => {
                  dispatch({ type: "apply" });
                  onFocusPlanner();
                }}
              >
                <span className="vac-os-button-face">Apply the change →</span>
              </button>
            </>
          ) : (
            <>
              <h3>
                {state.awaitingRun
                  ? scenario === "timeout"
                    ? "Try the failed request on Twig"
                    : "Run the request on Twig"
                  : "Your request is ready to review"}
              </h3>
              <p>
                {state.awaitingRun ? (
                  <>
                    Code applied. Click <strong>Run simulation</strong> in
                    Twig’s trip planner.
                  </>
                ) : (
                  "The request has finished. Review what your capture code recorded."
                )}
              </p>
              <LabChecklist
                label="AI exercise progress"
                items={[
                  { label: "Apply the capture code", done: true },
                  {
                    label: (
                      <>
                        Click <strong>Run simulation</strong> on Twig
                      </>
                    ),
                    done: !state.awaitingRun,
                  },
                ]}
              />
              {state.awaitingRun ? (
                <button className="vac-button" onClick={onFocusPlanner}>
                  <span className="vac-os-button-face">
                    Show the trip planner →
                  </span>
                </button>
              ) : (
                <button
                  className="vac-button"
                  onClick={() => {
                    select(null);
                    onStage(2);
                  }}
                >
                  <span className="vac-os-button-face">
                    See what was recorded →
                  </span>
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h3>
            {run?.scenario === "timeout"
              ? "Review the failed request"
              : lesson === "observe"
              ? "Find the missing response"
              : "Compare the request and response"}
          </h3>
          {!run ? (
            <>
              <p>Run the worked example in the exercise first.</p>
              <button className="vac-button" onClick={() => onStage(1)}>
                <span className="vac-os-button-face">
                  Continue the exercise →
                </span>
              </button>
            </>
          ) : (
            <>
              {state.runs.length > 1 && (
                <LabChoices
                  label="Compare runs"
                  value={run.id}
                  onChange={(id) =>
                    select(state.runs.find((item) => item.id === id) ?? null)
                  }
                  options={[...state.runs].reverse().map((item) => ({
                    value: item.id,
                    label: `Run ${item.id} · ${
                      item.scenario === "success" ? "Recommendation" : "Timeout"
                    }`,
                  }))}
                />
              )}
              <div className="vac-ai-compare">
                <h4>Recorded evidence</h4>
                <dl>
                  <dt>
                    Visitor’s request · <code>$ai_input</code>
                  </dt>
                  <dd>
                    {run.config.input ? (
                      <mark className="vac-ai-code-highlight">
                        {run.prompt}
                      </mark>
                    ) : (
                      "Not captured"
                    )}
                  </dd>
                  <dt>
                    {run.response ? (
                      <>
                        Model’s response · <code>$ai_output_choices</code>
                      </>
                    ) : (
                      "Model error"
                    )}
                  </dt>
                  <dd>
                    {run.response ? (
                      run.config.output ? (
                        <mark className="vac-ai-code-highlight">
                          {run.response}
                        </mark>
                      ) : (
                        "Not captured"
                      )
                    ) : run.config.errors ? (
                      "Simulated provider timeout"
                    ) : (
                      "Not captured"
                    )}
                  </dd>
                </dl>
              </div>
              <div className="vac-lab-output" role="status">
                {lesson === "observe" && (
                  <strong>
                    Twig displayed a recommendation, but this code never
                    recorded it.
                  </strong>
                )}
                <p>{recommendationEvidence(run).explanation}</p>
              </div>
              {lesson === "timeout" &&
              run.scenario === "timeout" &&
              recommendationEvidence(run).complete ? (
                <FinishLabButton onClick={() => onStage(3)} />
              ) : (
                <button
                  className="vac-button"
                  onClick={() => {
                    select(null);
                    const next =
                      lesson === "observe"
                        ? "repair"
                        : lesson === "repair" &&
                          recommendationEvidence(run).complete
                        ? "timeout"
                        : lesson === "repair"
                        ? "repair"
                        : "explore";
                    setLesson(next);
                    setScenario(next === "timeout" ? "timeout" : "success");
                    dispatch({
                      type: "edit",
                      config:
                        next === "repair"
                          ? { input: true, output: false }
                          : next === "timeout"
                          ? { input: true, output: true, errors: false }
                          : {},
                    });
                    onStage(1);
                  }}
                >
                  <span className="vac-os-button-face">
                    {lesson === "observe" ||
                    (lesson === "repair" &&
                      !recommendationEvidence(run).complete)
                      ? "Connect the missing response →"
                      : lesson === "repair"
                      ? "Record a failed request →"
                      : "Explore another configuration →"}
                  </span>
                </button>
              )}
              {recommendationEvidence(run).complete && (
                <p className="vac-muted">
                  You can now compare the request and outcome. This helps
                  investigate a problem. It doesn’t fix the model’s answer.
                </p>
              )}
            </>
          )}
        </>
      )}
      <details className="vac-lab-step">
        <summary>Code and session options</summary>
        <pre>
          {aiCode(
            stage === 2 && run ? run.config : state.applied ?? state.config
          )}
        </pre>
        {stage === 2 && run && (
          <>
            <h4>Captured event JSON</h4>
            <pre>{JSON.stringify(run.event, null, 2)}</pre>
          </>
        )}
        <a
          href="https://posthog.com/docs/ai-observability/installation/manual-capture"
          target="_blank"
          rel="noreferrer"
        >
          Manual capture docs ↗
        </a>
        <div className="vac-lab-actions">
          {stage === 1 && state.applied && lesson !== "observe" && (
            <button
              className="vac-text-button"
              onClick={() => dispatch({ type: "edit", config: {} })}
            >
              Edit captured fields
            </button>
          )}
          {state.runs.length > 0 && (
            <button
              className="vac-text-button"
              onClick={() => dispatch({ type: "clear" })}
            >
              Clear runs
            </button>
          )}
        </div>
      </details>
    </section>
  );
}
