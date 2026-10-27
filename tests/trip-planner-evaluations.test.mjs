import test from "node:test";
import assert from "node:assert/strict";
import { stays } from "@posthog/twig-components/catalog";
import { runPlannerRegression, plannerRegressionDataset, plannerCapacityScorer } from "@posthog/twig-components/trip-planner-evaluations";
const identity = traceId => ({ traceId, sessionId: "regression", generationId: traceId, startedAt: Date.parse("2026-10-27T10:00:00Z") });

test("the fixed lookup improves the same versioned dataset without counting skipped cases as passes", () => {
 const before = runPlannerRegression(stays, identity("before"), "before");
 const after = runPlannerRegression(stays, identity("after"), "after");
 assert.equal(before.datasetVersion, plannerRegressionDataset.version);
 assert.equal(before.scorerVersion, after.scorerVersion);
 assert.deepEqual(before.items.map(i=>i.caseId), after.items.map(i=>i.caseId));
 assert.equal(before.passRate, 0.5);
 assert.equal(after.passRate, 1);
 assert.equal(before.skipped, 1);
 assert.equal(after.skipped, 1);
 const cityBefore = before.items.find(i=>i.caseId === "city-four");
 const cityAfter = after.items.find(i=>i.caseId === "city-four");
 assert.equal(cityBefore.score.boolean, false);
 assert.equal(cityBefore.score.numeric, 0);
 assert.equal(cityBefore.score.category, "capacity-mismatch");
 assert.equal(cityAfter.score.numeric, plannerCapacityScorer.passingScore);
 assert.equal(cityAfter.score.category, "no-match");
 assert.equal(cityAfter.record.properties.tool_config_version, "capacity-v2");
 assert.equal(cityBefore.record.properties.tool_config_version, "capacity-v1");
 // The fix changes the tool filter, not the model prompt.
 assert.equal(cityBefore.record.properties.$ai_prompt_version, cityAfter.record.properties.$ai_prompt_version);
 for (const run of [before, after]) {
  const skipped = run.items.find(i=>i.caseId === "unknown-capacity");
  assert.equal(skipped.score.passed, null);
  assert.equal(skipped.score.numeric, null);
  assert.equal(skipped.score.category, "not-applicable");
  assert.equal(new Set(run.items.map(i=>i.record.properties.$ai_trace_id)).size, run.items.length);
  for (const item of run.items) {
   assert.equal(item.score.generationId, item.record.properties.$ai_span_id);
   assert.equal(item.score.source, "local-rule");
  }
 }
 assert.deepEqual(stays.find(s=>s.setting === "City").capacity, 2, "the missing-data fixture must not mutate the catalog");
});
