"use client";

import { LabChoices } from "./LabChoices.js";

import { FinishLabButton } from "./FinishLabButton.js";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  todayAtStay,
  validateTrip,
  type TripSelection,
} from "./trip-dates.js";
import {
  bookingReducer,
  bookingCode,
  initialBookingState,
  type BookingAction,
  type BookingState,
} from "./booking-lab.js";

const emptyTrip: TripSelection = { checkIn: "", checkOut: "", guests: "" };
const BookingContext = createContext<{
  state: BookingState;
  dispatch: (action: BookingAction) => void;
  active: boolean;
  trip: TripSelection;
  setTrip: Dispatch<SetStateAction<TripSelection>>;
}>({
  state: initialBookingState,
  dispatch: () => {},
  active: false,
  trip: emptyTrip,
  setTrip: () => {},
});
export function BookingLabProvider({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) {
  const [trip, setTrip] = useState<TripSelection>(emptyTrip);
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  return (
    <BookingContext.Provider value={{ state, dispatch, active, trip, setTrip }}>
      {children}
    </BookingContext.Provider>
  );
}
export const useBookingLab = () => useContext(BookingContext);
function Action({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="vac-button" onClick={onClick}>
      <span className="vac-os-button-face">{children}</span>
    </button>
  );
}
export function BookingLab({
  stage,
  onStage,
  onFocusBooking,
}: {
  stage: number;
  onStage: (stage: number) => void;
  onFocusBooking: () => void;
}) {
  const { state, dispatch, trip } = useBookingLab();
  const [selected, select] = useState<string | null>(null);
  const attempts = state.runs.filter((run) => run.outcome === state.lesson);
  const run = attempts.find((run) => run.id === selected) ?? attempts.at(-1);
  const success = state.lesson === "success";
  function apply() {
    dispatch({ type: "apply", source: "confirmation", outcome: state.lesson });
    select(null);
    onFocusBooking();
  }
  if (stage === 0)
    return (
      <div className="vac-guide-intro">
        <h3>Follow a booking from click to confirmation</h3>
        <p>
          First, complete a successful booking and inspect its events. Then
          repeat the exercise with a failed request.
        </p>
        <div className="vac-guide-example vac-booking-overview">
          <strong>Book stay → Validate trip → Receive result</strong>
          <p>
            Record the attempt on click. Record completion only after
            confirmation.
          </p>
        </div>
        <Action onClick={() => onStage(1)}>
          {success
            ? "Practice a successful booking →"
            : "Continue the failure exercise →"}
        </Action>
      </div>
    );
  if (stage === 1 && state.applied) {
    const { errors } = validateTrip(
      trip,
      Number.MAX_SAFE_INTEGER,
      todayAtStay()
    );
    const datesReady = !errors.checkIn && !errors.checkOut;
    const guestsReady = !errors.guests;
    const finished = !!state.latest;
    const tasks = [
      {
        label: "Choose check-in and check-out dates",
        done: datesReady || finished,
      },
      { label: "Choose your guests", done: guestsReady || finished },
      {
        label: (
          <>
            Click <strong>Book stay</strong> on Twig
          </>
        ),
        done: finished,
      },
    ];
    const current = tasks.findIndex((task) => !task.done);
    return (
      <section className="vac-lab vac-builder">
        <h3>
          {finished
            ? success
              ? "Your booking is confirmed"
              : "Your booking request failed"
            : "Make your booking on Twig"}
        </h3>
        <p role="status">
          {finished ? (
            "Your attempt is recorded. Next, review the events it produced."
          ) : (
            <>
              Code applied. Use the <strong>Your stay</strong> form on Twig to
              complete these steps.
            </>
          )}
        </p>
        <ol className="vac-booking-checklist" aria-label="Booking progress">
          {tasks.map((task, index) => (
            <li
              key={index}
              data-state={
                task.done ? "done" : index === current ? "current" : "upcoming"
              }
              aria-current={index === current ? "step" : undefined}
            >
              <span
                className="vac-check-status"
                aria-label={
                  task.done
                    ? "Complete"
                    : index === current
                    ? "Next"
                    : "Upcoming"
                }
              >
                {task.done ? "✓" : index + 1}
              </span>
              <span>{task.label}</span>
            </li>
          ))}
        </ol>
        {finished ? (
          <Action onClick={() => onStage(2)}>
            {success ? "Inspect the success →" : "Inspect the failure →"}
          </Action>
        ) : (
          <Action onClick={onFocusBooking}>Show the booking form →</Action>
        )}
        <details className="vac-lab-step">
          <summary>Applied code</summary>
          <pre className="vac-booking-code">{bookingCode("confirmation")}</pre>
        </details>
      </section>
    );
  }
  if (stage === 1)
    return (
      <section className="vac-lab vac-builder">
        <h3>
          {state.latest
            ? success
              ? "Your booking is confirmed"
              : "Your booking request failed"
            : success
            ? "Make a successful booking"
            : "Try a failed booking"}
        </h3>
        <p>
          {success ? (
            <>
              This code records events from Twig’s <strong>Book stay</strong>{" "}
              button. Apply it, then make a simulated booking to see{" "}
              <code>booking_started</code> on click and{" "}
              <code>booking_completed</code> after confirmation.
            </>
          ) : (
            "This request will fail. Keep the same code: it should record the attempt without recording a completed booking."
          )}
        </p>
        <pre className="vac-booking-code" aria-label="Booking capture code">
          {bookingCode("confirmation")}
        </pre>
        <Action onClick={apply}>Apply the code →</Action>
      </section>
    );
  if (!run)
    return (
      <div className="vac-lab">
        <h3>
          {success
            ? "Complete the successful booking first"
            : "Try the failed booking first"}
        </h3>
        <p>Try this scenario on Twig, then inspect its events here.</p>
        <Action onClick={() => onStage(1)}>Continue the exercise →</Action>
      </div>
    );
  const completed = run.events.some(
    (event) => event.event === "booking_completed"
  );
  const mismatch = completed && run.outcome === "failure";
  const before = state.runs.find(
    (item) => item.source === "click" && item.outcome === "failure"
  );
  return (
    <section className="vac-lab vac-builder">
      <h3>
        {success
          ? "What the successful booking recorded"
          : "What the failed booking recorded"}
      </h3>
      {attempts.length > 1 && (
        <LabChoices
          label="Booking attempt"
          value={run.id}
          onChange={select}
          options={[...attempts].reverse().map((item) => ({
            value: item.id,
            label: (
              <>
                {item.id} · {item.outcome} ·{" "}
                {item.source === "click" ? "on click" : "on confirmation"}
              </>
            ),
          }))}
        />
      )}
      <dl className="vac-event-comparison">
        <div>
          <dt>Twig’s result</dt>
          <dd>
            {run.outcome === "success"
              ? "Confirmed (simulation)"
              : "Request failed"}
          </dd>
        </div>
        <div data-mismatch={mismatch}>
          <dt>Completion recorded</dt>
          <dd>{completed ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p role="status">
        {mismatch
          ? "This completion is false. The click recorded it before the failed response arrived."
          : run.outcome === "failure"
          ? "Correct. The request failed, so no completion was recorded. The started event still shows the attempt."
          : run.source === "click"
          ? "These match this time, but the code recorded completion before the response. A failed request would still count as completed."
          : "Correct. Completion was recorded after the successful response."}
      </p>
      <h4>This attempt’s funnel</h4>
      <p className="vac-muted">
        A funnel tracks which steps were reached. These counts describe one
        local simulated attempt, not real visitors.
      </p>
      <ol className="vac-booking-funnel">
        {["availability_checked", "booking_started", "booking_completed"].map(
          (name) => (
            <li key={name}>
              <code>{name}</code>
              <strong>
                {run.events.some((event) => event.event === name) ? "1" : "0"}
              </strong>
            </li>
          )
        )}
      </ol>
      {mismatch && (
        <p>
          The funnel reports a completed booking even though Twig rejected it. A
          chart can only be as accurate as the events you send.
        </p>
      )}
      {before && run.source === "confirmation" && run.outcome === "failure" && (
        <div className="vac-guide-example">
          <strong>Same failure, different evidence</strong>
          <p>
            Before: a completion on click. Now: an attempt, with no false
            completion.
          </p>
        </div>
      )}
      {success ? (
        <>
          <p>
            The attempt and completion both appear because Twig confirmed the
            booking. Next, use the same code with a failed request.
          </p>
          <Action
            onClick={() => {
              dispatch({ type: "begin-failure" });
              select(null);
              onStage(1);
            }}
          >
            Now practice a failed booking →
          </Action>
        </>
      ) : (
        <>
          <div className="vac-guide-example vac-booking-overview">
            <strong>Same code, different result</strong>
            <p>
              Success: started and completed. Failure: started only. The
              confirmation check keeps a failed request out of your
              completed-booking count.
            </p>
          </div>
          {!mismatch && <FinishLabButton onClick={() => onStage(3)} />}
        </>
      )}

      <details className="vac-lab-step">
        <summary>Captured events and applied code</summary>
        <p>
          Availability is recorded when the local availability check succeeds.
          Start records the request. Completion depends on the code you applied.
        </p>
        <pre className="vac-booking-code">{bookingCode(run.source)}</pre>
        <pre>{JSON.stringify(run.events, null, 2)}</pre>
      </details>
    </section>
  );
}
