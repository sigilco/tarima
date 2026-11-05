import type { TwilioTextMessage, TwilioVoiceCall, TwilioVoiceTranscription } from "#public/channels/twilio/inbound.js";
import type { TwilioChannelEvents, TwilioContext, TwilioInboundResult, TwilioVoiceResult } from "#public/channels/twilio/twilioChannel.js";
/** Default inbound text hook: dispatch with Twilio phone-number auth. */
export declare function defaultOnText(_ctx: TwilioContext, message: TwilioTextMessage): TwilioInboundResult;
/** Default inbound voice hook: accept the call with configured voice defaults. */
export declare function defaultOnVoice(_ctx: TwilioContext, _call: TwilioVoiceCall): TwilioVoiceResult;
/** Default inbound voice hook: dispatch with Twilio phone-number auth. */
export declare function defaultOnVoiceTranscription(_ctx: TwilioContext, transcription: TwilioVoiceTranscription): TwilioInboundResult;
export declare const defaultEvents: TwilioChannelEvents;
