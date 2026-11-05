import type { FetchFileResult } from "#channel/adapter.js";
/** Downloads one message's unclaimed links: at most {@link MAX_DOWNLOADS_PER_MESSAGE}, one at a time. */
export type PublicDownloads = (url: URL, adapterKind: string) => Promise<FetchFileResult>;
/** Starts the download budget for one message's attachments, each capped at `maxBytes`. */
export declare function createPublicDownloads(maxBytes: number): PublicDownloads;
