import type { ChannelAdapter, ChannelId, OutboundMessage, SendResult } from "./types";

/**
 * Tag to adapter router. Outbox payloads carry a channel tag; the router
 * dispatches to the adapter registered for that tag. Unknown tags fail loud
 * so a misconfigured outbox row surfaces immediately instead of silently
 * dropping the message.
 */
export class ChannelRouter {
  private readonly adapters = new Map<ChannelId, ChannelAdapter>();

  constructor(adapters: readonly ChannelAdapter[] = []) {
    for (const adapter of adapters) this.register(adapter);
  }

  /** Register (or replace) the adapter for its channel id. */
  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /** The adapter for a channel id. Throws when nothing is registered for it. */
  get(id: ChannelId): ChannelAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      const known = [...this.adapters.keys()].toSorted().join(", ") || "none";
      throw new Error(`unknown channel "${id}": no adapter registered (registered: ${known})`);
    }
    return adapter;
  }

  /** True when an adapter is registered for the channel id. */
  has(id: ChannelId): boolean {
    return this.adapters.has(id);
  }

  /** Channel ids with a registered adapter. */
  ids(): ChannelId[] {
    return [...this.adapters.keys()];
  }

  /** Dispatch an outbound message to the adapter for `msg.channel`. */
  async send(msg: OutboundMessage): Promise<SendResult> {
    return this.get(msg.channel).send(msg);
  }
}

export function createChannelRouter(adapters: readonly ChannelAdapter[] = []): ChannelRouter {
  return new ChannelRouter(adapters);
}
