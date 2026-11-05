import type { EveChannel, EveChannelConfig } from "#eve-channel/types.js";
export * from "#eve-channel/types.js";
export { eveVercelOidc, type EveVercelOidcOptions } from "#eve-channel/auth.js";
export declare function eveChannel(input: EveChannelConfig): EveChannel;
