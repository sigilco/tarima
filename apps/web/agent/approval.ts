/**
 * The agent-wide approval policy seam (plan D8/SP8 dependency).
 *
 * eve supports ONE policy per agent (`defineAgent({ approval })`) that
 * runs beside every tool's own `approval`; the stricter status wins, so
 * the policy can only ADD a gate. This module is the single place the
 * rule lives; it is wired into `agent.ts`.
 *
 * The rule (deliberate, documented):
 * - READ-ONLY tools never prompt. `get_project_context`, `list_venues`,
 *   `list_sponsors` must return instantly — the chat panel would stall
 *   on a human gate for a pure read.
 * - OUTBOUND tools always need a person: any name starting with
 *   `send_`, `outbound_`, `post_`, `email_`, `whatsapp_`, `telegram_`.
 *   These reach the outside world (SP8's family), so eve must suspend
 *   the turn and open an approval interaction.
 * - EVERYTHING ELSE (`update_task` included) stays ungated here.
 *   `update_task` is an internal board write, visible and reversible in
 *   the UI; gating it would prompt on every routine move. A tool that
 *   wants a gate opts itself in with `approval: always()` from
 *   `eve/tools/approval` — the entry's own approval stacks with this
 *   policy (stricter wins).
 */
import type { ApprovalPolicy } from "eve";

const READ_ONLY_TOOLS = new Set(["get_project_context", "list_venues", "list_sponsors"]);

const OUTBOUND_PREFIXES = ["send_", "outbound_", "post_", "email_", "whatsapp_", "telegram_"];

export const agentApprovalPolicy: ApprovalPolicy = ({ toolName }) => {
  if (READ_ONLY_TOOLS.has(toolName)) return "not-applicable";
  if (OUTBOUND_PREFIXES.some((p) => toolName.startsWith(p))) return "user-approval";
  return "not-applicable";
};
