import type { ModelMessage, UserContent } from "ai";
import type { ChannelAdapterContext } from "#channel/adapter.js";
import type { SandboxSession } from "#public/definitions/sandbox.js";
/**
 * Writes inbound `FilePart` bytes into the sandbox and rewrites each
 * staged part to a compact `eve-sandbox:` ref. Links resolve through the
 * channel's `fetchFile` or eve's public download; a file eve can't stage
 * becomes a note. Existing `eve-sandbox:` refs pass through so staging is
 * idempotent.
 */
export declare function stageAttachmentsForAdapter(content: string | UserContent, sandbox: SandboxSession, adapterCtx: ChannelAdapterContext): Promise<string | UserContent>;
/**
 * Context-bound variant of {@link stageAttachmentsForAdapter}. Without an
 * active sandbox, every file part becomes a note: history never keeps an
 * attachment eve did not stage.
 */
export declare function stageAttachmentsToSandbox(message: string | UserContent): Promise<string | UserContent>;
/**
 * Moves inline file payloads in `content` tool outputs into the sandbox and
 * leaves `eve-sandbox:` refs in their place, so durable history never
 * carries tool-result bytes. {@link hydrateSandboxAttachments} restores the
 * bytes on every model call. Without an active sandbox, or when it rejects
 * the write, each file becomes a note instead.
 */
export declare function stageToolResultMedia<T extends ModelMessage>(messages: readonly T[]): Promise<T[]>;
/**
 * Hydrates `eve-sandbox:` file refs for a single model call.
 *
 * Every attachment, inbound or returned by a tool, renders as a label naming
 * its sandbox path. Small verified images and PDFs follow their label as
 * bytes; anything else stays a label the agent can open with tools. Every
 * decision is pure in the ref, so each message renders identically on every
 * call and the provider's prompt cache stays valid. The returned messages
 * must not be written back to session history, which stays ref-only.
 *
 * Resuming a sandbox is slow and can be billed, so it happens only when a
 * ref needs bytes this process does not already hold for the session.
 */
export declare function hydrateSandboxAttachments(input: readonly ModelMessage[]): Promise<ModelMessage[]>;
/**
 * Chat Completions-style providers (`*.chat`) serialize `content` tool
 * outputs as JSON text, so a file would reach the model as base64
 * characters. Moves the files of each run of tool messages into one user
 * message right after it, leaving a text stub in the tool result. The move
 * is deterministic, so the prompt prefix stays cache-stable.
 */
export declare function moveToolResultFilesToUserMessages(messages: readonly ModelMessage[]): ModelMessage[];
