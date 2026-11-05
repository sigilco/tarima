/**
 * One tool call chip inside an assistant turn (screen chat-1,
 * chat-with-tools). Built on the AI Elements Tool header's badge
 * language, adapted to eve's EveToolPart states.
 */
import { Badge } from "#/components/ui/badge.tsx";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { EveToolPart } from "eve/react";
import { useState } from "react";

const STATE_ICON: Record<EveToolPart["state"], React.ReactNode> = {
  streaming: <CircleIcon className="size-3.5" />,
  requested: <ClockIcon className="size-3.5" />,
  approval: <ClockIcon className="size-3.5 animate-pulse text-yellow-600" />,
  running: <ClockIcon className="size-3.5 animate-pulse" />,
  blocked: <ClockIcon className="size-3.5" />,
  completed: <CheckCircleIcon className="size-3.5 text-green-600" />,
  failed: <XCircleIcon className="size-3.5 text-red-600" />,
  rejected: <XCircleIcon className="size-3.5 text-orange-600" />,
  cancelled: <XCircleIcon className="size-3.5" />,
};

export function ChatToolChip({ part }: { part: EveToolPart }) {
  const [open, setOpen] = useState(false);
  const detail = part.state === "streaming" ? part.inputText : JSON.stringify(part.input);
  const output = part.output === undefined ? undefined : JSON.stringify(part.output, null, 2);
  const showDetail = Boolean(detail || output);

  return (
    <div className="rounded-lg border border-border bg-muted/40 text-xs">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => showDetail && setOpen((prev) => !prev)}
        disabled={!showDetail}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <WrenchIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{part.label || part.name}</span>
          <Badge variant="secondary" className="gap-1 rounded-full px-2 py-0">
            {STATE_ICON[part.state]}
            <span>{part.state}</span>
          </Badge>
        </span>
        {showDetail ? <ChevronDownIcon className="size-3.5 text-muted-foreground" /> : null}
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border px-3 py-2">
          {detail ? <pre className="overflow-x-auto whitespace-pre-wrap">{detail}</pre> : null}
          {output ? <pre className="overflow-x-auto whitespace-pre-wrap">{output}</pre> : null}
          {part.error ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-destructive">
              {JSON.stringify(part.error)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
