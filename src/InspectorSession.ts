export type InspectionSessionState = {
  selectionId: number | null;
  followLatest: boolean;
  consoleAfterId: number;
};

export type InspectionSessionAction =
  | { type: "select"; id: number }
  | { type: "clear"; latestId: number }
  | { type: "follow" };

export const initialInspectionSession: InspectionSessionState = {
  selectionId: null, followLatest: true, consoleAfterId: 0,
};

export function inspectionSessionReducer(state: InspectionSessionState, action: InspectionSessionAction): InspectionSessionState {
  switch (action.type) {
    case "select": return { ...state, selectionId: action.id, followLatest: false };
    case "clear": return { ...state, consoleAfterId: action.latestId, selectionId: null, followLatest: true };
    case "follow": return { ...state, selectionId: null, followLatest: true };
  }
}

/** Select an earlier console record or follow the newest record after clearing. */
export function selectedInspectionRecord<T extends { id: number }>(activity: readonly T[], state: InspectionSessionState): T | undefined {
  const records = activity.filter(item => item.id > state.consoleAfterId);
  return state.followLatest ? records.at(-1) : records.find(item => item.id === state.selectionId);
}
