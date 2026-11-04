import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type {
  NegotiationStatus,
  RoomIncoming,
  RoomOutgoing,
  RoomOutgoingSnapshot,
  RoomSnapshot,
} from "@tarima/contract";
import { roomWsUrl, sendNegotiationCounter } from "../lib/api";
import { ShareRecipientBanner } from "./ShareRecipientBanner";
import { ShareRoomModal } from "./ShareRoomModal";

interface NegotiationRoomViewProps {
  projectId: string;
  projectName?: string;
  shareToken?: string;
  initialRole?: "owner" | "organizer" | "observer";
}

function statusBadgeClasses(status: NegotiationStatus): {
  badge: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case "requires_approval":
      return {
        badge: "bg-amber-soft text-amber-w border-amber-w/20",
        dot: "bg-amber-w",
        label: "Requires Approval",
      };
    case "counter_proposed":
      return {
        badge: "bg-accent-soft text-accent border-accent/20",
        dot: "bg-accent",
        label: "Counter Staged",
      };
    case "sent":
      return {
        badge: "bg-sage-soft text-sage border-sage/20",
        dot: "bg-sage",
        label: "Counter Sent",
      };
    case "revising":
      return {
        badge: "bg-clay-soft text-clay border-clay/20",
        dot: "bg-clay",
        label: "Revising Draft",
      };
    case "accepted":
      return {
        badge: "bg-sage-soft text-sage border-sage/20",
        dot: "bg-sage",
        label: "Vendor Accepted",
      };
    case "rejected":
      return {
        badge: "bg-danger/10 text-danger border-danger/20",
        dot: "bg-danger",
        label: "Declined",
      };
    case "pending_audit":
    default:
      return {
        badge: "bg-surface-raised text-content-faint border-border-subtle",
        dot: "bg-content-faint",
        label: "Pending Audit",
      };
  }
}

export function NegotiationRoomView({
  projectId,
  projectName,
  shareToken,
  initialRole,
}: NegotiationRoomViewProps) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [liveState, setLiveState] = useState<"connecting" | "live" | "down">("connecting");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sendingNegotiationId, setSendingNegotiationId] = useState<string | null>(null);

  // Per-negotiation comment input state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});

  const isObserver = Boolean(shareToken || initialRole === "observer");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // WebSocket connection with exponential backoff reconnect (capped at ~15s)
  useEffect(() => {
    isMountedRef.current = true;

    function connect() {
      if (!isMountedRef.current) return;
      setLiveState("connecting");

      const url = roomWsUrl(projectId, shareToken);
      if (!url) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setLiveState("live");
        reconnectDelayRef.current = 1000; // Reset backoff on success
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data) as RoomOutgoing;
          if (parsed.type === "snapshot") {
            const snapMsg = parsed as RoomOutgoingSnapshot;
            const nextSnap = snapMsg.snapshot ?? snapMsg.state ?? snapMsg;
            setSnapshot(nextSnap);
          } else if (parsed.type === "toast") {
            setToastMessage(parsed.message);
            setTimeout(() => {
              if (isMountedRef.current) setToastMessage(null);
            }, 4000);
          }
        } catch {
          // Ignore parsing failure
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setLiveState("down");
        const nextDelay = Math.min(reconnectDelayRef.current * 2, 15000);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = nextDelay;
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        ws.close();
      };
    }

    connect();

    // Heartbeat ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      }
    }, 25000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [projectId, shareToken]);

  function sendWsFrame(frame: RoomIncoming) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(frame));
    }
  }

  function handleApprove(negotiationId: string) {
    if (isObserver) return;
    sendWsFrame({ type: "approve", proposalId: negotiationId });
  }

  function handleCommentSubmit(negotiationId: string) {
    if (isObserver) return;
    const text = (commentInputs[negotiationId] ?? "").trim();
    if (!text) return;
    sendWsFrame({ type: "comment", proposalId: negotiationId, text });
    setCommentInputs((prev) => ({ ...prev, [negotiationId]: "" }));
    setCommentOpen((prev) => ({ ...prev, [negotiationId]: false }));
  }

  function handleReject(negotiationId: string) {
    if (isObserver) return;
    const reason = window.prompt("Reason for declining this venue proposal (optional):");
    if (reason === null) return; // User cancelled prompt
    sendWsFrame({
      type: "reject",
      proposalId: negotiationId,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
  }

  async function handleSendCounter(negotiationId: string) {
    if (isObserver) return;
    setSendingNegotiationId(negotiationId);
    try {
      await sendNegotiationCounter(projectId, negotiationId);
    } catch {
      setToastMessage("Failed to dispatch counter proposal. Please try again.");
    } finally {
      setSendingNegotiationId(null);
    }
  }

  const specs = snapshot?.specs;
  const negotiations = snapshot?.negotiations ?? snapshot?.proposals ?? [];
  const activity = snapshot?.activity ?? [];

  return (
    <div className="min-h-screen bg-surface">
      {/* Toast alert banner */}
      {toastMessage ? (
        <div className="fixed top-4 right-4 z-50 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 shadow-lg">
          <p className="text-[13px] font-medium text-content">{toastMessage}</p>
        </div>
      ) : null}

      {/* Observer link banner */}
      {isObserver ? <ShareRecipientBanner /> : null}

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Navigation & Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2 text-[13px] text-content-muted">
              {!isObserver ? (
                <>
                  <Link
                    to="/app/p/$projectId"
                    params={{ projectId }}
                    search={{ filter: undefined, row: undefined, csv: undefined, add: undefined }}
                    className="transition-colors hover:text-content"
                  >
                    Board
                  </Link>
                  <span>/</span>
                </>
              ) : null}
              <span>Negotiation Room</span>
            </div>
            <h1 className="mt-1 font-display text-3xl text-content">
              {specs?.eventName ?? projectName ?? "Negotiation Room"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Socket Status */}
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-[12px] font-medium ${
                liveState === "live"
                  ? "text-sage"
                  : liveState === "down"
                    ? "text-danger"
                    : "text-content-faint"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  liveState === "live"
                    ? "bg-sage"
                    : liveState === "down"
                      ? "bg-danger"
                      : "bg-content-faint animate-pulse"
                }`}
              />
              {liveState === "live" ? "Live" : liveState === "down" ? "Reconnecting" : "Connecting"}
            </span>

            {/* Role Banner */}
            {isObserver ? (
              <span className="rounded-full border border-border-subtle bg-surface-raised px-3 py-1 text-[12px] font-medium text-content-muted">
                Read-only observer
              </span>
            ) : (
              <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent">
                Organizer owner
              </span>
            )}

            {!isObserver ? (
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-[12px] font-medium text-content transition-colors hover:bg-surface-raised"
              >
                Share room
              </button>
            ) : null}
          </div>
        </header>

        {/* Specs Header Bar */}
        {specs ? (
          <section
            aria-label="Target Event Specifications"
            className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-5"
          >
            <h2 className="text-[12px] font-semibold tracking-wide text-content-faint uppercase">
              Target Event Specifications
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-[13px]">
              <div>
                <span className="block text-content-faint">Event</span>
                <span className="font-medium text-content">{specs.eventName}</span>
              </div>
              <div>
                <span className="block text-content-faint">Date</span>
                <span className="font-medium text-content">{specs.targetDate}</span>
              </div>
              <div>
                <span className="block text-content-faint">Attendees</span>
                <span className="font-medium text-content">{specs.guestCount} guests</span>
              </div>
              <div>
                <span className="block text-content-faint">Target Budget</span>
                <span className="font-medium text-content">
                  €{specs.maxBudget.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-content-faint">Required Curfew</span>
                <span className="font-medium text-content">{specs.requiredCurfew ?? "None"}</span>
              </div>
              <div>
                <span className="block text-content-faint">AV Services</span>
                <span className="font-medium text-content">
                  {specs.avRequired ? "Required" : "Optional"}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {/* Main Content Grid: Negotiation Cards + Activity Feed */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Negotiations List (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-content">
                Venues under Negotiation ({negotiations.length})
              </h2>
            </div>

            {negotiations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-content-muted">
                <p className="text-[14px]">No active negotiations yet for this project.</p>
              </div>
            ) : (
              negotiations.map((neg) => {
                const badge = statusBadgeClasses(neg.status);
                const costDelta =
                  specs && typeof neg.quotedCost === "number"
                    ? neg.quotedCost - specs.maxBudget
                    : null;
                const capacityDelta =
                  specs && typeof neg.quotedCapacity === "number"
                    ? neg.quotedCapacity - specs.guestCount
                    : null;

                const isCommentBoxOpen = commentOpen[neg.id] ?? false;
                const commentText = commentInputs[neg.id] ?? "";

                return (
                  <article
                    key={neg.id}
                    className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised transition-shadow hover:shadow-sm"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5">
                      <div>
                        <h3 className="font-display text-xl text-content">{neg.name}</h3>
                        {neg.revision ? (
                          <span className="text-[12px] text-content-faint">
                            Revision round {neg.revision}
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium ${badge.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Terms vs Spec deltas */}
                      <div>
                        <h4 className="text-[12px] font-semibold tracking-wide text-content-faint uppercase">
                          Quoted Terms vs Target
                        </h4>
                        <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border-subtle bg-surface p-3.5 text-[13px]">
                          <div>
                            <span className="block text-content-faint">Cost</span>
                            <span className="font-medium text-content">
                              €{neg.quotedCost?.toLocaleString() ?? "TBD"}
                            </span>
                            {costDelta !== null ? (
                              <span
                                className={`block text-[11px] font-medium ${
                                  costDelta > 0 ? "text-clay" : "text-sage"
                                }`}
                              >
                                {costDelta > 0
                                  ? `+€${costDelta.toLocaleString()} over target`
                                  : `${costDelta.toLocaleString()} under target`}
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <span className="block text-content-faint">Capacity</span>
                            <span className="font-medium text-content">
                              {neg.quotedCapacity ?? "TBD"} guests
                            </span>
                            {capacityDelta !== null && capacityDelta < 0 ? (
                              <span className="block text-[11px] font-medium text-clay">
                                {capacityDelta} seats below target
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <span className="block text-content-faint">Curfew</span>
                            <span className="font-medium text-content">
                              {neg.quotedCurfew ?? "Standard"}
                            </span>
                          </div>

                          <div>
                            <span className="block text-content-faint">AV Included</span>
                            <span className="font-medium text-content">
                              {neg.avIncluded ? "Included" : "Extra fee"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Audit Violations */}
                      {neg.audit?.violations && neg.audit.violations.length > 0 ? (
                        <div className="rounded-xl border border-amber-w/20 bg-amber-soft/50 p-3.5">
                          <h4 className="text-[12px] font-semibold text-amber-w">
                            Audit Discrepancies
                          </h4>
                          <ul className="mt-1.5 space-y-1 text-[12px] text-content-muted list-disc list-inside">
                            {neg.audit.violations.map((v, idx) => (
                              <li key={idx}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* Draft Counter Proposal */}
                      {neg.audit?.draftCounterProposal ? (
                        <div className="rounded-xl border border-border-subtle bg-surface p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[12px] font-semibold tracking-wide text-content-faint uppercase">
                              Draft Counter Proposal
                            </h4>
                            <span className="text-[11px] text-content-faint">Automated draft</span>
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-content">
                            {neg.audit.draftCounterProposal}
                          </p>
                        </div>
                      ) : null}

                      {/* Feedback Thread */}
                      {neg.feedback && neg.feedback.length > 0 ? (
                        <div className="border-t border-border-subtle pt-4">
                          <h4 className="text-[12px] font-semibold tracking-wide text-content-faint uppercase">
                            Feedback History
                          </h4>
                          <div className="mt-2.5 space-y-2">
                            {neg.feedback.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-border-subtle bg-surface p-3 text-[12px]"
                              >
                                <div className="flex items-center justify-between text-content-faint">
                                  <span className="font-medium capitalize text-content-muted">
                                    {item.by} ({item.kind})
                                  </span>
                                  <span>
                                    {new Date(item.at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="mt-1 text-content">{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Comment Form Input */}
                      {isCommentBoxOpen && !isObserver ? (
                        <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
                          <label
                            htmlFor={`comment-${neg.id}`}
                            className="block text-[12px] font-medium text-content"
                          >
                            Add revision note or guidance:
                          </label>
                          <textarea
                            id={`comment-${neg.id}`}
                            rows={2}
                            value={commentText}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [neg.id]: e.target.value }))
                            }
                            placeholder="Provide specific feedback or constraints..."
                            className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-raised p-2 text-[13px] text-content placeholder:text-content-faint focus:outline-none"
                          />
                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCommentOpen((prev) => ({ ...prev, [neg.id]: false }))
                              }
                              className="rounded-full px-3 py-1 text-[12px] font-medium text-content-muted hover:text-content"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!commentText.trim()}
                              onClick={() => handleCommentSubmit(neg.id)}
                              className="rounded-full bg-content px-4 py-1 text-[12px] font-medium text-surface transition-opacity disabled:opacity-40"
                            >
                              Send Feedback
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                        <div className="flex items-center gap-2">
                          {!isCommentBoxOpen &&
                          neg.status !== "rejected" &&
                          neg.status !== "accepted" ? (
                            <button
                              type="button"
                              disabled={isObserver}
                              title={isObserver ? "Read-only observer view" : undefined}
                              onClick={() =>
                                setCommentOpen((prev) => ({ ...prev, [neg.id]: true }))
                              }
                              className="rounded-full border border-border-subtle px-3.5 py-1.5 text-[12px] font-medium text-content transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Comment
                            </button>
                          ) : null}

                          {neg.status !== "rejected" && neg.status !== "accepted" ? (
                            <button
                              type="button"
                              disabled={isObserver}
                              title={isObserver ? "Read-only observer view" : undefined}
                              onClick={() => handleReject(neg.id)}
                              className="rounded-full border border-danger/20 px-3.5 py-1.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Decline Venue
                            </button>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          {neg.status === "requires_approval" ? (
                            <button
                              type="button"
                              disabled={isObserver}
                              title={isObserver ? "Read-only observer view" : undefined}
                              onClick={() => handleApprove(neg.id)}
                              className="rounded-full bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Approve Counter
                            </button>
                          ) : null}

                          {neg.status === "counter_proposed" ? (
                            <button
                              type="button"
                              disabled={isObserver || sendingNegotiationId === neg.id}
                              title={isObserver ? "Read-only observer view" : undefined}
                              onClick={() => handleSendCounter(neg.id)}
                              className="rounded-full bg-sage px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sendingNegotiationId === neg.id
                                ? "Dispatching..."
                                : "Dispatch Counter to Vendor"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Activity Feed Sidebar (1 Col) */}
          <aside className="space-y-4">
            <h2 className="text-[15px] font-semibold text-content">Activity Feed</h2>
            <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5">
              {activity.length === 0 ? (
                <p className="text-[13px] text-content-faint">No events logged yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border-subtle ml-2 pl-4 text-[12px]">
                  {activity.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-border-subtle" />
                      <div className="flex items-center justify-between text-content-faint">
                        <span className="font-semibold capitalize text-content-muted">
                          {event.actor}
                        </span>
                        <span>
                          {new Date(event.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-content leading-relaxed">{event.message}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </div>

      {shareModalOpen ? (
        <ShareRoomModal projectId={projectId} onClose={() => setShareModalOpen(false)} />
      ) : null}
    </div>
  );
}
