export const PRESIDENTIAL_MODES = {
	ranking: { label: "Ranking", description: "The two leading candidates in big, then the next three." },
	trend: { label: "Trend", description: "How the five leading candidates evolved over the last 12 months." },
} as const;
export type PresidentialConfig = { mode: keyof typeof PRESIDENTIAL_MODES };
