export const staySettings = ["All", "Forest", "Coast", "Mountain"] as const;
export type StaySetting = (typeof staySettings)[number];
