import type { RuntimeActionRequest } from "#shared/action-types.js";
/** The tool, agent, or skill a request targets. */
export declare function actionRequestName(action: RuntimeActionRequest): string;
/** The skill an `eve__skill` input names, if it names one. */
export declare function skillTarget(input: unknown): string | undefined;
