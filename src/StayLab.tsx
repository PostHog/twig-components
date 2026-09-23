"use client";

import { LabChoices } from "./LabChoices.js";

import { FinishLabButton } from "./FinishLabButton.js";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { stays, type Stay } from "./catalog.js";
import {
  initialStayLab,
  stayLabReducer,
  stayCode,
  type StayLabState,
  type StayLabAction,
} from "./stay-lab.js";
import { LabChecklist } from "./LabChecklist.js";

const Context = createContext<{
  state: StayLabState;
  dispatch: (action: StayLabAction) => void;
}>({ state: initialStayLab, dispatch: () => {} });
export const useStayLab = () => useContext(Context);
export function StayLabProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(stayLabReducer, initialStayLab);
  return (
    <Context.Provider value={{ state, dispatch }}>
      {children}
    </Context.Provider>
  );
}
function Action({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="vac-button" type="button" onClick={onClick}>
      <span className="vac-os-button-face">{children}</span>
    </button>
  );
}
export function StayLab({
  stage,
  onStage,
  pathname,
  renderStayLink,
}: {
  stage: number;
  onStage: (value: number) => void;
  pathname: string;
  renderStayLink: (stay: Stay) => ReactNode;
}) {
  const { state, dispatch } = useStayLab();
  const [identified, setIdentified] = useState(false);
  const [selected, select] = useState(0);
  const repair = state.before.length > 0;
  const distinct = new Set(state.events.map((event) => event.actualStayId));
  const complete = distinct.size >= 2;
  const nextStay =
    stays.find(
      (stay) => `/stays/${stay.id}` !== pathname && !distinct.has(stay.id)
    ) ?? stays[0];
  if (stage === 0)
    return (
      <div className="vac-guide-intro">
        <h3>Which stay did they view?</h3>
        <p>
          A view event tells you someone opened a listing. To compare listings,
          it also needs to say which stay they viewed.
        </p>
        <div className="vac-guide-example vac-booking-overview">
          <strong>Open a stay → Record its view → Identify the listing</strong>
          <p>You’ll visit two stays, then connect their IDs to the event.</p>
        </div>
        <Action onClick={() => onStage(1)}>Follow a stay view →</Action>
      </div>
    );
  if (stage === 1 && (!state.applied || !state.running))
    return (
      <section className="vac-lab vac-builder">
        <h3>{repair ? "Connect the stay ID" : "Record when a stay opens"}</h3>
        <p>
          {repair ? (
            <>
              Twig holds the listing’s ID in <code>stay.id</code>. Add it as{" "}
              <code>stay_id</code> so the event identifies the listing.
            </>
          ) : (
            <>
              This code runs when a stay page opens. It records{" "}
              <code>stay_viewed</code>, but doesn’t include which stay it was.
            </>
          )}
        </p>
        {repair && (
          <label className="vac-replay-mask">
            <input
              type="checkbox"
              checked={identified}
              onChange={(event) => setIdentified(event.target.checked)}
            />
            Include <code>stay_id</code>
          </label>
        )}
        <pre className="vac-booking-code">{stayCode(repair && identified)}</pre>
        <button
          className="vac-button"
          disabled={repair && !identified}
          onClick={() =>
            dispatch({ type: "apply", identified: repair && identified })
          }
        >
          <span className="vac-os-button-face">Apply the code →</span>
        </button>
      </section>
    );
  if (stage === 1)
    return (
      <section className="vac-lab vac-builder">
        <h3>
          {complete ? "Your stay views are ready" : "Visit two stays on Twig"}
        </h3>
        <p>
          {complete ? (
            "Both pages opened and produced view events. Review what each event can tell you."
          ) : (
            <>
              Code applied. Open another stay below. The event fires when its
              page opens, not when you hover over its link.
            </>
          )}
        </p>
        <LabChecklist
          label="Stay view progress"
          items={[
            { label: "Open the first stay", done: distinct.size >= 1 },
            { label: "Open a different stay", done: complete },
          ]}
        />
        {state.events.length > 0 && (
          <p role="status">Last viewed: {state.events.at(-1)?.actualTitle}.</p>
        )}
        {complete ? (
          <Action onClick={() => onStage(2)}>Review the stay views →</Action>
        ) : (
          renderStayLink(nextStay)
        )}
        <details className="vac-lab-step">
          <summary>Applied code</summary>
          <pre className="vac-booking-code">
            {stayCode(state.applied === "identified")}
          </pre>
        </details>
      </section>
    );
  const event = state.events[selected] ?? state.events.at(-1);
  if (!event)
    return (
      <div className="vac-lab">
        <h3>Open a stay first</h3>
        <Action onClick={() => onStage(1)}>Continue the exercise →</Action>
      </div>
    );
  return (
    <section className="vac-lab vac-builder">
      <h3>
        {repair
          ? "See which listing each event describes"
          : "Two views, no listing IDs"}
      </h3>
      <LabChoices
        label="Recorded visit"
        value={state.events.indexOf(event)}
        onChange={select}
        options={state.events.map((view, index) => ({
          value: index,
          label: (
            <>
              {index + 1}. {view.actualTitle} ·{" "}
              <code>{view.properties.stay_id ?? "ID not captured"}</code>
            </>
          ),
        }))}
      />
      <dl className="vac-event-comparison">
        <div>
          <dt>Viewed on Twig</dt>
          <dd>{event.actualTitle}</dd>
        </div>
        <div>
          <dt>
            Captured <code>stay_id</code>
          </dt>
          <dd>
            <code>{event.properties.stay_id ?? "Not captured"}</code>
          </dd>
        </div>
      </dl>
      <p>
        {repair ? (
          <>
            The event identifies the stay using <code>stay_id</code>. The event
            name stays the same across listings.
          </>
        ) : (
          "The lab knows which page you opened, but the captured event doesn’t. Both visits produce indistinguishable events."
        )}
      </p>
      <pre>
        {JSON.stringify(
          { event: event.event, properties: event.properties },
          null,
          2
        )}
      </pre>
      {repair ? (
        <>
          <h4>Views by stay</h4>
          <ul className="vac-booking-funnel">
            {[...distinct].map((id) => (
              <li key={id}>
                <code>{id}</code>
                <strong>
                  {
                    state.events.filter(
                      (view) => view.properties.stay_id === id
                    ).length
                  }
                </strong>
              </li>
            ))}
          </ul>
          <p>
            Before: no listing IDs. Now: views grouped by stay. These are views,
            not unique visitors.
          </p>
          <FinishLabButton onClick={() => onStage(3)} />
        </>
      ) : (
        <Action
          onClick={() => {
            dispatch({ type: "repair" });
            onStage(1);
          }}
        >
          Add the missing stay ID →
        </Action>
      )}
    </section>
  );
}
