import type { EventOfType } from '#compiled/@workflow/world/index.js';
import { type AttributeChange } from '#compiled/@workflow/world/index.js';
export declare function normalizeAttributeChanges(attrs: Record<string, string | undefined>, options?: {
    allowReservedAttributes?: boolean;
}, writer?: EventOfType<'attr_set'>['eventData']['writer']): AttributeChange[];
//# sourceMappingURL=attribute-changes.d.ts.map