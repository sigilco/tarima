/**
 * The floating launcher (screen chat-1, chat-closed): a clay bubble in
 * the bottom-right of the content column. Click opens the panel.
 */
import * as m from "#/paraglide/messages.js";
import { MessageCircleIcon } from "lucide-react";

export function ChatBubble({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      data-slot="chat-bubble"
      aria-label={m["chat.open"]()}
      title={m["chat.open"]()}
      onClick={onOpen}
      className="fixed right-6 bottom-6 z-40 flex size-12 items-center justify-center rounded-full bg-[#b8491f] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircleIcon className="size-5" />
    </button>
  );
}
