/**
 * Recipient-side observer attribution banner (screens/room.md).
 * Renders at the top of the negotiation room when accessed via an observer share token.
 *
 * Reminds delegates and venue owners that they have read-only observer access.
 */
export function ShareRecipientBanner({ sharedByName }: { sharedByName?: string | null }) {
  return (
    <div className="border-b border-border-subtle bg-surface-raised px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3 text-[13px]">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </span>
        <p className="text-content-muted">
          <strong className="font-semibold text-content">{sharedByName ?? "The organizer"}</strong>{" "}
          shared this negotiation room with you. You have read-only observer access.
        </p>
      </div>
    </div>
  );
}
