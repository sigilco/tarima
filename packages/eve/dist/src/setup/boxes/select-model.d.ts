import { type GatewayCatalogModel } from "#shared/gateway-model-catalog.js";
import type { SelectOption } from "../ask.js";
export type { GatewayCatalogModel } from "#shared/gateway-model-catalog.js";
/** Fetches the raw AI Gateway catalog. */
export declare function fetchGatewayCatalog(signal?: AbortSignal): Promise<GatewayCatalogModel[]>;
/**
 * Builds picker options from a fetched catalog, keeping the default model and
 * filtering the rest to language models with the `web-search` tag. The curated
 * shortlist comes first in its own order, followed by the rest newest-first.
 * Catalog entries on the shortlist are marked `featured`, so a searchable
 * picker opens on just them and scrolling or filtering reaches the rest. Falls
 * back to a static shortlist when the catalog is missing or yields nothing.
 */
export declare function modelOptionsFromCatalog(catalog: readonly GatewayCatalogModel[] | undefined): SelectOption<string>[];
