import { useState } from "react";
import * as m from "../paraglide/messages.js";
import { BriefForm } from "./BriefForm";
import { briefToForm, parseBriefForm, type BriefFormValues } from "../lib/brief";
import { candidateRows, draftPreview, shortlistSelection, type StageUiState } from "../lib/stage";
import type { BoardRow } from "../lib/board";
import type { DraftWire } from "../lib/api";
import type { Brief } from "@tarima/contract";

/**
 * The stage banner (stream: integration, web side).
 *
 * It shows where the project stands and, when a gate is pending, the
 * decision the user has to take:
 *   - the spec gate: the stored brief, read-only, with an edit toggle;
 *   - the shortlist gate: the curated candidates with checkboxes;
 *   - the send gate: the staged drafts, with the explicit note that
 *     nothing has been sent yet.
 *
 * The banner holds no api calls of its own: it renders the state and
 * reports the decision, and the board route does the request.
 */

/** The label of a stage, kept out of the template string so the paraglide
 * keys stay statically typed. */
const STAGE_LABEL: Record<string, () => string> = {
  brief: () => m["stage.brief"](),
  spec_review: () => m["stage.spec_review"](),
  curating: () => m["stage.curating"](),
  shortlist_review: () => m["stage.shortlist_review"](),
  send_review: () => m["stage.send_review"](),
  running: () => m["stage.running"](),
  done: () => m["stage.done"](),
};

function stageLabel(stage: string): string {
  return STAGE_LABEL[stage]?.() ?? stage;
}

export interface StageBannerProps {
  ui: StageUiState;
  brief?: Brief;
  candidates: readonly BoardRow[];
  drafts: readonly DraftWire[];
  busy: boolean;
  notice: string | null;
  onSubmitBrief: () => void;
  onCurate: () => void;
  onDecide: (
    decision: "approve" | "reject",
    extra?: { brief?: Brief; entityIds?: string[] },
  ) => void;
}

export function StageBanner({
  ui,
  brief,
  candidates,
  drafts,
  busy,
  notice,
  onSubmitBrief,
  onCurate,
  onDecide,
}: StageBannerProps) {
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState<BriefFormValues>(
    brief
      ? briefToForm(brief)
      : {
          eventType: "",
          city: "",
          date: "",
          headcount: "",
          budgetAmount: "",
          currency: "EUR",
          notes: "",
        },
  );
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // The shortlist selection defaults to every candidate checked. The
  // selection is recomputed from the candidate list until the user
  // touches it, so a candidate that appears later is checked too.
  const effectiveChecked = selectionTouched
    ? checked
    : new Set(candidateRows(candidates).map((row) => row.id));

  function toggleCandidate(id: string) {
    setSelectionTouched(true);
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDraft(entityId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  }

  function confirmSpec() {
    const parsed = parseBriefForm(formValues);
    if (!parsed) {
      setError(m["brief.invalid"]());
      return;
    }
    setError(null);
    onDecide("approve", { brief: parsed });
  }

  const candidatesForGate = candidateRows(candidates);
  const selectedIds = shortlistSelection(candidatesForGate, effectiveChecked);

  return (
    <section
      data-testid="stage-banner"
      className="mt-5 rounded-2xl border border-border-subtle bg-surface-raised p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-content-faint">
            {m["stage.label"]()}
          </span>
          <span
            data-testid="stage-value"
            className="rounded-full bg-surface px-3 py-1 text-[12.5px] font-medium text-content ring-1 ring-border-subtle"
          >
            {stageLabel(ui.stage)}
          </span>
        </div>

        {ui.action === "submitBrief" ? (
          <button
            type="button"
            disabled={busy}
            data-testid="submit-brief"
            onClick={onSubmitBrief}
            className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? m["stage.submittingBrief"]() : m["stage.submitBrief"]()}
          </button>
        ) : null}

        {ui.action === "curate" ? (
          <button
            type="button"
            disabled={busy}
            data-testid="find-venues"
            onClick={onCurate}
            className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? m["stage.findingVenues"]() : m["stage.findVenues"]()}
          </button>
        ) : null}
      </div>

      {ui.action === "submitBrief" && !brief ? (
        <p className="mt-3 text-[13px] text-content-muted">{m["stage.noBrief"]()}</p>
      ) : null}

      {ui.action === "curate" && candidatesForGate.length === 0 ? (
        <p className="mt-3 text-[13px] text-content-muted" data-testid="no-candidates">
          {m["stage.noCandidates"]()}
        </p>
      ) : null}

      {ui.action === "spec" ? (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <h2 className="font-display text-xl leading-tight text-content">
            {m["stage.gateSpec"]()}
          </h2>
          <p className="mt-1.5 text-[13px] text-content-muted">{m["stage.gateSpecHint"]()}</p>

          {!brief ? (
            <p className="mt-3 text-[13px] text-content-muted" data-testid="no-brief">
              {m["stage.noBriefAtGate"]()}
            </p>
          ) : null}

          {editing ? (
            <div className="mt-4">
              <BriefForm values={formValues} onChange={setFormValues} />
              {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  data-testid="confirm-spec"
                  onClick={confirmSpec}
                  className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface disabled:opacity-60"
                >
                  {busy ? m["stage.working"]() : m["stage.confirmSpec"]()}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                    if (brief) setFormValues(briefToForm(brief));
                  }}
                  className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content disabled:opacity-60"
                >
                  {m["stage.cancelEdit"]()}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <BriefField label={m["brief.eventType"]()} value={brief?.eventType} />
                <BriefField label={m["brief.city"]()} value={brief?.city} />
                <BriefField label={m["brief.date"]()} value={brief?.date} />
                <BriefField label={m["brief.headcount"]()} value={brief?.headcount?.toString()} />
                <BriefField
                  label={m["brief.budget"]()}
                  value={
                    brief
                      ? `${brief.currency} ${brief.budgetAmount.toLocaleString("en-GB")}`
                      : undefined
                  }
                />
                <BriefField label={m["brief.notes"]()} value={brief?.notes} wide />
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  data-testid="confirm-spec"
                  onClick={() => onDecide("approve")}
                  className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface disabled:opacity-60"
                >
                  {busy ? m["stage.working"]() : m["stage.confirmSpec"]()}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="reject-spec"
                  onClick={() => onDecide("reject")}
                  className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content disabled:opacity-60"
                >
                  {m["stage.reject"]()}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setError(null);
                  }}
                  data-testid="edit-spec"
                  className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content"
                >
                  {m["stage.editBrief"]()}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {ui.action === "shortlist" ? (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <h2 className="font-display text-xl leading-tight text-content">
            {m["stage.gateShortlist"]()}
          </h2>
          <p className="mt-1.5 text-[13px] text-content-muted">{m["stage.gateShortlistHint"]()}</p>

          {candidatesForGate.length === 0 ? (
            <p className="mt-4 text-[13px] text-content-muted" data-testid="no-candidates">
              {m["stage.noCandidates"]()}
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-1.5">
                {candidatesForGate.map((row) => (
                  <li key={row.id}>
                    <label className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-[14px] text-content">
                      <input
                        type="checkbox"
                        checked={effectiveChecked.has(row.id)}
                        onChange={() => toggleCandidate(row.id)}
                        aria-label={row.name}
                        className="h-4 w-4 accent-[color:var(--color-content)]"
                      />
                      <span className="font-medium">{row.name}</span>
                      <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-0.5 text-[11.5px] text-accent-strong">
                        {m["stage.candidate"]()}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-content-faint">
                {m["stage.shortlistSelected"]({
                  count: String(selectedIds.length),
                  total: String(candidatesForGate.length),
                })}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || selectedIds.length === 0}
              data-testid="approve-shortlist"
              onClick={() => onDecide("approve", { entityIds: selectedIds })}
              className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface disabled:opacity-60"
            >
              {busy ? m["stage.working"]() : m["stage.approveShortlist"]()}
            </button>
            <button
              type="button"
              disabled={busy}
              data-testid="reject-shortlist"
              onClick={() => onDecide("reject")}
              className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content disabled:opacity-60"
            >
              {m["stage.reject"]()}
            </button>
          </div>
        </div>
      ) : null}

      {ui.action === "send" ? (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <h2 className="font-display text-xl leading-tight text-content">
            {m["stage.gateSend"]()}
          </h2>
          <p className="mt-1.5 text-[13px] text-content-muted">{m["stage.gateSendHint"]()}</p>

          {drafts.length > 0 ? (
            <p className="mt-1 text-[12.5px] text-content-faint">
              {m["stage.drafts"]({ count: String(drafts.length) })}
            </p>
          ) : null}

          {drafts.length === 0 ? (
            <p className="mt-4 text-[13px] text-content-muted" data-testid="no-drafts">
              {m["stage.noDrafts"]()}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {drafts.map((draft) => (
                <li
                  key={`${draft.entityId}-${draft.subject}`}
                  className="rounded-xl bg-surface p-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[13.5px] font-medium text-content">
                      {draft.entityName}
                    </span>
                    <span className="text-[12.5px] text-content-muted">{draft.to}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] text-content">{draft.subject}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-content-muted">
                    {draftPreview(draft.body)}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleDraft(draft.entityId)}
                    className="mt-1.5 text-[12px] text-content-faint underline underline-offset-2"
                  >
                    {expanded.has(draft.entityId)
                      ? m["stage.collapseDraft"]()
                      : m["stage.expandDraft"]()}
                  </button>
                  {expanded.has(draft.entityId) ? (
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-[12.5px] leading-relaxed text-content">
                      {draft.body}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || drafts.length === 0}
              data-testid="send-all"
              onClick={() => onDecide("approve")}
              className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface disabled:opacity-60"
            >
              {busy ? m["stage.working"]() : m["stage.sendAll"]()}
            </button>
            <button
              type="button"
              disabled={busy}
              data-testid="cancel-send"
              onClick={() => onDecide("reject")}
              className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content disabled:opacity-60"
            >
              {m["stage.cancelSend"]()}
            </button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="mt-3 text-[13px] text-content-muted" data-testid="stage-notice">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

/** One read-only field of the brief. */
function BriefField({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | undefined;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-content">{value ?? m["board.noMissing"]()}</dd>
    </div>
  );
}
