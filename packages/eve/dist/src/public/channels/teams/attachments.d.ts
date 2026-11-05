import type { MessageContent, MessageFilePart } from "#shared/message-content.js";
import type { FetchFileResult } from "#channel/adapter.js";
import { type TeamsApiOptions, type TeamsAttachment } from "#public/channels/teams/api.js";
import { type UploadPolicyInput } from "#public/channels/upload-policy.js";
import type { UploadPolicy } from "#public/channels/upload-policy.js";
/** File handling options for the native Teams channel. */
export interface TeamsFilesConfig {
    /**
     * Hosts whose file URLs may be fetched besides Microsoft's Bot Connector and
     * SharePoint hosts, which are always allowed, or `"*"` for any host.
     */
    readonly allowedHosts?: readonly string[] | "*";
    /** Set to `false` to drop inbound attachments. On by default. */
    readonly enabled?: boolean;
    /** Size and type limits applied to accepted attachments. */
    readonly uploadPolicy?: UploadPolicyInput;
}
/** Normalized file handling policy used by the Teams channel. */
export interface TeamsFilesPolicy {
    readonly allowedHosts: readonly string[] | "*";
    readonly enabled: boolean;
    readonly uploadPolicy: UploadPolicy;
}
/** Normalizes author-provided Teams file options. */
export declare function normalizeTeamsFilesPolicy(config: TeamsFilesConfig | undefined): TeamsFilesPolicy;
/** Collects Teams attachment file parts unless file support is disabled. */
export declare function collectTeamsFileParts(attachments: readonly TeamsAttachment[], policy: TeamsFilesPolicy): MessageFilePart[];
/** Combines text + file parts into the MessagePart[] shape expected by the harness. */
export declare function buildTeamsTurnMessage(text: string, fileParts: readonly MessageFilePart[]): MessageContent;
/**
 * Builds the channel `fetchFile` resolver for Teams file URLs. Returns null when
 * files are disabled or the URL host is not in `allowedHosts`; otherwise fetches
 * the bytes and throws on a non-2xx response.
 */
export declare function createTeamsFetchFile(policy: TeamsFilesPolicy, api?: TeamsApiOptions): (url: string) => Promise<FetchFileResult | null>;
