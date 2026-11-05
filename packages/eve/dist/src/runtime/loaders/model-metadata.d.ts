import { type ModelMetadata } from "#internal/model-catalog.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
/** Loads the model metadata snapshot the build baked into its compiled artifacts. */
export declare function loadModelMetadata(source: RuntimeCompiledArtifactsSource): Promise<ModelMetadata>;
