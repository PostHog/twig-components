"use client";
import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { eventsReducer, initialEventsState, type EventsAction, type EventsState } from "./events-lab.js";
const Context = createContext<{ state: EventsState; dispatch: Dispatch<EventsAction>; active: boolean }>({ state: initialEventsState, dispatch: () => {}, active: false });
export function EventsLabProvider({ active, resetKey = 0, children }: { active: boolean; resetKey?: number; children: ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, initialEventsState);
  const previousResetKey = useRef(resetKey);
  useEffect(() => {
    if (previousResetKey.current !== resetKey) {
      previousResetKey.current = resetKey;
      dispatch({ type: "reset" });
    }
  }, [resetKey]);
  return <Context.Provider value={{ state, dispatch, active }}>{children}</Context.Provider>;
}
export function useEventsLab() { return useContext(Context); }
