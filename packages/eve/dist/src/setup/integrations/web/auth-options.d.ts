import type { VercelTeamRequirement } from "#setup/vercel-project-api.js";
export declare const WEB_CHAT_TEAM_REQUIREMENT: VercelTeamRequirement;
export type WebAuthenticationChoice = "vercel" | "custom";
export declare const WEB_AUTHENTICATION_QUESTION: import("#setup/ask.js").Question<WebAuthenticationChoice>;
