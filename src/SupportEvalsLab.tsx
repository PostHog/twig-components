"use client";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { tripPlannerTurnLimit, tripPlannerInputLimit } from "./trip-planner.js";
import type { SupportMessage } from "./SupportAgent.js";
import { LabChecklist } from "./LabChecklist.js";
import { LabCompletionView } from "./LabCompletionView.js";
import { LabPrimaryAction } from "./LabNavigation.js";
import { PlaygroundGeneration } from "./PlaygroundAiEvidence.js";
import { PlaygroundStatus } from "./PlaygroundStatus.js";
import { McpComposer } from "./McpComposer.js";
import { DisclosureIcon, PlaygroundSummary } from "./PlaygroundDisclosure.js";
import { PlaygroundCodeBlock } from "./PlaygroundCodeBlock.js";
import { touchpointDefinitions } from "./playground.js";
import {
  createFreeSupportRun,
  createSupportRun,
  evaluateSupportRun,
  evalTypes,
  evalNames,
  supportCases,
  supportEvidence,
  supportPolicy,
  type EvalFlow,
  type EvalResult,
  type EvalType,
  type SupportCase,
  type SupportRun,
} from "./support-evals.js";

type RunKey = SupportCase | "regression" | "fixed";
export type SupportLabAction =
  | "case_selected"
  | "conversation_sent"
  | "evaluation_run"
  | "results_viewed"
  | "regression_fixed"
  | "conversation_reset";
type Callbacks = {
  onGeneration?: (run: SupportRun) => void;
  onEvaluation?: (result: EvalResult, run: SupportRun) => void;
  onAction?: (action: SupportLabAction, outcome: string) => void;
};
function useSupportState(callbacks: Callbacks) {
  const [freeConversation, setFreeConversation] = useState<SupportMessage[]>(
    []
  );
  const [freePending, setFreePending] = useState(false);
  const freeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (freeTimer.current !== null) clearTimeout(freeTimer.current);
    },
    []
  );
  const [caseId, setCase] = useState<SupportCase>("synthetic");
  const [runs, setRuns] = useState<Partial<Record<RunKey, SupportRun>>>({});
  const [results, setResults] = useState<EvalResult[]>([]);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const session = useRef("");
  const running = useRef(false);
  function generate(key: RunKey) {
    if (!session.current) session.current = crypto.randomUUID();
    const run = createSupportRun(
      key === "fixed" || key === "regression" ? "production" : key,
      key === "fixed",
      {
        id: crypto.randomUUID(),
        traceId: crypto.randomUUID(),
        sessionId: session.current,
        timestamp: new Date().toISOString(),
      }
    );
    setRuns((previous) => ({ ...previous, [key]: run }));
    callbacks.onGeneration?.(run);
    callbacks.onAction?.("conversation_sent", key);
    return run;
  }
  function evaluate(run: SupportRun, type: EvalType, flow: EvalFlow) {
    const result = evaluateSupportRun(run, type, flow, {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
    setResults((previous) => [
      ...previous.filter(
        (item) =>
          !(
            item.generationId === run.id &&
            item.type === type &&
            item.flow === flow
          )
      ),
      result,
    ]);
    callbacks.onEvaluation?.(result, run);
    callbacks.onAction?.("evaluation_run", `${flow}:${type}`);
    return result;
  }
  return {
    caseId,
    runs,
    results,
    onlineEnabled,
    freeConversation,
    freePending,
    sendFree: (message: string) => {
      if (
        freeTimer.current !== null ||
        freeConversation.length >= tripPlannerTurnLimit ||
        !message.trim()
      )
        return;
      const input = message.trim().slice(0, tripPlannerInputLimit);
      setFreeConversation((previous) => [...previous, { input, output: "" }]);
      setFreePending(true);
      freeTimer.current = setTimeout(
        () => {
          if (!session.current) session.current = crypto.randomUUID();
          const run = createFreeSupportRun(input, {
            id: crypto.randomUUID(),
            traceId: crypto.randomUUID(),
            sessionId: session.current,
            timestamp: new Date().toISOString(),
          });
          setFreeConversation((previous) =>
            previous.map((turn, index) =>
              index === previous.length - 1
                ? { ...turn, output: run.output }
                : turn
            )
          );
          setFreePending(false);
          freeTimer.current = null;
          callbacks.onGeneration?.(run);
        },
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500
      );
    },
    resetFree: () => {
      if (freeTimer.current !== null) clearTimeout(freeTimer.current);
      freeTimer.current = null;
      setFreePending(false);
      setFreeConversation([]);
    },
    chooseCase: (next: SupportCase) => {
      setCase(next);
      callbacks.onAction?.("case_selected", next);
    },
    configureOnline: () => setOnlineEnabled(true),
    send: (key: RunKey) => {
      if (running.current || runs[key]) return;
      running.current = true;
      try {
        const run = generate(key);
        if (key === "production" && onlineEnabled)
          for (const type of evalTypes) evaluate(run, type, "online");
      } finally {
        running.current = false;
      }
    },
    check: (key: RunKey, type: EvalType) => {
      const run = runs[key];
      if (
        run &&
        !results.some(
          (item) =>
            item.generationId === run.id &&
            item.type === type &&
            item.flow === "offline"
        )
      )
        evaluate(run, type, "offline");
    },
    fix: () => {
      if (running.current || runs.fixed) return;
      running.current = true;
      try {
        const baseline = generate("regression");
        for (const type of evalTypes) evaluate(baseline, type, "offline");
        const run = generate("fixed");
        for (const type of evalTypes) evaluate(run, type, "offline");
        callbacks.onAction?.("regression_fixed", "pass");
      } finally {
        running.current = false;
      }
    },
    resetConversation: (key: RunKey) => {
      setRuns((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
      setResults((previous) =>
        previous.filter((item) => item.generationId !== runs[key]?.id)
      );
      callbacks.onAction?.("conversation_reset", key);
    },
    view: (flow: EvalFlow) => callbacks.onAction?.("results_viewed", flow),
  };
}
type LabState = ReturnType<typeof useSupportState>;
const SupportContext = createContext<LabState | null>(null);
export function SupportEvalsProvider({
  children,
  ...callbacks
}: Callbacks & { children: ReactNode }) {
  const state = useSupportState(callbacks);
  return (
    <SupportContext.Provider value={state}>{children}</SupportContext.Provider>
  );
}
export function useSupportEvals() {
  const state = useContext(SupportContext);
  if (!state) throw new Error("SupportEvalsProvider is required");
  return state;
}

const captions: Record<EvalType, ReactNode> = {
  judge: (
    <>
      <strong>LLM judge</strong> uses AI to check whether the answer follows the
      policy.
    </>
  ),
  code: (
    <>
      <strong>Code eval</strong> checks an exact rule, like whether the answer
      contains “7 days”.
    </>
  ),
  sentiment: (
    <>
      <strong>Sentiment analysis</strong> labels the customer’s tone as
      positive, neutral, or negative.
    </>
  ),
};
function Action({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <LabPrimaryAction>
      <button className="vac-button" disabled={disabled} onClick={onClick}>
        <span className="vac-os-button-face">{children}</span>
      </button>
    </LabPrimaryAction>
  );
}
function OfflineTerminal({
  run,
  result,
  type,
  onSend,
  fixed = false,
  embedded = false,
}: {
  run?: SupportRun;
  result?: EvalResult;
  type: EvalType;
  onSend: () => void;
  fixed?: boolean;
  embedded?: boolean;
}) {
  const terminal = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (result && sent.current) {
      terminal.current?.focus({ preventScroll: true });
      sent.current = false;
    }
  }, [result]);
  const instruction = fixed
    ? "Save the heating complaint as a regression case. Apply the heating exception first, then rerun the evals."
    : type === "judge"
    ? "Run the saved support case and check the answer against the cancellation policy."
    : type === "code"
    ? "Run the saved support case and check whether the answer contains ‘7 days’."
    : "Run the saved support case and classify the customer’s sentiment.";
  return (
    <div
      ref={terminal}
      tabIndex={-1}
      role={embedded ? undefined : "region"}
      className={embedded ? "vac-agent-turn" : "vac-agent-terminal"}
      aria-label={embedded ? undefined : "Coding agent session"}
    >
      {!embedded && (
        <div className="vac-agent-title">❯_ Twig / coding agent</div>
      )}
      {result && run ? (
        <>
          <p className="vac-agent-prompt">❯ {instruction}</p>
          <p>
            ●{" "}
            {fixed
              ? "I’ll save the failed conversation, update the support prompt, and run the regression tests."
              : "I’ll run the support agent on the saved input, then evaluate its answer."}
          </p>
          <details className="vac-agent-tool">
            <PlaygroundSummary terminal>
              Terminal · Run offline eval{fixed ? "s" : ""} ✓
            </PlaygroundSummary>
            <pre className="vac-support-terminal-output">{`$ node scripts/support-evals.mjs --case ${
              run.caseId
            } --evaluator ${fixed ? "all" : type}${
              fixed ? " --compare-fix" : ""
            }\n\n${
              fixed
                ? "Saved regression case: heating complaint\nBaseline policy judge: false\nUpdated prompt: apply the heating exception first\n"
                : ""
            }Loaded saved input and demo policy\nRan support agent\n${
              type === "code" && !fixed ? 'Executed: "7 days" in output\n' : ""
            }${
              fixed
                ? "LLM judge: true\nCode: true\nSentiment: Negative"
                : `${evalNames[type]}: ${String(result.value)}`
            }\nReported scores to PostHog through the SDK\nProcess exited with code ${
              result.value === false ? 1 : 0
            }`}</pre>
          </details>
          <p>
            ●{" "}
            {fixed
              ? "The saved heating case now passes the policy judge. The answer offers relocation or a refund. I’ve reported the new scores to PostHog. This checks the saved case, not all future conversations."
              : `${result.reasoning} I’ve reported this score to PostHog.`}
          </p>
        </>
      ) : (
        <McpComposer
          horizontal
          suggested={instruction}
          disabled={!run && !fixed}
          onSend={() => {
            sent.current = true;
            onSend();
          }}
        />
      )}
    </div>
  );
}
/** Simplified view of PostHog evaluation runs: inspect a result, its target and reasoning. */
/** Backend evidence belongs in the lesson, separate from the customer conversation. */
function PolicyLookup({ run }: { run: SupportRun }) {
  const lookup = supportEvidence(run).find(
    (capture) => capture.event === "$ai_span"
  );
  if (!lookup || !("$ai_input_state" in lookup.properties)) return null;
  return (
    <>
      <p>
        Twig’s backend used <code>lookup_policy</code> to fetch the policy for
        this reply:
      </p>
      <dl className="vac-support-tool-interaction">
        <div>
          <dt>Tool call</dt>
          <dd>
            <pre>
              <code>{`${lookup.properties.$ai_span_name}(${JSON.stringify(
                lookup.properties.$ai_input_state
              )})`}</code>
            </pre>
          </dd>
        </div>
        <div>
          <dt>Tool result</dt>
          <dd>
            <pre>
              <code>{lookup.properties.$ai_output_state}</code>
            </pre>
          </dd>
        </div>
      </dl>
    </>
  );
}
function resultLabel(value?: EvalResult["value"]) {
  return typeof value === "boolean"
    ? value
      ? "True"
      : "False"
    : value ?? "Missing";
}
function renderScore(value?: EvalResult["value"]) {
  return typeof value === "boolean" ? (
    <PlaygroundStatus value={value ? "passed" : "failed"} />
  ) : (
    resultLabel(value)
  );
}
function Results({
  run,
  results,
  resultHeading = "Result",
  onInspect,
  selectedType,
  compact = false,
}: {
  run: SupportRun;
  results: EvalResult[];
  resultHeading?: string;
  onInspect: (type: EvalType) => void;
  selectedType?: EvalType | null;
  compact?: boolean;
}) {
  const [localSelected, setSelected] = useState<string | null>(null);
  const [field, setField] = useState<"input" | "output">(
    selectedType === "code" ? "output" : "input"
  );
  const selected =
    selectedType === undefined
      ? localSelected
      : results.find((result) => result.type === selectedType)?.id ?? null;
  function toggleResult(id: string) {
    setSelected(selected === id ? null : id);
    setField(
      compact && results.find((result) => result.id === id)?.type === "code"
        ? "output"
        : "input"
    );
    onInspect(results.find((result) => result.id === id)!.type);
  }
  return (
    <section
      className="vac-ai-generation-surface vac-support-results"
      aria-label="PostHog evaluation results"
    >
      <header className="vac-support-results-header">
        <span className="vac-ai-role">AI Observability</span>
        <h4>
          {results[0]?.flow === "offline"
            ? "Offline experiments"
            : "Evaluations"}
        </h4>
      </header>
      <table className="vac-lab-table" aria-label="Evaluation runs">
        <thead>
          <tr>
            <th>Evaluation</th>
            <th>{resultHeading}</th>
            <th className="vac-support-result-icon-cell">
              <span className="vac-sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <Fragment key={result.id}>
              <tr
                className="vac-support-result-row"
                data-selected={selected === result.id}
                onClick={() => toggleResult(result.id)}
              >
                <td>
                  <button
                    className="vac-support-result-select"
                    aria-controls={
                      selected === result.id
                        ? `support-eval-detail-${result.id}`
                        : undefined
                    }
                    aria-expanded={selected === result.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleResult(result.id);
                    }}
                  >
                    {evalNames[result.type]}
                  </button>
                </td>
                <td>{renderScore(result.value)}</td>
                <td className="vac-support-result-icon-cell">
                  <DisclosureIcon expanded={selected === result.id} />
                </td>
              </tr>
              {selected === result.id && (
                <tr className="vac-support-result-detail-row">
                  <td colSpan={3}>
                    <section
                      className="vac-support-result-detail"
                      id={`support-eval-detail-${result.id}`}
                      aria-label={`${evalNames[result.type]} details`}
                    >
                      <div className="vac-support-result-reason">
                        <span className="vac-ai-role">Reasoning</span>
                        <p>{result.reasoning}</p>
                      </div>
                      <PlaygroundGeneration
                        key={result.id}
                        field={field}
                        onFieldChange={setField}
                        input={[{ role: "user", content: run.input }]}
                        output={[{ role: "assistant", content: run.output }]}
                      />
                      {!compact && result.flow === "online" && (
                        <details>
                          <PlaygroundSummary>
                            How this eval runs
                          </PlaygroundSummary>
                          <div className="vac-support-result-reason">
                            <p>
                              {result.type === "judge"
                                ? "PostHog sends the captured request, answer, and policy to an AI judge, then records its score and reasoning."
                                : result.type === "code"
                                ? "PostHog runs this rule on the captured answer and records true or false."
                                : "PostHog’s sentiment model labels the captured customer message’s tone. It does not check the answer’s correctness."}
                            </p>
                          </div>
                          {result.type === "code" && (
                            <PlaygroundCodeBlock label="Hog">{`return position(toString(output), '7 days') > 0`}</PlaygroundCodeBlock>
                          )}
                        </details>
                      )}
                      {!compact && (
                        <details>
                          <PlaygroundSummary>Captured result</PlaygroundSummary>
                          <PlaygroundCodeBlock>
                            {JSON.stringify(
                              {
                                generation_id: run.id,
                                evaluation: result.type,
                                result: result.value,
                                source: result.flow,
                              },
                              null,
                              2
                            )}
                          </PlaygroundCodeBlock>
                        </details>
                      )}
                    </section>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SupportEvalsLesson({
  stage,
  onStage,
  onAllLabs,
}: {
  stage: number;
  onStage: (stage: number) => void;
  onAllLabs: () => void;
}) {
  const lab = useSupportEvals();
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const saved = lab.runs[lab.caseId];
  const production = lab.runs.production;
  const offline = saved
    ? lab.results.filter(
        (result) =>
          result.generationId === saved.id && result.flow === "offline"
      )
    : [];
  const online = production
    ? lab.results.filter(
        (result) =>
          result.generationId === production.id && result.flow === "online"
      )
    : [];
  const fixed = lab.runs.fixed;
  const fixedResults = fixed
    ? lab.results.filter((result) => result.generationId === fixed.id)
    : [];
  if (stage === 0)
    return (
      <div className="vac-guide-intro">
        <h3>{touchpointDefinitions.evaluations.title}</h3>
        <p>Learn how to evaluate whether an agent's response is correct.</p>
        <div className="vac-guide-example">
          <p>
            In this lab you'll test conversations before shipping with offline
            evals, or monitor real customer answers with online evals.
            <br />
            <br />
            Then, compare different eval types and learn how to turn production
            failures into regression tests.
          </p>
        </div>
        <Action onClick={() => onStage(1)}>Start lab →</Action>
        <details className="vac-lab-step">
          <PlaygroundSummary>How this simulation works</PlaygroundSummary>
          <p>
            Support conversations, terminal commands, scores, and PostHog views
            use fixed local examples. No model, terminal, MCP server, or hosted
            evaluation runs. No conversation or simulated AI data is sent to
            PostHog. The cancellation policy is an example for this lab.
          </p>
        </details>
      </div>
    );
  if (stage === 1)
    return (
      <>
        {saved ? (
          <PolicyLookup run={saved} />
        ) : (
          <>
            <p>
              Offline evals test example scenarios before you ship prompt or
              code changes. You can make up scenarios or save real customer
              conversations as test cases.
            </p>
            <p>
              Here, we’ve made up a customer who wants to cancel one day before
              arrival. The agent should explain why they don’t qualify for a
              full refund.
            </p>
            <LabChecklist
              label="Try the test case"
              items={[
                {
                  label: (
                    <>
                      Send the message in Twig’s <strong>Support agent</strong>.
                    </>
                  ),
                  done: !!saved,
                },
              ]}
            />
          </>
        )}
        <Action disabled={!saved} onClick={() => onStage(2)}>
          Evaluate the answer →
        </Action>
      </>
    );
  if (stage === 2)
    return (
      <>
        <p>
          There are a few different types of evaluations. All three can be used
          offline or online.
        </p>
        <ul className="vac-trip-definitions">
          {evalTypes.map((value) => (
            <li key={value}>{captions[value]}</li>
          ))}
        </ul>
        <LabChecklist
          label="Compare eval types"
          items={evalTypes.map((value) => ({
            label: (
              <>
                Send the prepared prompt in the{" "}
                <strong>Twig coding agent below</strong> to try{" "}
                <strong>{evalNames[value]}</strong>.
              </>
            ),
            done: offline.some((result) => result.type === value),
          }))}
        />
        <div
          className="vac-agent-terminal"
          role="region"
          aria-label="Coding agent session"
        >
          <div className="vac-agent-title">❯_ Twig / coding agent</div>
          {evalTypes.map((value, index) => {
            const result = offline.find((item) => item.type === value);
            const previousDone =
              index === 0 ||
              offline.some((item) => item.type === evalTypes[index - 1]);
            if (!result && !previousDone) return null;
            return (
              <OfflineTerminal
                key={value}
                embedded
                run={saved}
                type={value}
                result={result}
                onSend={() => lab.check(lab.caseId, value)}
              />
            );
          })}
        </div>
        <Action disabled={offline.length !== 3} onClick={() => onStage(3)}>
          View scores in PostHog →
        </Action>
      </>
    );
  if (stage === 3 && saved)
    return (
      <>
        <p>
          Your runner has reported three scores to PostHog. The policy and
          wording checks pass. Neutral describes the customer’s tone. It is not
          a quality score.
        </p>
        <Results
          run={saved}
          results={offline}
          onInspect={() => lab.view("offline")}
        />
        <p>
          One passing saved case tells you nothing about requests your test
          suite doesn’t cover. Online evals can reveal those gaps.
        </p>
        <Action
          onClick={() => {
            onStage(4);
          }}
        >
          Try online evals →
        </Action>
      </>
    );
  if (stage === 4)
    return (
      <>
        <p>
          Online evals check conversations after your agent answers. Before this
          conversation, we enabled three checks for Twig’s support responses in
          PostHog.
        </p>
        <ul className="vac-trip-definitions">
          <li>
            <strong>Code</strong> checks whether the answer contains “7 days”.
          </li>
          <li>
            <strong>Sentiment</strong> labels the customer’s input.
          </li>
          <li>
            <strong>LLM judge</strong> checks the answer against the
            cancellation and heating policy.
          </li>
        </ul>
        <p>
          PostHog captures the conversation, runs the matching evals, and
          records their scores. The customer sees only the support chat.
        </p>
        <Action
          onClick={() => {
            lab.configureOnline();
            onStage(5);
          }}
        >
          Try a customer conversation →
        </Action>
      </>
    );
  if (stage === 5)
    return (
      <>
        {!production && (
          <>
            <p>
              Online evals monitor answers real customers have already received.
              In this simulation, the same three evals are enabled for support
              generations in PostHog. Matching answers are evaluated
              automatically after capture.
            </p>
            <LabChecklist
              label="Capture a production conversation"
              items={[
                {
                  label: (
                    <>
                      Send the new customer message in Twig’s{" "}
                      <strong>Support agent</strong>.
                    </>
                  ),
                  done: !!production,
                },
              ]}
            />
          </>
        )}
        {production && (
          <>
            <p>
              This customer reports broken heating. The saved cancellation case
              never tested that exception. The reply can reach the customer
              before an online eval flags it.
            </p>
            <PolicyLookup run={production} />
          </>
        )}
        <Action disabled={!production} onClick={() => onStage(6)}>
          Inspect online eval results →
        </Action>
      </>
    );
  if (stage >= 6 && stage <= 9 && production) {
    const selectedType: EvalType | null =
      stage === 7
        ? "code"
        : stage === 8
        ? "sentiment"
        : stage === 9
        ? "judge"
        : null;
    const intro =
      stage === 7
        ? "The code eval passes because the answer contains “7 days”. That checks the wording, not whether the policy was applied correctly."
        : stage === 8
        ? "Sentiment is Negative because the customer is freezing and frustrated. It measures the customer’s tone, not the support answer’s correctness."
        : stage === 9
        ? "The LLM judge fails the answer: it applies the ordinary cancellation rule and ignores the broken-heating exception."
        : "PostHog has evaluated the captured heating complaint. Inspect each result to see what it measures—and what it misses.";
    const instruction =
      stage === 7
        ? "Code passed. Inspect the answer it checked."
        : stage === 8
        ? "Sentiment is Negative. Inspect the customer input."
        : stage === 9
        ? "You’ve inspected Code, Sentiment, and LLM judge."
        : "Open Code to inspect the rule’s result.";
    return (
      <>
        <p>{intro}</p>
        <LabChecklist
          label="Investigate the result"
          showStatus={selectedType !== null}
          items={[{ label: instruction, done: selectedType !== null }]}
        />
        <Results
          key={stage}
          run={production}
          results={online}
          selectedType={selectedType}
          compact
          onInspect={(type) => {
            lab.view("online");
            onStage(
              type === selectedType
                ? 6
                : type === "code"
                ? 7
                : type === "sentiment"
                ? 8
                : 9
            );
          }}
        />
        {stage === 9 && (
          <p>
            Code passed and sentiment was Negative, but only the policy judge
            caught the wrong answer. Save this production failure as an offline
            regression test.
          </p>
        )}
        <Action onClick={() => onStage(stage + 1)}>
          {stage === 6
            ? "Inspect Code →"
            : stage === 7
            ? "Inspect Sentiment →"
            : stage === 8
            ? "Inspect LLM judge →"
            : "Save as a regression test →"}
        </Action>
      </>
    );
  }
  if (stage === 10)
    return (
      <>
        <p>
          A production failure becomes an offline regression test. Your coding
          agent saves the heating request, updates the prompt to apply the
          heating exception first, and reruns the same evals locally or in CI.
        </p>
        <LabChecklist
          label="Test the fix"
          items={[
            {
              label: (
                <>
                  Send the prepared instruction to{" "}
                  <strong>Twig coding agent below</strong>.
                </>
              ),
              done: !!fixed,
            },
          ]}
        />
        <OfflineTerminal
          fixed
          run={fixed}
          type="judge"
          result={fixedResults.find((result) => result.type === "judge")}
          onSend={lab.fix}
        />
        {fixed && <p>{fixed.output}</p>}
        <Action disabled={!fixed} onClick={() => onStage(11)}>
          Review the new scores →
        </Action>
      </>
    );
  if (stage === 11 && fixed)
    return (
      <>
        <p>
          The runner reports the fixed case’s scores to PostHog. The policy
          judge now passes. The keyword still passes and the customer’s
          sentiment is still negative. Only the policy judge measures this fix.
        </p>
        <Results
          run={fixed}
          results={fixedResults}
          resultHeading="Fixed"
          onInspect={() => lab.view("offline")}
        />
        <p>
          Keep the original saved cases in the suite too. Ship after checking
          for regressions, then continue online monitoring for new failures.
        </p>
        <Action onClick={() => onStage(12)}>Finish lab →</Action>
      </>
    );
  if (stage === 12)
    return (
      <LabCompletionView
        lab="evaluations"
        headingRef={completionHeading}
        onChoose={onAllLabs}
        recap={{
          title:
            "You tested a known case, found a production failure, and verified a fix.",
          points: [
            "Offline evals check known cases before shipping; online evals find production failures.",
            "LLM judges check meaning, code checks rules, and sentiment describes tone.",
            "Save production failures as regression tests and check the fix.",
          ],
        }}
      />
    );
  return <p>Return to the previous step to generate the conversation first.</p>;
}

/** The eval lab composes the same lesson, agent, evidence, and completion templates as other labs. */
export function SupportEvalsLab(
  props: Parameters<typeof SupportEvalsLesson>[0]
) {
  return (
    <div className="vac-support-evals-lab">
      <SupportEvalsLesson {...props} />
    </div>
  );
}
