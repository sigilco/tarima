import { type Contribution, type ContributionValues, type Draft } from "./definition.js";
/**
 * The call the contributions make, in definition order. What they add is collected; then each
 * arranges the draft the ones before it left, and sees everything collected.
 */
export declare function draftOf(contributions: readonly Contribution[]): Draft;
/** The latest contribution's choice of model: one that answers `undefined` leaves it to those before. */
export declare function decideModel(contributions: readonly Contribution[]): Promise<ContributionValues["model"] | undefined>;
export declare function collectEffects(contributions: readonly Contribution[]): Promise<import("./definition.js").Effect[]>;
