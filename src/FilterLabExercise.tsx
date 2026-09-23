"use client";

import { LabChoices } from "./LabChoices.js";
import { LabChecklist } from "./LabChecklist.js";
import { FilterInspector } from "./FilterInspector.js";
import { filterLabCode, labPassed, type LabAction, type LabState } from "./filter-lab.js";
import { useId } from "react";

export function FilterLabIntroduction({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="vac-guide-intro">
      <h3>Why does every click look like Forest?</h3>
      <p>Visitors choose different filters, but your events keep recording Forest.</p>
      <div className="vac-guide-example vac-guide-lesson">
        <p>Follow a click into its event, find the fixed value, then connect the filter’s actual value.</p>
      </div>
      <p>The goal: record which destination type each visitor chose.</p>
      <button className="vac-button" onClick={onContinue}>
        <span className="vac-os-button-face">See the worked example →</span>
      </button>
      <details className="vac-lab-step">
        <summary>How this simulation works</summary>
        <p>After you apply your configuration, this lab records filter clicks locally while the exercise is open. Nothing is sent to PostHog.</p>
        <p>Returning to the list pauses recording and keeps your work. Leaving the page resets it.</p>
      </details>
    </div>
  );
}

function FilterCode({ config }: { config: LabState["config"] }) {
  return (
    <pre>
      {`// Inside the filter's click handler\nposthog.capture(${JSON.stringify(
        config.eventName
      )}, {\n`}
      <mark className="vac-ai-code-highlight">{`  destination_type: ${
        config.source === "clicked"
          ? "selectedDestinationType"
          : JSON.stringify(config.fixedValue)
      },`}</mark>
      {"\n});"}
    </pre>
  );
}

export function FilterLabExercise({
  state,
  dispatch,
  stage,
  setStage,
  embedSource,
  onFocusFilters,
  onContinue,
  filterHref,
}: {
  state: LabState;
  dispatch: (action: LabAction) => void;
  stage: number;
  setStage: (stage: number) => void;
  embedSource?: "fixed" | "clicked";
  onFocusFilters: () => void;
  onContinue: (source: "fixed" | "clicked") => void;
  filterHref: string;
}) {
  const titleId = useId();
  const latest = state.events.at(-1);
  const passed = labPassed(state);
  const example = {
    eventName: "stay_filter_selected",
    source: "fixed" as const,
    fixedValue: "Forest",
  };
  const triedBoth = ["Forest", "Coast"].every((setting) =>
    state.events.some((event) => event.clicked === setting)
  );
  const nextFilter = state.events.some((event) => event.clicked === "Forest")
    ? "Coast"
    : "Forest";
  return (
    <section className="vac-lab vac-builder" aria-labelledby={titleId}>
      <h3 id={titleId}>
        {stage === 2
          ? "Compare the click with the event"
          : state.step === 0
          ? "From a filter click to an event"
          : state.step === 2
          ? "Connect the clicked value"
          : triedBoth
          ? "Now compare the evidence"
          : `Try ${nextFilter} on Twig`}
      </h3>
      {stage === 1 && (
        <>
          {state.step === 0 && (
            <>
              <p>
                When someone clicks a filter, its click handler runs this code.
                The event name describes the action –{" "}
                <code>destination_type</code> records which filter it was.
              </p>
              <FilterCode
                config={{ ...example, source: embedSource ?? example.source }}
              />
              {embedSource === "clicked" ? (
                <p>
                  The property now reads <code>selectedDestinationType</code>{" "}
                  from each click. Apply the code, then test{" "}
                  <strong>Forest</strong> and <strong>Coast</strong>.
                </p>
              ) : (
                <p>
                  <code>{'"Forest"'}</code> is a fixed value. First, click{" "}
                  <strong>Forest</strong> to see how it becomes an event. Then
                  try <strong>Coast</strong>.
                </p>
              )}
              <button
                className="vac-button"
                onClick={() => {
                  dispatch({ type: "example" });
                  if (embedSource === "clicked") {
                    dispatch({ type: "edit", config: { source: "clicked" } });
                    dispatch({ type: "apply" });
                  }
                  onFocusFilters();
                }}
              >
                <span className="vac-os-button-face">Apply the code →</span>
              </button>
            </>
          )}
          {state.step === 2 && (
            <>
              <p>
                Twig stores the clicked filter in{" "}
                <code>selectedDestinationType</code>. Use that value instead of
                the text <code>{'"Forest"'}</code>.
              </p>
              <LabChoices<"fixed" | "clicked">
                label={
                  <>
                    Where should <code>destination_type</code> come from?
                  </>
                }
                value={state.config.source}
                onChange={(source) =>
                  dispatch({ type: "edit", config: { source } })
                }
                options={[
                  {
                    value: "fixed",
                    label: (
                      <>
                        Fixed text: <code>{'"Forest"'}</code>
                      </>
                    ),
                  },
                  {
                    value: "clicked",
                    label: (
                      <>
                        The clicked filter: <code>selectedDestinationType</code>
                      </>
                    ),
                  },
                ]}
              />
              <FilterCode config={state.config} />
              <p className="vac-muted">
                {state.config.source === "clicked"
                  ? "The highlighted line now reads the value from each click."
                  : "This still records Forest for every click."}
              </p>
              <button
                className="vac-button"
                onClick={() => {
                  dispatch({ type: "apply" });
                  onFocusFilters();
                }}
              >
                <span className="vac-os-button-face">Apply the change →</span>
              </button>
            </>
          )}
          {state.step === 3 && (
            <>
              <p>
                {triedBoth ? (
                  "You’ve clicked both filters. Inspect how those clicks were recorded."
                ) : (
                  <>
                    Click <strong>{nextFilter}</strong> in Twig’s stay filters.
                    Watch the event below update.
                  </>
                )}
              </p>
              <LabChecklist
                label="Filter exercise progress"
                items={[
                  {
                    label: (
                      <>
                        Click <strong>Forest</strong> on Twig
                      </>
                    ),
                    done: state.events.some(
                      (event) => event.clicked === "Forest"
                    ),
                  },
                  {
                    label: (
                      <>
                        Click <strong>Coast</strong> on Twig
                      </>
                    ),
                    done: state.events.some(
                      (event) => event.clicked === "Coast"
                    ),
                  },
                ]}
              />
              {latest && (
                <p role="status">
                  Last click: <strong>{latest.clicked}</strong>. Recorded{" "}
                  <code>destination_type</code>:{" "}
                  <code>{latest.properties.destination_type}</code>.
                </p>
              )}
              {triedBoth ? (
                <button className="vac-button" onClick={() => setStage(2)}>
                  <span className="vac-os-button-face">
                    Inspect the difference →
                  </span>
                </button>
              ) : (
                <button className="vac-button" onClick={onFocusFilters}>
                  <span className="vac-os-button-face">
                    Go to the filters →
                  </span>
                </button>
              )}
            </>
          )}
        </>
      )}
      {stage === 2 && (
        <FilterInspector
          state={state}
          filterHref={filterHref}
          bounded={Boolean(embedSource)}
          onPractice={() => {
            if (state.selected) dispatch({ type: "repair" });
            setStage(1);
          }}
        />
      )}
      {embedSource && stage === 2 && triedBoth && (
        <div className="vac-lab-output">
          <h4>
            {embedSource === "fixed"
              ? "The mismatch is visible"
              : "The values match"}
          </h4>
          <p>
            {embedSource === "fixed"
              ? "Continue reading to see how the team fixes this."
              : "Continue reading to see what the team can now measure."}
          </p>
          <button
            className="vac-button"
            onClick={() => onContinue(embedSource)}
          >
            <span className="vac-os-button-face">Continue reading →</span>
          </button>
        </div>
      )}
      {!embedSource && passed && stage === 2 && (
        <button type="button" className="vac-button" onClick={() => setStage(3)}>
          <span className="vac-os-button-face">Finish lab</span>
        </button>
      )}
      {stage === 1 && state.events.length >= 20 && (
        <p>20-event limit reached. Clear the run to continue.</p>
      )}
      {stage === 1 && (
        <details className="vac-lab-step">
          <summary>Code and session options</summary>
          <pre>
            {filterLabCode(
              embedSource && state.step === 0
                ? { ...example, source: embedSource }
                : state.applied ?? state.config
            )}
          </pre>
          <div className="vac-lab-actions">
            {state.events.length > 0 && (
              <button
                className="vac-text-button"
                onClick={() => dispatch({ type: "clear" })}
              >
                Clear events
              </button>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
