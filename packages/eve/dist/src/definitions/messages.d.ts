import { type Announcement } from "#harness/announcements.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import type { AnchoredEntry, CallRecord } from "./definition.js";
/**
 * Announcements join the record ahead of the turn's input, or at its end on a step that continues
 * from tool results, in the order the definitions made them: only a changed value adds a message,
 * so the prompt before it stays cached. A provider tool's pending result must open the next
 * response, so then nothing joins; the next request carries them.
 */
export declare function announce(draft: CallRecord, currentInput: ReadonlySet<HarnessModelMessage>, announcements: Readonly<Record<string, Announcement>>): CallRecord;
/**
 * Each entry just ahead of the first message its turn anchors. Every later call finds a turn's
 * input where it was, so context ahead of it keeps the prompt before it cached. Context whose
 * turn's input compaction summarized, or a turn that brought none, sits after the compaction's
 * checkpoint instead.
 */
export declare function placeAnchored(messages: readonly HarnessModelMessage[], entries: readonly AnchoredEntry[]): HarnessModelMessage[];
