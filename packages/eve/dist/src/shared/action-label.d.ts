import type { RuntimeActionRequest } from "#shared/action-types.js";
/**
 * How a call reads to people on every surface: the label its entry's definition
 * gives it, or the entry's display title. A call made through `eve__tool` or
 * `eve__skill` arrives as the call to its entry, so it reads like a direct call.
 */
export declare function actionLabel(action: RuntimeActionRequest, presentation: ActionPresentationByCallId | undefined): string;
/** A tool's authored label for a call or output snapshot. */
export interface ActionPresentation {
    readonly label?: string;
}
export type ActionPresentationByCallId = Readonly<Record<string, ActionPresentation>>;
