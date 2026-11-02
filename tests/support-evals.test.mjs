import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreeSupportRun,
  createSupportRun,
  evaluateSupportRun,
  supportEvidence,
  evaluationEvidence,
  evalTypes,
} from "../dist/support-evals.js";
import {
  playgroundPage,
  labsForProduct,
  touchpointDefinitions,
} from "../dist/playground.js";
const identity = {
  id: "generation-1",
  traceId: "trace-1",
  sessionId: "session-1",
  timestamp: "2026-10-28T12:00:00Z",
};
const score = (run, type, flow = "offline") =>
  evaluateSupportRun(run, type, flow, {
    id: `eval-${type}`,
    timestamp: identity.timestamp,
  });
test("saved and synthetic cases pass the policy judge, not just a wording check", () => {
  for (const caseId of ["saved", "synthetic"]) {
    const run = createSupportRun(caseId, false, identity);
    assert.equal(score(run, "judge").value, true);
    assert.equal(score(run, "code").value, true);
    assert.equal(score(run, "sentiment").value, "Neutral");
  }
});
test("a missed production exception fails policy but passes the deliberately weak code rule", () => {
  const run = createSupportRun("production", false, identity);
  assert.equal(score(run, "judge", "online").value, false);
  assert.equal(score(run, "code", "online").value, true);
  assert.equal(score(run, "sentiment", "online").value, "Negative");
  assert.match(score(run, "judge").reasoning, /ignores.*heating/);
  assert.equal(
    score({ ...run, output: "No refund" }, "code").value,
    false,
    "code executes the actual rule against the output"
  );
});
test("the prompt fix changes the answer and policy score, without changing customer sentiment", () => {
  const before = createSupportRun("production", false, identity);
  const after = createSupportRun("production", true, {
    ...identity,
    id: "generation-2",
  });
  assert.notEqual(before.output, after.output);
  assert.match(after.output, /relocation or a refund/);
  assert.equal(score(after, "judge").value, true);
  assert.equal(
    score(before, "sentiment").value,
    score(after, "sentiment").value
  );
});
test("trace, tool and generation share lineage without presenting model errors as quality failures", () => {
  const run = createSupportRun("production", false, identity);
  const [trace, tool, generation] = supportEvidence(run);
  assert.equal(trace.event, "$ai_trace");
  assert.equal(tool.event, "$ai_span");
  assert.equal(generation.event, "$ai_generation");
  for (const capture of [trace, tool, generation]) {
    assert.equal(capture.properties.$ai_trace_id, identity.traceId);
    assert.equal(capture.properties.demo_data, true);
  }
  assert.equal(tool.properties.$ai_parent_id, trace.properties.$ai_span_id);
  assert.equal(generation.properties.$ai_span_id, run.id);
  assert.equal(generation.properties.$ai_is_error, false);
  assert.match(tool.properties.$ai_output_state, /heating/);
  assert.equal(generation.properties.$ai_input[0].content, run.input);
});
test("all eval types target the evaluated generation and categorical sentiment is not a boolean score", () => {
  const run = createSupportRun("production", false, identity);
  for (const flow of ["offline", "online"])
    for (const type of evalTypes) {
      const result = score(run, type, flow);
      const capture = evaluationEvidence(result, run);
      assert.equal(capture.properties.$ai_target_event_id, run.id);
      assert.equal(capture.properties.evaluation_source, flow);
      if (type === "sentiment") {
        assert.equal(capture.properties.$ai_evaluation_result, null);
        assert.equal(capture.properties.$ai_sentiment_label, "negative");
      }
    }
});
test("the new eval lab has a stable ID and support starting route without changing the existing AIO lab", () => {
  const page = playgroundPage("/support", []);
  assert.equal(page.kind, "support");
  assert.equal(page.touchpoints[0].id, "evaluations");
  assert.equal(touchpointDefinitions.discovery.lab, "ai-discovery");
  const lab = labsForProduct("discovery").find(
    (item) => item.id === "evaluations"
  );
  assert.equal(lab.page, "support");
  assert.equal(lab.tool, "AI Observability");
  assert.equal(lab.color, "purple");
});

test("repeated evaluations preserve the evaluator identity while targeting distinct generations", () => {
  const before = createSupportRun("production", false, identity);
  const after = createSupportRun("production", true, {
    ...identity,
    id: "generation-2",
  });
  const a = evaluationEvidence(score(before, "judge"), before);
  const b = evaluationEvidence(score(after, "judge"), after);
  assert.equal(a.properties.$ai_evaluation_id, b.properties.$ai_evaluation_id);
  assert.notEqual(
    a.properties.$ai_target_event_id,
    b.properties.$ai_target_event_id
  );
});

test("free support chat captures fixed responses and redacted input, never visitor text", () => {
  const secret = "personal@example.com private booking reference 12345";
  for (const message of [
    "Hello",
    `Can I cancel? ${secret}`,
    `The heating is broken. ${secret}`,
    secret,
  ]) {
    const run = createFreeSupportRun(message, identity);
    assert.equal(run.source, "free");
    assert.equal(run.input, "[Visitor message omitted]");
    assert.ok(!JSON.stringify(supportEvidence(run)).includes(secret));
  }
  assert.match(createFreeSupportRun("Hello", identity).output, /Hi!/);
});

test("free chat can ask for notice and answer both sides of the demo cancellation rule", () => {
  assert.match(
    createFreeSupportRun("Can I cancel?", identity).output,
    /How many days/
  );
  assert.match(createFreeSupportRun("2 days", identity).output, /can’t offer/);
  assert.match(
    createFreeSupportRun("Can I cancel 20 days before arrival?", identity)
      .output,
    /qualifies for a full refund/
  );
});

test("support chat is empty and editable outside the lab, with prepared input only in guided mode", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { JSDOM } = await import("jsdom");
  const { SupportAgent } = await import("../dist/SupportAgent.js");
  const render = (props) =>
    new JSDOM(
      renderToStaticMarkup(
        createElement(SupportAgent, { onSend() {}, onReset() {}, ...props })
      )
    ).window.document;
  const free = render({});
  assert.equal(free.querySelector("textarea").value, "");
  assert.equal(free.querySelector("textarea").readOnly, false);
  assert.equal(free.querySelector('button[type="submit"]').disabled, true);
  assert.ok(!free.body.textContent.includes("Simulated support conversation"));
  const guided = render({ guided: true, caseId: "saved" });
  assert.match(guided.querySelector("textarea").value, /cancel 2 days/);
  assert.equal(guided.querySelector("textarea").readOnly, true);
  assert.equal(guided.querySelector('button[type="submit"]').disabled, false);
  const answered = render({
    guided: true,
    run: createSupportRun("saved", false, identity),
  });
  assert.equal(answered.querySelector("details"), null);
  assert.ok(!answered.body.textContent.includes("Policy lookup"));
});

test("eval lab completes with the shared recap and uses the horizontal coding-agent composer", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { JSDOM } = await import("jsdom");
  const { SupportEvalsProvider, SupportEvalsLab } = await import(
    "../dist/SupportEvalsLab.js"
  );
  const render = (stage) =>
    new JSDOM(
      renderToStaticMarkup(
        createElement(
          SupportEvalsProvider,
          null,
          createElement(SupportEvalsLab, {
            stage,
            onStage() {},
            onAllLabs() {},
          })
        )
      )
    ).window.document;
  const complete = render(12);
  assert.ok(complete.querySelector(".vac-lab-completion"));
  assert.ok(complete.querySelector(".vac-completion-check"));
  assert.match(
    complete.querySelector("h3").textContent,
    /evaluations complete/
  );
  assert.equal(complete.querySelectorAll(".vac-lab-completion li").length, 3);
  assert.match(complete.body.textContent, /Choose another lab/);
  const exercise = render(2);
  assert.equal(exercise.querySelector("textarea").rows, 1);
  assert.ok(exercise.querySelector(".vac-mcp-composer-horizontal"));
  assert.equal(exercise.querySelectorAll('input[type="radio"]').length, 0);
});

test("online walkthrough enables checks before capture, inspects all three targets, and reaches regression", async (t) => {
  const { createElement: h, act, useState } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { JSDOM } = await import("jsdom");
  const { SupportEvalsProvider, SupportEvalsLab, useSupportEvals } =
    await import("../dist/SupportEvalsLab.js");
  const dom = new JSDOM('<div id="root"></div>');
  const globals = {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
  });
  const evaluations = [];
  let state;
  function Exercise() {
    const [stage, onStage] = useState(4);
    state = useSupportEvals();
    return h(
      "div",
      null,
      h("button", { onClick: () => onStage(stage - 1) }, "Previous"),
      stage === 5 &&
        h(
          "button",
          { onClick: () => state.send("production") },
          "Send customer message"
        ),
      h(SupportEvalsLab, { stage, onStage, onAllLabs() {} })
    );
  }
  await act(() =>
    root.render(
      h(
        SupportEvalsProvider,
        { onEvaluation: (result) => evaluations.push(result) },
        h(Exercise)
      )
    )
  );
  const click = async (label) => {
    const button = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === label
    );
    assert.ok(button, `Missing button: ${label}`);
    await act(() => button.click());
  };
  assert.equal(state.onlineEnabled, false);
  assert.equal(document.querySelectorAll("h3").length, 0);
  assert.match(document.body.textContent, /enabled three checks/);
  await click("Try a customer conversation →");
  assert.equal(state.onlineEnabled, true);
  await click("Send customer message");
  assert.equal(evaluations.length, 3);
  assert.deepEqual(
    evaluations.map((result) => result.value),
    [false, true, "Negative"]
  );
  await click("Inspect online eval results →");
  await click("Inspect Code →");
  assert.match(
    document.querySelector("[role=tabpanel]").textContent,
    /AI response.*7 days/s
  );
  assert.match(document.body.textContent, /wording, not whether the policy/);
  assert.equal(document.querySelector(".vac-check-status").textContent, "✓");
  await act(() => document.querySelector("[role=tab]").click());
  assert.match(
    document.querySelector("[role=tabpanel]").textContent,
    /User message.*heating/s
  );
  await click("Inspect Sentiment →");
  assert.match(
    document.querySelector("[role=tabpanel]").textContent,
    /User message.*freezing and frustrated/s
  );
  assert.match(document.body.textContent, /customer’s tone, not/);
  await click("Inspect LLM judge →");
  assert.match(
    document.body.textContent,
    /ignores the essential-heating exception/
  );
  assert.match(document.body.textContent, /only the policy judge caught/);
  assert.equal(
    document.querySelectorAll(".vac-support-result-detail").length,
    1
  );
  await click("Previous");
  assert.match(document.body.textContent, /Sentiment is Negative/);
  await click("Inspect LLM judge →");
  assert.equal(
    evaluations.length,
    3,
    "Inspecting scores does not rerun online evaluations"
  );
  await click("Save as a regression test →");
  assert.match(
    document.body.textContent,
    /production failure becomes an offline regression test/
  );
  await act(() =>
    document
      .querySelector("form")
      .dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true })
      )
  );
  assert.ok(state.runs.fixed);
  await click("Review the new scores →");
  assert.match(document.body.textContent, /policy judge now passes/);
  await click("Finish lab →");
  assert.ok(document.querySelector(".vac-lab-completion"));
});
