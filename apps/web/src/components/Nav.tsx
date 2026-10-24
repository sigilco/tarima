import * as m from "../paraglide/messages.js";

/**
 * Landing nav, single-section edition: logo pill + sign-in + Start free.
 * No anchor links — the landing is one section only.
 */
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <nav className="flex max-w-full items-center gap-1 rounded-full bg-paper/80 py-1.5 pl-5 pr-1.5 ring-1 ring-ink/10 backdrop-blur-xl">
        <a href="/" className="flex min-h-10 items-center gap-2.5 pr-4">
          <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
          <span className="font-display text-[19px] leading-none tracking-tight text-ink">
            tarima
          </span>
        </a>
        <div className="flex items-center gap-1 pl-4">
          <a
            href="/login"
            className="hidden min-h-10 items-center rounded-full px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink sm:inline-flex"
          >
            {m["nav.signin"]()}
          </a>
          <a
            href="/login"
            className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.03] active:scale-[0.97]"
          >
            {m["nav.cta"]()}
          </a>
        </div>
      </nav>
    </header>
  );
}
