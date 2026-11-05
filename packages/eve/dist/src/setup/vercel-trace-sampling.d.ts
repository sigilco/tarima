import type { VercelProjectReference } from "./project-resolution.js";
import type { Prompter } from "./prompter.js";
export declare function configureTraceSampling(link: VercelProjectReference, prompter: Pick<Prompter, "log">, signal?: AbortSignal): Promise<void>;
