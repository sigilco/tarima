import { ExternalLinkIcon } from "./icons";

type PlayfulNavProps = {
  logoText?: string;
  wordmark?: string;
  detailsLabel?: string;
  linkLabel?: string;
  linkHref?: string;
  onDetailsClick?: () => void;
};

export function PlayfulNav({
  logoText = "A",
  wordmark = "aceternity.ai",
  detailsLabel = "Template Details",
  linkLabel = "Aceternity UI",
  linkHref = "https://ui.aceternity.com",
  onDetailsClick,
}: PlayfulNavProps) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-sm font-black text-white">
          {logoText}
        </div>
        <span className="text-lg font-bold tracking-tight">{wordmark}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDetailsClick}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
        >
          {detailsLabel}
        </button>
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-200 sm:inline-flex"
        >
          {linkLabel}
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}
