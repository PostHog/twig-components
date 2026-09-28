"use client";
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { eventsReducer, initialEventsState, type EventsAction, type EventsState } from "./events-lab.js";
const Context = createContext<{ state: EventsState; dispatch: Dispatch<EventsAction>; active: boolean }>({ state: initialEventsState, dispatch: () => {}, active: false });
export function EventsLabProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, initialEventsState);
  return <Context.Provider value={{ state, dispatch, active }}>{children}</Context.Provider>;
}
export function useEventsLab() { return useContext(Context); }
