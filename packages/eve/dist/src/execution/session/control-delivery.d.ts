import type { ControlOrigin } from "#execution/session/input-queue.js";
import type { ControlDelivery } from "#harness/types.js";
/** A control's delivery as its facts name it: the id, and its sender as the wire names them. */
export declare function controlDeliveryOf(origin: ControlOrigin): ControlDelivery;
