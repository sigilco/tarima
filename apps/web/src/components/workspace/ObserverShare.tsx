import { useState } from "react";
import * as m from "#/paraglide/messages.js";

import { createObserverLink, revokeObserverLink, type ObserverLinkWire } from "../../lib/api";
import { Button } from "../ui/button";

/**
 * The "share read-only link" control on the project view. One click
 * mints (or re-fetches, the endpoint is idempotent) the project's
 * observer link, copies the URL, and shows it with its expiry and a
 * revoke action. Everything happens on click — no mount fetch, so a
 * project the user never shares costs nothing.
 */
export function ObserverShare({ projectId }: { projectId: string }) {
  const [link, setLink] = useState<ObserverLinkWire | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const { link: minted } = await createObserverLink(projectId);
      setLink(minted);
      await navigator.clipboard.writeText(minted.shareUrl).catch(() => {});
      setCopied(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (busy) return;
    setBusy(true);
    try {
      await revokeObserverLink(projectId);
      setLink(null);
      setCopied(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!link) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => void share()} disabled={busy}>
          {m["workspace.shareLink"]()}
        </Button>
        {failed ? (
          <span className="text-[12px] text-destructive">{m["errors.offline"]()}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
      <span className="rounded-md bg-muted px-2 py-0.5">{m["workspace.shareActive"]()}</span>
      <button
        type="button"
        onClick={() => void share()}
        className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {copied ? m["workspace.shareCopied"]() : m["workspace.shareCopy"]()}
      </button>
      {link.expiresAt ? (
        <span>
          {m["workspace.shareExpires"]({
            date: new Date(link.expiresAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
          })}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void revoke()}
        disabled={busy}
        className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {m["workspace.shareRevoke"]()}
      </button>
      {failed ? <span className="text-destructive">{m["errors.offline"]()}</span> : null}
    </span>
  );
}
