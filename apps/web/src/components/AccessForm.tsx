import { useState, type FormEvent } from "react";
import * as m from "../paraglide/messages.js";

export function AccessForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || state === "sending" || state === "done") return;
    setState("sending");
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-sage-soft px-6 py-3.5 text-sage ring-1 ring-sage/20">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span className="text-sm font-medium">{m["hero.ctaDone"]()}</span>
        <a
          href="/login"
          className="rounded-full bg-sage px-4 py-2 text-[13px] font-medium text-paper transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02]"
        >
          {m["hero.ctaDoneNext"]()}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`group flex items-center gap-2 rounded-full bg-ink/[0.04] p-1.5 ring-1 ring-ink/10 transition-shadow focus-within:ring-ink/25 max-[420px]:flex-col max-[420px]:rounded-[1.4rem] max-[420px]:items-stretch ${
        compact ? "w-full max-w-md" : "w-full max-w-xl"
      }`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={m["hero.placeholder"]()}
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3 max-[420px]:py-3"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="flex shrink-0 items-center gap-2.5 rounded-full bg-ink py-2.5 pl-5 pr-1.5 text-sm font-medium text-paper transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 max-[420px]:w-full max-[420px]:justify-between"
      >
        {state === "sending" ? "…" : m["hero.cta"]()}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/15 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      </button>
    </form>
  );
}
