import type { ContextReader } from "#context/key.js";
import { type CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import type { Definition } from "./definition.js";
/** The definitions the session's agent declares, built once per bundle. */
export declare function agentDefinitions(bundle: CompiledBundle): Promise<readonly Definition[]>;
/** The session's definitions. */
export declare function sessionDefinitions(ctx: Pick<ContextReader, "require">): Promise<readonly Definition[]>;
