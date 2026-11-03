import { useEffect, useState } from "react";
import { mintRoomLink, revokeRoomLink } from "../lib/api";

export function ShareRoomModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    void mintRoomLink(projectId)
      .then((res) => {
        if (!cancelled) setUrl(res.shareUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Could not create share link. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleRevoke() {
    setBusy(true);
    try {
      await revokeRoomLink(projectId);
      setUrl(null);
      // Immediately remint a fresh link or notify
      const fresh = await mintRoomLink(projectId);
      setUrl(fresh.shareUrl);
    } catch {
      setError("Could not revoke link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-content/25 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share negotiation room"
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-content">
            Share negotiation room
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-content-muted transition-colors hover:text-content"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-content-muted">
          Anyone with this link can observe this negotiation room in real time. Observers cannot
          edit, approve or reject counter-offers. Links expire after 7 days.
        </p>

        {error ? <p className="mt-4 text-[13px] text-danger">{error}</p> : null}

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url ?? (busy ? "Generating link..." : "")}
              className="min-w-0 flex-1 rounded-full border border-border-subtle bg-surface-raised px-4 py-2.5 text-[13px] text-content focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              disabled={!url || busy}
              onClick={() => {
                if (!url) return;
                void navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="shrink-0 rounded-full bg-content px-5 py-2.5 text-[13px] font-medium text-surface transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={!url || busy}
              onClick={handleRevoke}
              className="text-[12px] text-content-faint underline transition-colors hover:text-danger disabled:opacity-50"
            >
              Revoke and generate new link
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
