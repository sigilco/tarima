/**
 * Notify senders (Stage B, channels stream).
 *
 * The fanout service knows how to write a message; this module binds
 * the two real channels to it:
 *
 *   - Telegram: the running bot's `send`, or nothing when no bot runs.
 *   - WhatsApp: the Cloud API adapter, with the 24h customer service
 *     window in mind (see the module note below).
 *
 * The senders are created lazily, because the api reads its secrets at
 * first use, not at import time (tests set the env before the first
 * request).
 */
import type { NotifySender } from "./notify";
import { sendTelegramMessage } from "../telegram";
import { whatsappAdapter } from "../channels";

/**
 * Telegram sender. Without a running bot the send is a no-op: the
 * fanout counts it as delivered, because there is nothing to deliver
 * to (the user did not configure a bot).
 */
export const telegramSender: NotifySender = {
  async send(externalId: string, text: string) {
    await sendTelegramMessage(externalId, text);
  },
};

/**
 * WhatsApp sender.
 *
 * The Cloud API only accepts free-form text inside the 24 hour
 * customer service window that starts when the user messages the
 * business. Outside that window the API refuses with a template error.
 * The connect flow makes the tester message the number first, which
 * opens the window, so the notification lands. A refusal is thrown and
 * counted as failed by the fanout, never fatal.
 */
export const whatsappSender: NotifySender = {
  async send(externalId: string, text: string) {
    const result = await whatsappAdapter().send({
      channel: "whatsapp",
      to: externalId,
      text,
    });
    if (!result.accepted) throw new Error(result.reason ?? "whatsapp send refused");
  },
};
