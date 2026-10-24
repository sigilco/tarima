import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon } from "./icons";

type Message = {
  id: number;
  text: string;
  meta: string;
};

type PhoneChatDemoProps = {
  initialMessages?: Message[];
  galleryImages?: { src: string; alt: string; chip: string }[];
  quickPrompts?: { label: string; text: string }[];
  inputPlaceholder?: string;
};

export function PhoneChatDemo({
  initialMessages = [
    {
      id: 1,
      text: "Hey! Please show me my latest images from my latest trip.",
      meta: "9:40 AM",
    },
    {
      id: 2,
      text: "Sure, here are the latest images from your trip to the island of deez nuts.",
      meta: "9:41 AM · Aceternity AI",
    },
  ],
  galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
      alt: "Tropical Beach",
      chip: "Beach",
    },
    {
      src: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80",
      alt: "Sunset Island",
      chip: "Sunset",
    },
  ],
  quickPrompts = [
    { label: "📝 Summarize meetings", text: "Summarize today's meetings" },
    { label: "✈️ Export trip", text: "Export trip itinerary to PDF" },
  ],
  inputPlaceholder = "Ask Aceternity AI...",
}: PhoneChatDemoProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(3);

  const scrollToBottom = () => {
    // matches the HTML: scroll the phone screen container (timeline's parent)
    const el = timelineRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const send = (raw: string) => {
    const query = raw.trim();
    if (!query) return;

    setMessages((prev) => [...prev, { id: idRef.current++, text: query, meta: "Just now" }]);
    setInput("");
    requestAnimationFrame(scrollToBottom);

    const lower = query.toLowerCase();
    let reply = "I've organized that into your mobile workspace!";
    if (lower.includes("meeting") || lower.includes("summarize")) {
      reply = "Meeting notes synced. 3 key action items flagged for today.";
    } else if (lower.includes("trip") || lower.includes("itinerary")) {
      reply = "Export complete: Trip_Itinerary.pdf ready in your files.";
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, text: reply, meta: "Just now · Aceternity AI" },
      ]);
      requestAnimationFrame(scrollToBottom);
    }, 700);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send(input);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {/* Chat Timeline */}
      <div ref={timelineRef} className="flex flex-col gap-3.5">
        {/* Chat Bubble 1 (User) */}
        <div className="animate-bubble-1 flex max-w-[88%] flex-col items-start opacity-0">
          <div className="rounded-2xl rounded-tl-sm bg-[#F3F4F6] px-4 py-3 text-[13px] leading-relaxed text-neutral-800 shadow-sm">
            {initialMessages[0]?.text}
          </div>
          <span className="ml-1 mt-1 text-[10px] text-neutral-400">{initialMessages[0]?.meta}</span>
        </div>

        {/* Chat Bubble 2 (AI Assistant) */}
        <div className="animate-bubble-2 flex max-w-[90%] flex-col items-start opacity-0">
          <div className="rounded-2xl rounded-tl-sm bg-[#F3F4F6] px-4 py-3 text-[13px] leading-relaxed text-neutral-800 shadow-sm">
            {initialMessages[1]?.text}
          </div>
          <span className="ml-1 mt-1 text-[10px] text-neutral-400">{initialMessages[1]?.meta}</span>
        </div>

        {/* Chat Bubble 3 (Interactive Gallery Preview) */}
        <div className="animate-bubble-3 mt-1 grid max-w-[92%] grid-cols-2 gap-2 opacity-0">
          {galleryImages.map((img) => (
            <div
              key={img.alt}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-200"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white backdrop-blur-sm">
                {img.chip}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamically appended messages */}
        {messages.slice(2).map((msg) => (
          <div key={msg.id} className="flex max-w-[88%] flex-col items-start transition-all">
            <div className="rounded-2xl rounded-tl-sm bg-[#F3F4F6] px-4 py-3 text-[13px] leading-relaxed text-neutral-800 shadow-sm">
              {msg.text}
            </div>
            <span className="ml-1 mt-1 text-[10px] text-neutral-400">{msg.meta}</span>
          </div>
        ))}
      </div>

      {/* Interactive Mock Input at bottom of phone */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
        {/* Suggested Quick Prompts */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => send(p.text)}
              className="whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Field Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            className="w-full bg-transparent text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800"
          >
            <ArrowUpIcon className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* iOS Home Indicator bar */}
        <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-neutral-300" />
      </div>
    </>
  );
}
