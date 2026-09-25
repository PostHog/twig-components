export const staySettings = ["All", "Forest", "Coast", "City"] as const;
export type StaySetting = (typeof staySettings)[number];
