const WEB_APP_TEMPLATE_FILES={"app/_components/agent-chat.tsx":`"use client";

import { ClientError, type MessagePart } from "eve/client";
import {
  activeTurn,
  activity,
  failure,
  interaction,
  interactions,
  turns,
  type Activity,
} from "eve/events";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon, BrainIcon, PlusIcon, SquareIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationTopFade,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import { WEB_CHAT_AGENT } from "@/app/eve-agent";

const DEFAULT_AGENT_NAME = "__EVE_INIT_APP_NAME__";
const AGENT_NAME = WEB_CHAT_AGENT ?? DEFAULT_AGENT_NAME;

export function AgentChat({
  sessionId,
  sessionless = false,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const [cancellationError, setCancellationError] = useState<string>();
  const [hasInputText, setHasInputText] = useState(false);
  const hasSubmittedMessage = useRef(false);
  const replaceSessionRoute = (nextSessionId: string) => {
    if (sessionId !== undefined) return;
    // Framework routers (Next.js, TanStack Router) patch window.history; navigating
    // through them would remount this route and detach the active stream.
    History.prototype.replaceState.call(
      window.history,
      window.history.state,
      "",
      \`/s/\${encodeURIComponent(nextSessionId)}\`,
    );
  };
  const agent = useEveAgent({
    agent: WEB_CHAT_AGENT,
    prewarm: hasInputText,
    initialSession:
      sessionId === undefined
        ? undefined
        : {
            sessionId,
            streamIndex: 0,
          },
    resume: sessionId !== undefined,
    onSessionChange(session) {
      if (hasSubmittedMessage.current && session !== undefined) {
        replaceSessionRoute(session.sessionId);
      }
    },
  });

  const isBusy = agent.status === "busy";
  // A turn waiting on a person is open while the store is idle; it still takes steering and Stop.
  const turnOpen = activeTurn(agent.view) !== undefined;
  const isResuming = agent.status === "resuming";
  const isEmpty = agent.messages.length === 0;
  const lastMessage = agent.messages.at(-1);
  const isPendingAssistantShell =
    lastMessage?.role === "assistant" && lastMessage.parts.length === 0;
  const now = activity(agent.view);
  // Show what the agent is doing until its message has something to show, unless it waits on you.
  const showPendingThinking =
    isBusy &&
    now.kind !== "waiting-on-interaction" &&
    (lastMessage?.role !== "assistant" || isPendingAssistantShell);
  const failed =
    isBusy || isResuming ? undefined : failure(agent.view, turns(agent.view).at(-1)?.turnId);
  const turnFailure =
    failed?.code === "MODEL_CALL_FAILED"
      ? "The model is temporarily unavailable. Please try again."
      : failed?.message;
  const errorMessage = cancellationError ?? agent.error?.message ?? turnFailure;
  const hasConversationContent = sessionless || !isEmpty || errorMessage !== undefined;
  const showConversationLayout = isResuming || hasConversationContent;
  const activeSessionId = sessionId ?? agent.session?.sessionId;
  // A session that ended outside eve never settles its requests, so they stay open, yet it
  // accepts no answer. Once the server says so, stop offering them.
  const sessionEnded =
    agent.error instanceof ClientError && agent.error.code === "session_not_active";
  // Answers are accepted while work runs; the server's settlement closes each request.
  const canRespond = (interactionId: string) =>
    !isResuming && !sessionEnded && interaction(agent.view, interactionId)?.status === "open";
  // A tool call can ask several questions at once, and its message part holds only the latest.
  const questionsFor = (callId: string) =>
    interactions(agent.view).filter(
      (input) => input.request.kind === "question" && input.call?.callId === callId,
    );

  const requestCancellation = () => {
    setCancellationError(undefined);
    void agent.cancel().catch((error: unknown) => {
      setCancellationError(toErrorMessage(error));
    });
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isResuming) return;

    setHasInputText(false);
    setCancellationError(undefined);
    hasSubmittedMessage.current = true;
    if (agent.session !== undefined) replaceSessionRoute(agent.session.sessionId);
    const options = turnOpen ? { turnPolicy: "steer" as const } : undefined;

    if (message.files.length === 0) {
      await agent.send(text, options);
      return;
    }

    const parts: MessagePart[] = [];
    if (text.length > 0) {
      parts.push({ text, type: "text" });
    }
    for (const file of message.files) {
      parts.push({
        data: file.url,
        filename: file.filename,
        mediaType: file.mediaType,
        type: "file",
      });
    }

    await agent.send(parts, options);
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        disabled={isResuming}
        onChange={(event) => setHasInputText(event.currentTarget.value.trim().length > 0)}
        placeholder="Send a message…"
      />
      <ComposerAction
        hasInputText={hasInputText}
        canCancel={turnOpen}
        isResuming={isResuming}
        onCancel={requestCancellation}
      />
    </PromptInput>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {showConversationLayout ? (
        <ChatHeader canStartNewChat={activeSessionId !== undefined} />
      ) : null}

      {showConversationLayout ? (
        <Conversation
          className="min-h-0 flex-1"
          initial={sessionId === undefined ? undefined : false}
          resize={activeSessionId === undefined ? "smooth" : "instant"}
          scrollRestorationKey={
            isEmpty || activeSessionId === undefined
              ? undefined
              : \`eve:web-chat-scroll:\${activeSessionId}\`
          }
        >
          <ConversationTopFade className="top-14" />
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 pt-20 pb-36 sm:px-6">
            {agent.messages.map((message) =>
              showPendingThinking &&
              isPendingAssistantShell &&
              message.id === lastMessage.id ? null : (
                <AgentMessage
                  canRespond={canRespond}
                  key={message.id}
                  message={message}
                  questionsFor={questionsFor}
                  view={agent.view}
                  onAnswers={async (answers) => {
                    setCancellationError(undefined);
                    await agent.respond(answers).catch((cause: unknown) => {
                      setCancellationError(
                        cause instanceof Error ? cause.message : "Unable to submit the answer.",
                      );
                    });
                  }}
                />
              ),
            )}
            {showPendingThinking ? <PendingActivity activity={now} /> : null}
            {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      ) : null}

      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          showConversationLayout
            ? "fixed bottom-0 left-1/2 z-20 max-w-3xl -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6"
            : "flex max-w-xl flex-1 flex-col items-center justify-center gap-8 pb-[10vh]",
        )}
      >
        {showConversationLayout ? null : (
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-medium text-5xl tracking-tighter">{AGENT_NAME}</h1>
          </div>
        )}
        <div className="w-full">{composer}</div>
      </div>
    </main>
  );
}

function ComposerAction({
  hasInputText,
  canCancel,
  isResuming,
  onCancel,
}: {
  readonly hasInputText: boolean;
  readonly canCancel: boolean;
  readonly isResuming: boolean;
  readonly onCancel: () => void;
}) {
  const attachments = usePromptInputAttachments();
  const canSubmit = hasInputText || attachments.files.length > 0;

  if (!canCancel || canSubmit) {
    return <PromptInputSubmit disabled={isResuming} />;
  }

  return (
    <PromptInputButton
      aria-label="Stop"
      className="absolute right-2.5 bottom-2.5"
      onClick={onCancel}
      variant="outline"
    >
      <SquareIcon className="size-3 fill-current" />
    </PromptInputButton>
  );
}

function ErrorMessage({ message }: { readonly message: string }) {
  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent>
        <div
          className="flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Request failed</p>
            <p className="mt-0.5 text-muted-foreground">{message}</p>
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

function ChatHeader({ canStartNewChat }: { readonly canStartNewChat: boolean }) {
  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-20 h-14">
      <div className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center bg-background px-24">
        <span className="truncate text-muted-foreground text-sm">{AGENT_NAME}</span>
        {canStartNewChat ? (
          <Button
            aria-label="Start a new chat"
            className="pointer-events-auto fixed top-3 right-6 pr-4"
            onClick={() => window.location.assign("/s")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <PlusIcon className="size-4" />
            <span className="hidden font-normal text-sm sm:inline">New chat</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function PendingActivity({ activity }: { readonly activity: Activity }) {
  return (
    <Message aria-live="polite" from="assistant">
      <MessageContent>
        <Trace>
          <TraceLine status="running">
            <TraceIcon>
              <BrainIcon />
            </TraceIcon>
            <TraceTitle>{activityLabel(activity)}</TraceTitle>
          </TraceLine>
        </Trace>
      </MessageContent>
    </Message>
  );
}

function activityLabel(activity: Activity): string {
  switch (activity.kind) {
    case "calling":
      return activity.names.join(", ");
    case "waiting-on-tasks":
      return \`Waiting on \${activity.tasks.map((task) => task.name).join(", ")}\`;
    case "compacting":
      return "Compacting the conversation";
    default:
      return "Thinking";
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to cancel the response.";
}
`,"app/_components/agent-message.tsx":`"use client";

import type { CallState, SessionView } from "eve/events";
import { callState, call, part } from "eve/events";
import type {
  Interaction,
  EveInteractionPart,
  EveMessage,
  EveMessagePart,
  EveToolPart,
} from "eve/react";
import { signInEnding } from "eve/events";
import { useState, type FormEvent } from "react";
import {
  BotIcon,
  BrainIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FileIcon,
  ImageIcon,
  KeyRoundIcon,
  TerminalIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { BashToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { cn } from "@/lib/utils";

export type AgentAnswer = {
  readonly optionId?: string;
  readonly interactionId: string;
  readonly text?: string;
};

/** How a message answers what the agent asks. */
interface Asks {
  readonly canRespond: (interactionId: string) => boolean;
  readonly onAnswers: (answers: readonly AgentAnswer[]) => void | Promise<void>;
  /** Every question a call asked; its part holds only the latest. */
  readonly questionsFor: (callId: string) => readonly Interaction[];
}

type EveFilePart = Extract<EveMessagePart, { type: "file" }>;
type Step = Extract<EveMessagePart, { type: "reasoning" | "tool" }>;

export function AgentMessage({
  message,
  view,
  ...asks
}: Asks & { readonly message: EveMessage; readonly view: SessionView }) {
  return (
    <Message
      data-optimistic={message.metadata?.optimistic ? "true" : undefined}
      from={message.role}
    >
      <MessageContent>
        {blocksOf(message.parts, asks).map((block, index) =>
          Array.isArray(block) ? (
            <Steps asks={asks} key={partKey(block[0]!, index)} steps={block} view={view} />
          ) : (
            <AgentMessagePart asks={asks} key={partKey(block, index)} part={block} />
          ),
        )}
      </MessageContent>
    </Message>
  );
}

/**
 * A message's parts, with each run of steps (reasoning and calls) gathered into one list. A call
 * that asks a question shows as that question instead, and the model waiting on or cancelling
 * its own tasks isn't activity to show.
 */
function blocksOf(parts: readonly EveMessagePart[], asks: Asks): (EveMessagePart | Step[])[] {
  const blocks: (EveMessagePart | Step[])[] = [];
  for (const part of parts) {
    if (part.type === "tool" && part.kind === "control") continue;
    const isStep =
      part.type === "reasoning" ||
      (part.type === "tool" && asks.questionsFor(part.callId).length === 0);
    const last = blocks.at(-1);
    if (!isStep) blocks.push(part);
    else if (Array.isArray(last)) last.push(part as Step);
    else blocks.push([part as Step]);
  }
  return blocks;
}

function AgentMessagePart({ asks, part }: { readonly asks: Asks; readonly part: EveMessagePart }) {
  switch (part.type) {
    case "text":
      return (
        <MessageResponse caret="block" isAnimating={part.state === "streaming"}>
          {part.text}
        </MessageResponse>
      );
    case "file":
      return <AttachmentPart part={part} />;
    case "interaction":
      return <InteractionPrompt asks={asks} part={part} />;
    case "tool":
      return (
        <div className="space-y-4">
          {asks.questionsFor(part.callId).map((question) => {
            // The call's part shows an answer this client sent at once; the view, once eve has it.
            const { answer, ...request } =
              part.interaction?.interactionId === question.interactionId
                ? part.interaction
                : question;
            return (
              <QuestionRequest
                answer={answer}
                canRespond={asks.canRespond(request.interactionId)}
                interaction={request}
                key={request.interactionId}
                onAnswers={asks.onAnswers}
              />
            );
          })}
        </div>
      );
    default:
      return null;
  }
}

/**
 * A run of steps. Several fold into one line that opens while they work; an approval waits
 * below them, so it stays in view when the list is closed.
 */
function Steps({
  asks,
  steps,
  view,
}: {
  readonly asks: Asks;
  readonly steps: readonly Step[];
  readonly view: SessionView;
}) {
  const [open, setOpen] = useState<boolean>();
  const states = steps.map((step) => stepState(step, view));
  const working = states.some((state) => state === "working");
  const waiting = states.some((state) => state === "waiting");
  const failed = states.filter((state) => state === "failed").length;
  const lines = (
    <Trace>
      {steps.map((step, index) =>
        step.type === "reasoning" ? (
          <ReasoningLine key={partKey(step, index)} part={step} />
        ) : (
          <ToolLine key={step.callId} part={step} state={callState(view, step.callId)} />
        ),
      )}
    </Trace>
  );
  const approvals = steps.flatMap((step) =>
    step.type === "tool" &&
    step.interaction?.request.kind === "approval" &&
    step.interaction.status !== "settled"
      ? [step.interaction]
      : [],
  );

  return (
    <>
      {steps.length === 1 ? (
        lines
      ) : (
        <TraceCollapsible onOpenChange={setOpen} open={open ?? (working || waiting)}>
          <TraceCollapsibleTrigger>
            <TraceLine status={working ? "running" : failed > 0 ? "error" : undefined}>
              <TraceTitle>
                {working
                  ? "Working"
                  : waiting
                    ? "Waiting for you"
                    : \`Worked\${duration(steps, view) ?? ""}\`}
              </TraceTitle>
              <TraceDescription>
                {failed > 0 ? \`\${failed} of \${steps.length} failed\` : \`\${steps.length} steps\`}
              </TraceDescription>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>{lines}</TraceCollapsibleContent>
        </TraceCollapsible>
      )}
      {approvals.map((interaction) => (
        <InteractionActions
          answer={interaction.answer}
          asks={asks}
          interaction={interaction}
          key={interaction.interactionId}
        />
      ))}
    </>
  );
}

function stepState(step: Step, view: SessionView): "working" | "waiting" | "failed" | "done" {
  if (step.type === "reasoning") return step.state === "streaming" ? "working" : "done";
  const state = callState(view, step.callId);
  if (state === "approval" || state === "blocked") return "waiting";
  const status = state === undefined ? "running" : CALL_LINES[state].status;
  return status === "error" ? "failed" : status === undefined ? "done" : "working";
}

/** " for 12s": from the first step's start to the last one's end, when facts report times. */
function duration(steps: readonly Step[], view: SessionView): string | undefined {
  const times = steps.flatMap((step) => {
    const observed = step.type === "tool" ? call(view, step.callId) : part(view, step.id ?? "");
    if (observed?.startedAt === undefined) return [];
    return [Date.parse(observed.startedAt), Date.parse(observed.endedAt ?? observed.startedAt)];
  });
  if (times.length === 0) return undefined;
  const seconds = Math.round((Math.max(...times) - Math.min(...times)) / 1000);
  if (seconds < 1) return undefined;
  return seconds < 60 ? \` for \${seconds}s\` : \` for \${Math.floor(seconds / 60)}m \${seconds % 60}s\`;
}

/** How a call's line reads in each state: its status, and a word on why. */
const CALL_LINES: Record<
  CallState,
  { readonly status?: "running" | "error" | "pending"; readonly note?: string }
> = {
  approval: { note: "Needs approval", status: "pending" },
  blocked: { note: "Waiting for you", status: "running" },
  cancelled: { note: "Stopped" },
  completed: {},
  failed: { note: "Failed", status: "error" },
  rejected: { note: "Denied" },
  requested: { status: "pending" },
  running: { status: "running" },
};

function ToolLine({
  part,
  state,
}: {
  readonly part: EveToolPart;
  readonly state: CallState | undefined;
}) {
  // A call the model is still writing has no row yet.
  const { note, status } = state === undefined ? { status: "running" as const } : CALL_LINES[state];
  // An answer waits on its approval until every approval asked with it is decided.
  const answered =
    state === "approval" && part.interaction?.answer !== undefined
      ? "Response submitted"
      : undefined;
  const Icon = part.name === "bash" ? TerminalIcon : part.kind === "agent" ? BotIcon : WrenchIcon;
  const line = (
    <TraceLine status={status}>
      <TraceIcon>
        <Icon />
      </TraceIcon>
      <TraceTitle>{part.label}</TraceTitle>
      {(answered ?? note) ? <TraceDescription>{answered ?? note}</TraceDescription> : null}
    </TraceLine>
  );
  if (part.input === undefined && part.output === undefined && part.error === undefined)
    return line;

  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="space-y-2 text-foreground">
        {part.name === "bash" ? (
          <BashToolContent
            errorText={part.error?.message}
            input={part.input}
            output={part.output}
          />
        ) : (
          <>
            {part.input === undefined ? null : <ToolInput input={part.input} />}
            <ToolOutput errorText={part.error?.message} output={part.output} />
          </>
        )}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ReasoningLine({ part }: { readonly part: Extract<Step, { type: "reasoning" }> }) {
  const [open, setOpen] = useState<boolean>();
  const running = part.state === "streaming";
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>
        <BrainIcon />
      </TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
    </TraceLine>
  );
  if (part.text.length === 0) return line;

  return (
    <TraceCollapsible onOpenChange={setOpen} open={open ?? running}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">{part.text}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function QuestionRequest({
  canRespond,
  interaction,
  answer,
  onAnswers,
}: {
  readonly canRespond: boolean;
  readonly interaction: Interaction;
  readonly answer?: AgentAnswer;
  readonly onAnswers: (responses: readonly AgentAnswer[]) => void | Promise<void>;
}) {
  const options = interaction.request.options ?? [];
  const acceptsFreeform = interaction.request.allowFreeform === true || options.length === 0;
  const disabled = !canRespond || answer !== undefined;

  const submitResponse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get(interaction.interactionId);
    if (typeof value !== "string") {
      return;
    }

    const option = options.find(({ id }) => id === value);
    void onAnswers([
      option === undefined
        ? { interactionId: interaction.interactionId, text: value.trim() }
        : { optionId: option.id, interactionId: interaction.interactionId },
    ]);
  };

  return (
    <Questionnaire
      className="gap-4 rounded-xl border bg-card p-4"
      // Validation reads disabled answers as missing, so locking a submitted form in place would
      // flag it invalid. Remounting restores the answer from the response instead.
      key={disabled ? "locked" : "open"}
      onSubmit={submitResponse}
      shortcuts="numbers"
    >
      <QuestionnaireItem name={interaction.interactionId} required>
        <QuestionnaireTitle className="text-sm font-medium">
          {interaction.request.prompt}
        </QuestionnaireTitle>
        <QuestionnaireChoices>
          {options.map((option) => (
            <QuestionnaireChoice
              className={cn(answer?.optionId === option.id && "data-disabled:opacity-100")}
              defaultChecked={answer?.optionId === option.id}
              disabled={disabled}
              key={option.id}
              value={option.id}
            >
              {option.label}
              {option.description ? (
                <QuestionnaireChoiceDescription>
                  {option.description}
                </QuestionnaireChoiceDescription>
              ) : null}
            </QuestionnaireChoice>
          ))}
          {acceptsFreeform ? (
            <QuestionnaireInput
              aria-label="Answer"
              className={cn(answer?.text !== undefined && "disabled:opacity-100")}
              defaultValue={answer?.text}
              disabled={disabled}
              placeholder="Type your answer…"
            />
          ) : null}
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      {disabled ? null : (
        <QuestionnaireActions>
          <QuestionnaireSubmit size="sm">Answer</QuestionnaireSubmit>
        </QuestionnaireActions>
      )}
    </Questionnaire>
  );
}

function AttachmentPart({ part }: { readonly part: EveFilePart }) {
  const label = part.filename ?? "Attachment";
  const detail = [part.mediaType, formatBytes(part.size)].filter(Boolean).join(" - ");
  const isImage = part.mediaType.startsWith("image/") && part.url !== undefined;
  const Icon = isImage ? ImageIcon : FileIcon;
  const body = (
    <span className="flex max-w-sm items-center gap-3 rounded-md border bg-background/60 p-2 text-sm">
      {isImage ? (
        <img alt={label} className="size-12 shrink-0 rounded-sm object-cover" src={part.url} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {detail ? <span className="block truncate text-muted-foreground">{detail}</span> : null}
      </span>
      {part.url ? <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" /> : null}
    </span>
  );

  return part.url ? (
    <a href={part.url} rel="noreferrer" target="_blank">
      {body}
    </a>
  ) : (
    body
  );
}

/** An interaction no call carries: a sign-in, the budget prompt, or a question of its own. */
function InteractionPrompt({
  asks,
  part,
}: {
  readonly asks: Asks;
  readonly part: EveInteractionPart;
}) {
  const { request } = part;
  if (request.signIn !== undefined) return <SignInPrompt part={part} />;
  if (request.kind === "question") {
    return (
      <QuestionRequest
        answer={part.answer}
        canRespond={asks.canRespond(part.interactionId)}
        interaction={part}
        onAnswers={asks.onAnswers}
      />
    );
  }
  return <InteractionActions answer={part.answer} asks={asks} interaction={part} />;
}

function SignInPrompt({ part }: { readonly part: EveInteractionPart }) {
  const signIn = part.request.signIn;
  const name = signIn?.displayName ?? signIn?.name ?? "the service";
  const isAuthorized = part.outcome === "accepted";
  const isCompleted = part.status === "settled";
  const Icon = isAuthorized ? CheckCircleIcon : isCompleted ? XCircleIcon : KeyRoundIcon;
  const instructions = signIn?.instructions;
  const description = isCompleted
    ? isAuthorized
      ? \`\${name} connected.\`
      : \`\${name} authorization \${signInEnding(part.outcome ?? "withdrawn")}\${
          part.reason !== undefined ? \` (\${part.reason})\` : ""
        }.\`
    : part.request.prompt;

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border p-3",
        isAuthorized
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isCompleted
            ? "border-destructive/30 bg-destructive/5"
            : "border-blue-500/30 bg-blue-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            isAuthorized
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : isCompleted
                ? "bg-destructive/10 text-destructive"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium text-sm">
            {isCompleted
              ? isAuthorized
                ? \`\${name} connected\`
                : \`\${name} authorization \${signInEnding(part.outcome ?? "withdrawn")}\`
              : \`Connect \${name}\`}
          </p>
          <p className="text-muted-foreground text-sm">{description}</p>
          {!isCompleted && instructions !== undefined && instructions !== description ? (
            <p className="text-muted-foreground text-sm">{instructions}</p>
          ) : null}
          {!isCompleted && signIn?.userCode ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Code</span>
              <code className="rounded-md bg-background px-2 py-1 font-mono">
                {signIn.userCode}
              </code>
            </div>
          ) : null}
          {!isCompleted && signIn?.url ? (
            <Button asChild size="sm">
              <a href={signIn.url} rel="noreferrer" target="_blank">
                <ExternalLinkIcon className="size-4" />
                Sign in with {name}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatBytes(size: number | undefined): string | undefined {
  if (size === undefined) {
    return undefined;
  }
  if (size < 1024) {
    return \`\${size} B\`;
  }
  if (size < 1024 * 1024) {
    return \`\${(size / 1024).toFixed(1)} KB\`;
  }
  return \`\${(size / (1024 * 1024)).toFixed(1)} MB\`;
}

/** An interaction's prompt with a button for each option, or how it was answered. */
function InteractionActions({
  answer,
  asks,
  interaction,
}: {
  readonly answer?: AgentAnswer;
  readonly asks: Asks;
  readonly interaction: Interaction;
}) {
  const selectedOption = interaction.request.options?.find(
    (option) => option.id === answer?.optionId,
  );

  return (
    <div className="space-y-3 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
      <p className="text-muted-foreground text-sm">{interaction.request.prompt}</p>
      {answer ? (
        <p className="font-medium text-sm">
          Responded: {selectedOption?.label ?? answer.text ?? answer.optionId}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interaction.request.options?.map((option, index) => (
            <Button
              disabled={!asks.canRespond(interaction.interactionId)}
              key={option.id}
              onClick={() => {
                void asks.onAnswers([
                  {
                    optionId: option.id,
                    interactionId: interaction.interactionId,
                  },
                ]);
              }}
              size="sm"
              type="button"
              variant={
                option.style === "danger" ? "destructive" : index === 0 ? "default" : "outline"
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function partKey(part: EveMessagePart, index: number): string {
  switch (part.type) {
    case "interaction":
      return \`interaction:\${part.interactionId}\`;
    case "tool":
      return part.callId;
    case "reasoning":
    case "text":
      return \`\${part.type}:\${part.id ?? index}\`;
    default:
      return \`\${part.type}:\${index}\`;
  }
}
`,"app/apple-icon.tsx":`import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <svg fill="none" viewBox="0 0 102 102" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h102v102H0z" fill="#000" />
      <path
        d="M49.28 66.94 75.03 34.96h-6.89L47.91 60.11l-5.49 6.83h6.86ZM0 34.96h42.4v5.11H0zm0 13.32h27.66v5.11H0zm0 13.54h27.66v5.11H0zm69.63-26.86H102v5.11H69.63zm4.71 13.32H102v5.11H74.34zm0 13.54H102v5.11H74.34z"
        fill="#fff"
      />
    </svg>,
    size,
  );
}
`,"app/eve-agent.ts":`/** Named workspace agent selected by the Web Chat installer. */
export const WEB_CHAT_AGENT: string | undefined = undefined;
`,"app/globals.css":`@import "tailwindcss";
@import "tw-animate-css";
@source "../node_modules/streamdown/dist/*.js";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Not inline: font utilities must read the variables so each host's font loader can override them. */
@theme {
  --font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
}

:root {
  color-scheme: light;
  /* Soft neutral page with white elevated surfaces so cards/composer pop. */
  --background: oklch(0.971 0 0);
  --foreground: oklch(0.16 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.16 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.16 0 0);
  --primary: oklch(0.19 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.94 0 0);
  --secondary-foreground: oklch(0.19 0 0);
  --muted: oklch(0.94 0 0);
  --muted-foreground: oklch(0.6 0 0);
  --accent: oklch(0.94 0 0);
  --accent-foreground: oklch(0.19 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.916 0 0);
  --input: oklch(0.916 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
  }
}

* {
  border-color: var(--border);
}

html {
  height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100%;
  margin: 0;
  background: var(--background);
  font-family: var(--font-sans);
}

button,
input,
textarea {
  font: inherit;
}

/*
 * From shadcn/tailwind.css, for Trace: Radix marks open and closed parts with data-state, and a
 * running line's title shimmers.
 */
@custom-variant data-open {
  &:where([data-state="open"]),
  &:where([data-open]:not([data-open="false"])) {
    @slot;
  }
}

@custom-variant data-closed {
  &:where([data-state="closed"]),
  &:where([data-closed]:not([data-closed="false"])) {
    @slot;
  }
}

@property --shimmer-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 20deg;
}

@property --shimmer-image {
  syntax: "*";
  inherits: false;
}

@property --shimmer-text-fill {
  syntax: "*";
  inherits: false;
}

@theme inline {
  @keyframes tw-shimmer {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: 0 0;
    }
  }
}

@utility shimmer {
  --_spread: var(--shimmer-spread, calc(3ch + 40px));
  --_base: currentColor;
  --_highlight: var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)));

  background-image: var(
    --shimmer-image,
    linear-gradient(
      calc(90deg + var(--shimmer-angle)),
      var(--_base) calc(50% - var(--_spread)),
      color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% - var(--_spread) * 0.5),
      var(--_highlight) 50%,
      color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% + var(--_spread) * 0.5),
      var(--_base) calc(50% + var(--_spread))
    )
  );
  background-repeat: no-repeat;
  background-size: calc(200% + var(--_spread) * 2) 100%;
  background-position: 0 0;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: var(--shimmer-text-fill, transparent);
  animation: tw-shimmer var(--shimmer-duration, 2s) linear infinite;

  @variant dark {
    --_highlight: var(
      --shimmer-color,
      oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4))
    );
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-image: none;
    -webkit-text-fill-color: currentColor;
  }
}

@utility shimmer-none {
  --shimmer-image: none;
  --shimmer-text-fill: currentColor;
}
`,"app/icon.svg":`<svg width="102" height="102" viewBox="0 0 102 102" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="#000" d="M0 0h102v102H0z" />
  <path
    fill="#fff"
    d="M49.28 66.94 75.03 34.96h-6.89L47.91 60.11l-5.49 6.83h6.86ZM0 34.96h42.4v5.11H0zm0 13.32h27.66v5.11H0zm0 13.54h27.66v5.11H0zm69.63-26.86H102v5.11H69.63zm4.71 13.32H102v5.11H74.34zm0 13.54H102v5.11H74.34z"
  />
</svg>
`,"app/layout.tsx":`import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "__EVE_INIT_APP_NAME__",
  description: "A Next.js starter for eve agents with AI Elements.",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={cn(sans.variable, mono.variable)} lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
`,"app/page.tsx":`import { AgentChat } from "@/app/_components/agent-chat";

export default function Page() {
  return <AgentChat />;
}
`,"app/s/[sessionId]/page.tsx":`import { AgentChat } from "@/app/_components/agent-chat";

export default async function SessionPage({
  params,
}: {
  readonly params: Promise<{ readonly sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <AgentChat sessionId={sessionId} />;
}
`,"app/s/page.tsx":`import { AgentChat } from "@/app/_components/agent-chat";

export default function NewSessionPage() {
  return <AgentChat sessionless />;
}
`,"components/ai-elements/code-block.tsx":`"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, CSSProperties, HTMLAttributes } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BundledLanguage, BundledTheme, HighlighterGeneric, ThemedToken } from "shiki";
import { createHighlighter } from "shiki";

// Shiki uses bitflags for font styles: 1=italic, 2=bold, 4=underline
// oxlint-disable-next-line eslint(no-bitwise)
const isItalic = (fontStyle: number | undefined) => fontStyle && fontStyle & 1;
// oxlint-disable-next-line eslint(no-bitwise)
const isBold = (fontStyle: number | undefined) => fontStyle && fontStyle & 2;
const isUnderline = (fontStyle: number | undefined) =>
  // oxlint-disable-next-line eslint(no-bitwise)
  fontStyle && fontStyle & 4;

// Transform tokens to include pre-computed keys to avoid noArrayIndexKey lint
interface KeyedToken {
  token: ThemedToken;
  key: string;
}
interface KeyedLine {
  tokens: KeyedToken[];
  key: string;
}

const addKeysToTokens = (lines: ThemedToken[][]): KeyedLine[] =>
  lines.map((line, lineIdx) => ({
    key: \`line-\${lineIdx}\`,
    tokens: line.map((token, tokenIdx) => ({
      key: \`line-\${lineIdx}-\${tokenIdx}\`,
      token,
    })),
  }));

// Token rendering component
const TokenSpan = ({ token }: { token: ThemedToken }) => (
  <span
    className="dark:!bg-[var(--shiki-dark-bg)] dark:!text-[var(--shiki-dark)]"
    style={
      {
        backgroundColor: token.bgColor,
        color: token.color,
        fontStyle: isItalic(token.fontStyle) ? "italic" : undefined,
        fontWeight: isBold(token.fontStyle) ? "bold" : undefined,
        textDecoration: isUnderline(token.fontStyle) ? "underline" : undefined,
        ...token.htmlStyle,
      } as CSSProperties
    }
  >
    {token.content}
  </span>
);

// Line number styles using CSS counters
const LINE_NUMBER_CLASSES = cn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-8",
  "before:mr-4",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none",
);

// Line rendering component
const LineSpan = ({
  keyedLine,
  showLineNumbers,
}: {
  keyedLine: KeyedLine;
  showLineNumbers: boolean;
}) => (
  <span className={showLineNumbers ? LINE_NUMBER_CLASSES : "block"}>
    {keyedLine.tokens.length === 0
      ? "\\n"
      : keyedLine.tokens.map(({ token, key }) => <TokenSpan key={key} token={token} />)}
  </span>
);

// Types
type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

interface TokenizedCode {
  tokens: ThemedToken[][];
  fg: string;
  bg: string;
}

interface CodeBlockContextType {
  code: string;
}

// Context
const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

// Highlighter cache (singleton per language)
const highlighterCache = new Map<
  string,
  Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
>();

// Token cache
const tokensCache = new Map<string, TokenizedCode>();

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>();

const getTokensCacheKey = (code: string, language: BundledLanguage) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return \`\${language}:\${code.length}:\${start}:\${end}\`;
};

const getHighlighter = (
  language: BundledLanguage,
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> => {
  const cached = highlighterCache.get(language);
  if (cached) {
    return cached;
  }

  const highlighterPromise = createHighlighter({
    langs: [language],
    themes: ["github-light", "github-dark"],
  });

  highlighterCache.set(language, highlighterPromise);
  return highlighterPromise;
};

// Create raw tokens for immediate display while highlighting loads
const createRawTokens = (code: string): TokenizedCode => ({
  bg: "transparent",
  fg: "inherit",
  tokens: code.split("\\n").map((line) =>
    line === ""
      ? []
      : [
          {
            color: "inherit",
            content: line,
          } as ThemedToken,
        ],
  ),
});

// Synchronous highlight with callback for async results
export const highlightCode = (
  code: string,
  language: BundledLanguage,
  // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-callbacks)
  callback?: (result: TokenizedCode) => void,
): TokenizedCode | null => {
  const tokensCacheKey = getTokensCacheKey(code, language);

  // Return cached result if available
  const cached = tokensCache.get(tokensCacheKey);
  if (cached) {
    return cached;
  }

  // Subscribe callback if provided
  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, new Set());
    }
    subscribers.get(tokensCacheKey)?.add(callback);
  }

  // Start highlighting in background - fire-and-forget async pattern
  getHighlighter(language)
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then)
    .then((highlighter) => {
      const availableLangs = highlighter.getLoadedLanguages();
      const langToUse = availableLangs.includes(language) ? language : "text";

      const result = highlighter.codeToTokens(code, {
        lang: langToUse,
        themes: {
          dark: "github-dark",
          light: "github-light",
        },
      });

      const tokenized: TokenizedCode = {
        bg: result.bg ?? "transparent",
        fg: result.fg ?? "inherit",
        tokens: result.tokens,
      };

      // Cache the result
      tokensCache.set(tokensCacheKey, tokenized);

      // Notify all subscribers
      const subs = subscribers.get(tokensCacheKey);
      if (subs) {
        for (const sub of subs) {
          sub(tokenized);
        }
        subscribers.delete(tokensCacheKey);
      }
    })
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then), eslint-plugin-promise(prefer-await-to-callbacks)
    .catch((error) => {
      console.error("Failed to highlight code:", error);
      subscribers.delete(tokensCacheKey);
    });

  return null;
};

const CodeBlockBody = memo(
  ({
    tokenized,
    showLineNumbers,
    className,
  }: {
    tokenized: TokenizedCode;
    showLineNumbers: boolean;
    className?: string;
  }) => {
    const preStyle = useMemo(
      () => ({
        backgroundColor: tokenized.bg,
        color: tokenized.fg,
      }),
      [tokenized.bg, tokenized.fg],
    );

    const keyedLines = useMemo(() => addKeysToTokens(tokenized.tokens), [tokenized.tokens]);

    return (
      <pre
        className={cn(
          "dark:!bg-[var(--shiki-dark-bg)] dark:!text-[var(--shiki-dark)] m-0 p-4 text-sm",
          className,
        )}
        style={preStyle}
      >
        <code
          className={cn(
            "font-mono text-sm",
            showLineNumbers && "[counter-increment:line_0] [counter-reset:line]",
          )}
        >
          {keyedLines.map((keyedLine) => (
            <LineSpan key={keyedLine.key} keyedLine={keyedLine} showLineNumbers={showLineNumbers} />
          ))}
        </code>
      </pre>
    );
  },
  (prevProps, nextProps) =>
    prevProps.tokenized === nextProps.tokenized &&
    prevProps.showLineNumbers === nextProps.showLineNumbers &&
    prevProps.className === nextProps.className,
);

CodeBlockBody.displayName = "CodeBlockBody";

export const CodeBlockContainer = ({
  className,
  language,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { language: string }) => (
  <div
    className={cn(
      "group relative w-full overflow-hidden rounded-md border bg-background text-foreground",
      className,
    )}
    data-language={language}
    style={{
      containIntrinsicSize: "auto 200px",
      contentVisibility: "auto",
      ...style,
    }}
    {...props}
  />
);

export const CodeBlockHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between border-b bg-muted/80 px-3 py-2 text-muted-foreground text-xs",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CodeBlockTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

export const CodeBlockFilename = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("font-mono", className)} {...props}>
    {children}
  </span>
);

export const CodeBlockActions = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-my-1 -mr-1 flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

export const CodeBlockContent = ({
  code,
  language,
  showLineNumbers = false,
}: {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
}) => {
  // Memoized raw tokens for immediate display
  const rawTokens = useMemo(() => createRawTokens(code), [code]);

  // Synchronous cache lookup — avoids setState in effect for cached results
  const syncTokens = useMemo(
    () => highlightCode(code, language) ?? rawTokens,
    [code, language, rawTokens],
  );

  // Async highlighting result (populated after shiki loads)
  const [asyncTokens, setAsyncTokens] = useState<TokenizedCode | null>(null);
  const asyncKeyRef = useRef({ code, language });

  // Invalidate stale async tokens synchronously during render
  if (asyncKeyRef.current.code !== code || asyncKeyRef.current.language !== language) {
    asyncKeyRef.current = { code, language };
    setAsyncTokens(null);
  }

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language, (result) => {
      if (!cancelled) {
        setAsyncTokens(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const tokenized = asyncTokens ?? syncTokens;

  return (
    <div className="relative overflow-auto">
      <CodeBlockBody showLineNumbers={showLineNumbers} tokenized={tokenized} />
    </div>
  );
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const contextValue = useMemo(() => ({ code }), [code]);

  return (
    <CodeBlockContext.Provider value={contextValue}>
      <CodeBlockContainer className={className} language={language} {...props}>
        {children}
        <CodeBlockContent code={code} language={language} showLineNumbers={showLineNumbers} />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number>(0);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [code, onCopy, onError, timeout, isCopied]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};

export type CodeBlockLanguageSelectorProps = ComponentProps<typeof Select>;

export const CodeBlockLanguageSelector = (props: CodeBlockLanguageSelectorProps) => (
  <Select {...props} />
);

export type CodeBlockLanguageSelectorTriggerProps = ComponentProps<typeof SelectTrigger>;

export const CodeBlockLanguageSelectorTrigger = ({
  className,
  ...props
}: CodeBlockLanguageSelectorTriggerProps) => (
  <SelectTrigger
    className={cn("h-7 border-none bg-transparent px-2 text-xs shadow-none", className)}
    size="sm"
    {...props}
  />
);

export type CodeBlockLanguageSelectorValueProps = ComponentProps<typeof SelectValue>;

export const CodeBlockLanguageSelectorValue = (props: CodeBlockLanguageSelectorValueProps) => (
  <SelectValue {...props} />
);

export type CodeBlockLanguageSelectorContentProps = ComponentProps<typeof SelectContent>;

export const CodeBlockLanguageSelectorContent = ({
  align = "end",
  ...props
}: CodeBlockLanguageSelectorContentProps) => <SelectContent align={align} {...props} />;

export type CodeBlockLanguageSelectorItemProps = ComponentProps<typeof SelectItem>;

export const CodeBlockLanguageSelectorItem = (props: CodeBlockLanguageSelectorItemProps) => (
  <SelectItem {...props} />
);
`,"components/ai-elements/conversation.tsx":`"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { ArrowDownIcon, DownloadIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

export type ConversationProps = ComponentProps<typeof StickToBottom> & {
  scrollRestorationKey?: string;
};

export const Conversation = ({
  children,
  className,
  initial,
  scrollRestorationKey,
  ...props
}: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-hidden", className)}
    initial={initial ?? (scrollRestorationKey === undefined ? "smooth" : false)}
    resize="smooth"
    role="log"
    {...props}
  >
    {typeof children === "function" ? (
      (context) => (
        <>
          {children(context)}
          {scrollRestorationKey === undefined ? null : (
            <ConversationScrollRestoration storageKey={scrollRestorationKey} />
          )}
        </>
      )
    ) : (
      <>
        {children}
        {scrollRestorationKey === undefined ? null : (
          <ConversationScrollRestoration storageKey={scrollRestorationKey} />
        )}
      </>
    )}
  </StickToBottom>
);

function ConversationScrollRestoration({ storageKey }: { readonly storageKey: string }) {
  const { scrollRef, scrollToBottom, state } = useStickToBottomContext();
  const restoredKeyRef = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement === null) return;

    if (restoredKeyRef.current !== storageKey) {
      const saved = readScrollPosition(sessionStorage.getItem(storageKey));
      if (saved?.atBottom === false) {
        scrollElement.scrollTop = saved.scrollTop;
        requestAnimationFrame(() => {
          scrollElement.scrollTop = saved.scrollTop;
        });
      } else {
        scrollElement.scrollTop = scrollElement.scrollHeight;
        scrollToBottom({ animation: "instant", ignoreEscapes: true });
      }
      restoredKeyRef.current = storageKey;
    }

    const saveNow = () => {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          atBottom: state.isAtBottom || state.isNearBottom,
          scrollTop: scrollElement.scrollTop,
        }),
      );
    };
    let frame: number | undefined;
    const scheduleSave = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        saveNow();
      });
    };
    scrollElement.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("pagehide", saveNow);
    return () => {
      scrollElement.removeEventListener("scroll", scheduleSave);
      window.removeEventListener("pagehide", saveNow);
      if (frame !== undefined) cancelAnimationFrame(frame);
      saveNow();
    };
  }, [scrollRef, scrollToBottom, state, storageKey]);

  return null;
}

function readScrollPosition(value: string | null):
  | {
      readonly atBottom: boolean;
      readonly scrollTop: number;
    }
  | undefined {
  if (value === null) return undefined;
  try {
    const parsed = JSON.parse(value) as { atBottom?: unknown; scrollTop?: unknown };
    return typeof parsed.atBottom === "boolean" && typeof parsed.scrollTop === "number"
      ? { atBottom: parsed.atBottom, scrollTop: parsed.scrollTop }
      : undefined;
  } catch {
    return undefined;
  }
}

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn("flex flex-col gap-8 p-4", className)} {...props} />
);

export type ConversationTopFadeProps = ComponentProps<"div">;

export const ConversationTopFade = ({ className, ...props }: ConversationTopFadeProps) => {
  const { contentRef, scrollRef } = useStickToBottomContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement === null) return;

    const updateVisibility = () => {
      setIsVisible(scrollElement.scrollTop > 0);
    };

    updateVisibility();
    scrollElement.addEventListener("scroll", updateVisibility, { passive: true });

    const resizeObserver = new ResizeObserver(updateVisibility);
    resizeObserver.observe(scrollElement);
    if (contentRef.current !== null) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      scrollElement.removeEventListener("scroll", updateVisibility);
      resizeObserver.disconnect();
    };
  }, [contentRef, scrollRef]);

  return (
    <div
      {...props}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-linear-to-b from-background via-background/80 to-transparent transition-opacity duration-150",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      data-slot="conversation-top-fade"
    />
  );
};

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className,
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="font-medium text-sm">{title}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </>
    )}
  </div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => setIsReady(true), []);

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    isReady &&
    !isAtBottom && (
      <Button
        aria-label="Scroll to bottom"
        className={cn(
          "absolute bottom-32 left-[50%] translate-x-[-50%] rounded-full dark:bg-background dark:hover:bg-muted",
          className,
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};

const getMessageText = (message: UIMessage): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

export type ConversationDownloadProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  messages: UIMessage[];
  filename?: string;
  formatMessage?: (message: UIMessage, index: number) => string;
};

const defaultFormatMessage = (message: UIMessage): string => {
  const roleLabel = message.role.charAt(0).toUpperCase() + message.role.slice(1);
  return \`**\${roleLabel}:** \${getMessageText(message)}\`;
};

export const messagesToMarkdown = (
  messages: UIMessage[],
  formatMessage: (message: UIMessage, index: number) => string = defaultFormatMessage,
): string => messages.map((msg, i) => formatMessage(msg, i)).join("\\n\\n");

export const ConversationDownload = ({
  messages,
  filename = "conversation.md",
  formatMessage = defaultFormatMessage,
  className,
  children,
  ...props
}: ConversationDownloadProps) => {
  const handleDownload = useCallback(() => {
    const markdown = messagesToMarkdown(messages, formatMessage);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [messages, filename, formatMessage]);

  return (
    <Button
      className={cn(
        "absolute top-4 right-4 rounded-full dark:bg-background dark:hover:bg-muted",
        className,
      )}
      onClick={handleDownload}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      {children ?? <DownloadIcon className="size-4" />}
    </Button>
  );
};
`,"components/ai-elements/message.tsx":`"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-2xl group-[.is-user]:bg-primary group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-primary-foreground",
      // Streamdown links default to text-primary, which matches the user bubble background.
      "group-[.is-user]:[&_[data-streamdown=link]]:text-current",
      "group-[.is-assistant]:w-full group-[.is-assistant]:text-foreground",
      "group-data-[optimistic=true]:opacity-70",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({ className, children, ...props }: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(null);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error("MessageBranch components must be used within MessageBranch");
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange],
  );

  const goToPrevious = useCallback(() => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious],
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div className={cn("grid w-full gap-2 [&>div]:pb-0", className)} {...props} />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({ children, ...props }: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children],
  );

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden",
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({ className, ...props }: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className,
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({ children, ...props }: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({ children, ...props }: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({ className, ...props }: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn("border-none bg-transparent text-muted-foreground shadow-none", className)}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children && nextProps.isAnimating === prevProps.isAnimating,
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({ className, children, ...props }: MessageToolbarProps) => (
  <div className={cn("mt-4 flex w-full items-center justify-between gap-4", className)} {...props}>
    {children}
  </div>
);
`,"components/ai-elements/prompt-input.tsx":`"use client";

import { InputGroup, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { FileUIPart } from "ai";
import { ArrowUpIcon } from "lucide-react";
import { nanoid } from "nanoid";
import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
} from "react";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const convertBlobUrlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    // oxlint-disable-next-line eslint-plugin-promise(avoid-new)
    return new Promise((resolve) => {
      const reader = new FileReader();
      // oxlint-disable-next-line eslint-plugin-unicorn(prefer-add-event-listener)
      reader.onloadend = () => resolve(reader.result as string);
      // oxlint-disable-next-line eslint-plugin-unicorn(prefer-add-event-listener)
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

interface AttachmentsContext {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

export const usePromptInputAttachments = () => {
  const context = useContext(LocalAttachmentsContext);
  if (!context) {
    throw new Error("usePromptInputAttachments must be used within a PromptInput");
  }
  return context;
};

export interface PromptInputMessage {
  text: string;
  files: FileUIPart[];
}

type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onError"> & {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (err: { code: "max_files" | "max_file_size" | "accept"; message: string }) => void;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
};

export const PromptInput = ({
  className,
  accept,
  multiple,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [files, setFiles] = useState<(FileUIPart & { id: string })[]>([]);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const matchesAccept = useCallback(
    (file: File) => {
      if (!accept || accept.trim() === "") return true;
      const patterns = accept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return patterns.some((pattern) =>
        pattern.endsWith("/*") ? file.type.startsWith(pattern.slice(0, -1)) : file.type === pattern,
      );
    },
    [accept],
  );

  const add = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter(matchesAccept);
      if (incoming.length && accepted.length === 0) {
        onError?.({ code: "accept", message: "No files match the accepted types." });
        return;
      }
      const sized = accepted.filter((file) => (maxFileSize ? file.size <= maxFileSize : true));
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({ code: "max_file_size", message: "All files exceed the maximum size." });
        return;
      }
      setFiles((prev) => {
        const capacity =
          typeof maxFiles === "number" ? Math.max(0, maxFiles - prev.length) : undefined;
        const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({ code: "max_files", message: "Too many files. Some were not added." });
        }
        return [
          ...prev,
          ...capped.map((file) => ({
            filename: file.name,
            id: nanoid(),
            mediaType: file.type,
            type: "file" as const,
            url: URL.createObjectURL(file),
          })),
        ];
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError],
  );

  const remove = useCallback(
    (id: string) =>
      setFiles((prev) => {
        const found = prev.find((file) => file.id === id);
        if (found?.url) URL.revokeObjectURL(found.url);
        return prev.filter((file) => file.id !== id);
      }),
    [],
  );

  const clear = useCallback(
    () =>
      setFiles((prev) => {
        for (const file of prev) {
          if (file.url) URL.revokeObjectURL(file.url);
        }
        return [];
      }),
    [],
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0)
        add(event.dataTransfer.files);
    };
    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [add]);

  useEffect(
    () => () => {
      for (const file of filesRef.current) {
        if (file.url) URL.revokeObjectURL(file.url);
      }
    },
    [],
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.currentTarget.files) add(event.currentTarget.files);
      // Reset so the same file can be selected again after removal.
      event.currentTarget.value = "";
    },
    [add],
  );

  const attachments = useMemo(() => ({ add, clear, files, remove }), [add, clear, files, remove]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const text = (new FormData(form).get("message") as string) || "";
      // Capture and reset before conversion so text typed while it runs isn't lost.
      form.reset();
      try {
        const convertedFiles: FileUIPart[] = await Promise.all(
          files.map(async ({ id: _id, ...item }) => {
            if (item.url?.startsWith("blob:")) {
              const dataUrl = await convertBlobUrlToDataUrl(item.url);
              return { ...item, url: dataUrl ?? item.url };
            }
            return item;
          }),
        );
        await onSubmit({ files: convertedFiles, text }, event);
        clear();
      } catch {
        // Keep attachments available for a retry.
      }
    },
    [files, onSubmit, clear],
  );

  return (
    <LocalAttachmentsContext.Provider value={attachments}>
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        title="Upload files"
        type="file"
      />
      <form className="w-full" onSubmit={handleSubmit} ref={formRef} {...props}>
        <InputGroup
          className={cn(
            "overflow-hidden rounded-2xl bg-card/80 shadow-sm backdrop-blur-md",
            "focus-within:border-foreground! has-[[data-slot=input-group-control]:focus-visible]:border-foreground!",
            className,
          )}
        >
          {children}
        </InputGroup>
      </form>
    </LocalAttachmentsContext.Provider>
  );
};

export const PromptInputTextarea = ({
  onChange,
  onKeyDown,
  className,
  placeholder = "What would you like to know?",
  ...props
}: ComponentProps<typeof InputGroupTextarea>) => {
  const attachments = usePromptInputAttachments();
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Enter") {
        if (isComposing || event.nativeEvent.isComposing || event.shiftKey) return;
        event.preventDefault();
        const { form } = event.currentTarget;
        const submitButton = form?.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null;
        if (submitButton?.disabled) return;
        form?.requestSubmit();
      }
      if (
        event.key === "Backspace" &&
        event.currentTarget.value === "" &&
        attachments.files.length > 0
      ) {
        event.preventDefault();
        const lastAttachment = attachments.files.at(-1);
        if (lastAttachment) attachments.remove(lastAttachment.id);
      }
    },
    [onKeyDown, isComposing, attachments],
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments],
  );

  const handleCompositionEnd = useCallback(() => setIsComposing(false), []);
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-18 text-base md:text-sm", className)}
      name="message"
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      {...props}
      onChange={onChange}
    />
  );
};

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: ComponentProps<typeof InputGroupButton>) => (
  <InputGroupButton
    className={cn(
      "rounded-full",
      variant === "outline" && "bg-card hover:bg-card dark:hover:bg-input/30",
      className,
    )}
    size={size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm")}
    type="button"
    variant={variant}
    {...props}
  />
);

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  children,
  ...props
}: ComponentProps<typeof InputGroupButton>) => (
  <InputGroupButton
    aria-label="Submit"
    className={cn("absolute right-2.5 bottom-2.5 rounded-full", className)}
    size={size}
    type="submit"
    variant={variant}
    {...props}
  >
    {children ?? <ArrowUpIcon className="size-4" />}
  </InputGroupButton>
);
`,"components/ai-elements/tool.tsx":`"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";

import { CodeBlock } from "./code-block";

const compactCodeBlockClassName =
  "rounded-none border-0 bg-transparent [&_pre]:!bg-transparent [&_pre]:px-3 [&_pre]:pt-2 [&_pre]:pb-3 [&_pre]:text-xs [&_code]:text-xs";

export type BashToolContentProps = ComponentProps<"div"> & {
  input: unknown;
  output: unknown;
  errorText: string | undefined;
};

export const BashToolContent = ({
  className,
  input,
  output,
  errorText,
  ...props
}: BashToolContentProps) => {
  const command = getRecordValue(input, "command");
  const stdout = getRecordValue(output, "stdout") ?? (typeof output === "string" ? output : "");
  const stderr = getRecordValue(output, "stderr") ?? errorText ?? "";
  const exitCode = getRecordValue(output, "exitCode");
  const hasResult = Boolean(stdout || stderr || (typeof exitCode === "number" && exitCode !== 0));

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed">
        <code>
          <span className="text-muted-foreground">$ </span>
          {command ?? "…"}
        </code>
      </pre>
      {hasResult ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed">
          <code>
            <span className="mb-2 block font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
              Output
            </span>
            {stdout ? <span className="block">{String(stdout).trimEnd()}</span> : null}
            {stderr ? (
              <span className="block text-destructive">{String(stderr).trimEnd()}</span>
            ) : null}
            {typeof exitCode === "number" && exitCode !== 0 ? (
              <span className="block text-muted-foreground">Exited with code {exitCode}</span>
            ) : null}
          </code>
        </pre>
      ) : null}
    </div>
  );
};

const getRecordValue = (value: unknown, key: string): string | number | undefined => {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }

  const property = value[key as keyof typeof value];
  return typeof property === "string" || typeof property === "number" ? property : undefined;
};

export type ToolInputProps = ComponentProps<"div"> & {
  input: unknown;
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("overflow-hidden rounded-md bg-muted/50", className)} {...props}>
    <span className="block px-3 pt-3 font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
      Parameters
    </span>
    <div>
      <CodeBlock
        className={compactCodeBlockClassName}
        code={JSON.stringify(input, null, 2)}
        language="json"
      />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: unknown;
  errorText: string | undefined;
};

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  let Output = <div>{output as ReactNode}</div>;

  if (typeof output === "object" && !isValidElement(output)) {
    Output = (
      <CodeBlock
        className={compactCodeBlockClassName}
        code={JSON.stringify(output, null, 2)}
        language="json"
      />
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock className={compactCodeBlockClassName} code={output} language="json" />;
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-md text-xs [&_table]:w-full",
        errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-foreground",
        className,
      )}
      {...props}
    >
      <span className="block px-3 pt-3 font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
        {errorText ? "Error" : "Result"}
      </span>
      {errorText && <div className="px-3 pt-2 pb-3">{errorText}</div>}
      {Output}
    </div>
  );
};
`,"components/ui/button-group.tsx":`import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
`,"components/ui/button.tsx":`import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
`,"components/ui/collapsible.tsx":`"use client";

import { Collapsible as CollapsiblePrimitive } from "radix-ui";

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
`,"components/ui/dropdown-menu.tsx":`"use client";

import * as React from "react";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
`,"components/ui/input-group.tsx":`"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
        "h-9 min-w-0 has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",

        // Error state.
        "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
      "icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
`,"components/ui/input.tsx":`import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
`,"components/ui/questionnaire.tsx":`"use client";

import * as React from "react";
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import { CheckIcon } from "lucide-react";

import { buttonVariants, type Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn("flex w-full min-w-0 flex-col gap-6", className)}
      {...props}
    />
  );
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn(
        "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn("flex min-w-0 flex-col gap-5 border-0 p-0 outline-none", className)}
      {...props}
    />
  );
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        "text-base font-semibold text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-5",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn("group/questionnaire-choices grid min-w-0 gap-3", className)}
      {...props}
    />
  );
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input bg-transparent px-4 py-3.5 text-start text-sm shadow-xs transition-colors outline-none select-none hover:bg-muted/50 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive dark:bg-input/20 data-checked:border-primary/40 data-checked:bg-muted dark:data-checked:bg-muted",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[4px] border border-input group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:bg-input/30 dark:group-data-checked/questionnaire-choice:bg-primary"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="hidden size-2 rounded-full bg-primary-foreground group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon
          data-slot="questionnaire-choice-indicator-check"
          className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col gap-1 leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground shadow-xs group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative w-full min-w-0"
    >
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          "h-9 min-h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  );
}

function QuestionnaireActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-9",
        className,
      )}
      {...props}
    />
  );
}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Skip"}
    </QuestionnairePrimitive.Skip>
  );
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
`,"components/ui/select.tsx":`"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
`,"components/ui/separator.tsx":`"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
`,"components/ui/textarea.tsx":`import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
`,"components/ui/tooltip.tsx":`"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
`,"components/ui/trace.tsx":`import * as React from "react";
import { cn } from "@/lib/utils";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRightIcon } from "lucide-react";

function Trace({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="trace"
      className={cn(
        "flex w-full min-w-0 flex-col gap-2 *:has-[>[data-slot=trace-line]]:flex *:has-[>[data-slot=trace-line]]:w-fit *:has-[>[data-slot=trace-line]]:max-w-full *:has-[>[data-slot=trace-line]]:min-w-0 *:has-[>[data-slot=trace-line]]:rounded-md *:has-[>[data-slot=trace-line]]:text-left *:has-[>[data-slot=trace-line]]:outline-none *:has-[>[data-slot=trace-line]]:focus-visible:ring-3 *:has-[>[data-slot=trace-line]]:focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function TraceLine({
  className,
  status,
  ...props
}: React.ComponentProps<"span"> & {
  status?: "running" | "error" | "pending";
}) {
  return (
    <span
      data-slot="trace-line"
      data-status={status}
      className={cn(
        "flex w-fit max-w-full min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors in-[a,button]:cursor-pointer in-[a:hover,button:hover]:text-foreground data-[status=error]:text-destructive data-[status=error]:in-[a:hover,button:hover]:text-destructive data-[status=pending]:opacity-60 data-[status=running]:*:data-[slot=trace-title]:shimmer",
        className,
      )}
      {...props}
    />
  );
}

function TraceIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-icon"
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [[data-slot=trace-title]~&]:-ml-1",
        className,
      )}
      {...props}
    />
  );
}

function TraceTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-title"
      className={cn("min-w-0 truncate motion-reduce:shimmer-none", className)}
      {...props}
    />
  );
}

function TraceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-description"
      className={cn("shrink-0 text-muted-foreground/70 tabular-nums", className)}
      {...props}
    />
  );
}

function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, "asChild" | "open"> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<React.ComponentProps<typeof Collapsible>["onOpenChange"]>;
      }
  )) {
  return (
    <Collapsible
      data-slot="trace-collapsible"
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleTrigger>, "asChild">) {
  return (
    <CollapsibleTrigger
      data-slot="trace-collapsible-trigger"
      className={cn(
        "group/trace-collapsible-trigger flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-md text-left text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 has-[[data-status=error]]:text-destructive",
        className,
      )}
      {...props}
    >
      {children}
      <TraceIcon className="transition-transform group-aria-expanded/trace-collapsible-trigger:rotate-90">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

function TraceCollapsibleContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleContent>, "asChild">) {
  return (
    <CollapsibleContent
      data-slot="trace-collapsible-content"
      className="min-w-0 overflow-hidden duration-200 [--radix-accordion-content-height:var(--radix-collapsible-content-height)] data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        data-slot="trace-collapsible-content-inner"
        className={cn(
          "mt-2 mb-1 ml-[calc(--spacing(2)-1px)] min-w-0 border-l pr-1 pl-4 leading-relaxed wrap-break-word text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
};
`,"components.json":`{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
`,"css.d.ts":`declare module "*.css";
`,"lib/utils.ts":`import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`,"next-env.d.ts":`/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";
import "./.next/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`,"next.config.ts":`import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

export default withEve(nextConfig__EVE_INIT_WITH_EVE_OPTIONS__);
`,"postcss.config.mjs":`const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`,"proxy.ts":`import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const routerHost = process.env.VERCEL_URL;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.__VERCEL_DEV_RUNNING === "1" && routerHost && forwardedHost !== routerHost) {
    const target = request.nextUrl.clone();
    target.protocol = "http:";
    target.host = routerHost;
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}
`,"tsconfig.json":`{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "Bundler",
    "types": ["node"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
`},WEB_CHANNEL_TEMPLATES={default:`import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for \`eve dev\` and the REPL; ignored in production.
    localDev(),
    // This placeholder will not allow browser requests in production.
    // Replace it with your app's auth provider, like Auth.js or Clerk,
    // or use none() for a public demo.
    placeholderAuth(),
  ],
});
`,"sign-in-with-vercel":`import { eveChannel } from "eve/channels/eve";
import { localDev, type AuthFn, vercelOidc } from "eve/channels/auth";
import { auth } from "@/lib/auth";

const betterAuthSession: AuthFn<Request> = async (request) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  const attributes: Record<string, string> = {
    email: session.user.email,
    name: session.user.name,
  };
  if (session.user.image) {
    attributes.picture = session.user.image;
  }

  return {
    attributes,
    authenticator: "better-auth:vercel",
    principalId: session.user.id,
    principalType: "user",
  };
};

export default eveChannel({
  auth: [betterAuthSession, vercelOidc(), localDev()],
});
`},WEB_APP_SIGN_IN_WITH_VERCEL_TEMPLATE_FILES={"app/_components/authenticated-agent-chat.tsx":`import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AgentChat } from "./agent-chat";
import { AccountControl, SignIn } from "./web-chat-auth";

export async function AuthenticatedAgentChat({
  sessionId,
  sessionless,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  if (process.env.NODE_ENV === "development") {
    return <AgentChat sessionId={sessionId} sessionless={sessionless} />;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <SignIn />;

  return (
    <>
      <AgentChat sessionId={sessionId} sessionless={sessionless} />
      <AccountControl
        email={session.user.email}
        image={session.user.image}
        name={session.user.name}
      />
    </>
  );
}
`,"app/_components/web-chat-auth.tsx":`"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

const AGENT_NAME = "__EVE_INIT_APP_NAME__";

export function SignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);
    try {
      const result = await authClient.signIn.social({
        callbackURL: "/",
        provider: "vercel",
      });
      if (!result.error) return;
      setPending(false);
      setError("Sign-in failed. Try again.");
    } catch {
      setPending(false);
      setError("Sign-in failed. Try again.");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-8 text-foreground">
      <div className="flex w-full max-w-[22rem] flex-col gap-5">
        <div className="text-foreground opacity-[0.08] dark:opacity-[0.12]">
          <EveWordmark className="h-auto w-[4.875rem]" />
        </div>
        <section aria-label="Sign in" className="flex flex-col gap-2">
          <h1 className="max-w-full break-words font-medium text-sm leading-6">{AGENT_NAME}</h1>
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm leading-6">
            <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              Ready
            </span>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span>Sign in to start a session</span>
          </p>
          <Button className="mt-3 w-full gap-2 text-sm" disabled={pending} onClick={signIn}>
            <svg aria-hidden="true" className="size-3 fill-current" viewBox="0 0 24 20">
              <path d="M12 0 24 20H0L12 0Z" />
            </svg>
            <span className="leading-5">{pending ? "Redirecting…" : "Continue with Vercel"}</span>
          </Button>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function EveWordmark({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 169 53"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M169 8.47h-51.39L81.73 53H70.36L113 0H169zM169 44.51v8.47h-45.87V44.5zM45.87 52.98H0V44.5h45.87zM38.66 30.55H0v-8.47h38.66z"
        fill="currentColor"
      />
      <path d="M169 30.55h-38.66v-8.47H169zM75.52 8.47H0V0h75.52z" fill="currentColor" />
    </svg>
  );
}

export function AccountControl({
  email,
  image,
  name,
}: {
  readonly email: string;
  readonly image?: string | null;
  readonly name: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const initials = getInitials(name, email);

  async function signOut() {
    setPending(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onError: () => setPending(false),
          onSuccess: () => window.location.assign("/"),
        },
      });
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="fixed top-3 left-4 z-30 flex h-8 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={\`Open account menu for \${name}\`}
            className="relative size-7 cursor-pointer overflow-hidden rounded-full p-0"
            size="icon-sm"
            variant="ghost"
          >
            {image && !imageFailed ? (
              <img
                alt=""
                className="size-full object-cover"
                onError={() => setImageFailed(true)}
                src={image}
              />
            ) : (
              <span aria-hidden="true" className="font-medium text-xs">
                {initials}
              </span>
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border border-black/20 dark:border-white/25"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="min-w-0 px-2 py-1.5 text-sm">
            <span className="block truncate font-medium leading-5" title={name}>
              {name}
            </span>
            <span className="block truncate text-muted-foreground leading-5" title={email}>
              {email}
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer justify-between"
            disabled={pending}
            onSelect={signOut}
          >
            {pending ? "Logging out…" : "Log out"}
            <LogOutIcon aria-hidden="true" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return \`\${parts[0]?.[0] ?? ""}\${parts.at(-1)?.[0] ?? ""}\`.toUpperCase();
  }
  return (parts[0]?.[0] ?? email[0] ?? "?").toUpperCase();
}
`,"app/api/auth/[...all]/route.ts":`import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
`,"app/layout.tsx":`import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "__EVE_INIT_APP_NAME__",
  description: "A Next.js starter for eve agents with AI Elements.",
};

// The page and Eve routes validate the generated app's Better Auth session.
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={cn(sans.variable, mono.variable)} lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
`,"app/page.tsx":`import { AuthenticatedAgentChat } from "./_components/authenticated-agent-chat";

export default function Page() {
  return <AuthenticatedAgentChat />;
}
`,"app/s/[sessionId]/page.tsx":`import { AuthenticatedAgentChat } from "@/app/_components/authenticated-agent-chat";

export default async function SessionPage({
  params,
}: {
  readonly params: Promise<{ readonly sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <AuthenticatedAgentChat sessionId={sessionId} />;
}
`,"app/s/page.tsx":`import { AuthenticatedAgentChat } from "@/app/_components/authenticated-agent-chat";

export default function NewSessionPage() {
  return <AuthenticatedAgentChat sessionless />;
}
`,"lib/auth-client.ts":`"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
`,"lib/auth.ts":`import { betterAuth } from "better-auth";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEVELOPMENT_ALLOWED_HOSTS = ["localhost:*", "127.0.0.1:*"];

function getAllowedHosts(): string[] {
  if (process.env.NODE_ENV === "development") {
    return DEVELOPMENT_ALLOWED_HOSTS;
  }
  const deploymentHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((host): host is string => Boolean(host));
  if (deploymentHosts.length === 0) {
    throw new Error("No trusted deployment hosts are configured");
  }
  return Array.from(new Set(deploymentHosts));
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "development") return \`development-\${name}\`;
  throw new Error(\`Missing required environment variable: \${name}\`);
}

export const auth = betterAuth({
  baseURL: {
    allowedHosts: getAllowedHosts(),
    protocol: process.env.NODE_ENV === "development" ? "auto" : "https",
  },
  secret: requireEnvironmentVariable("BETTER_AUTH_SECRET"),
  session: {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    disableSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      refreshCache: false,
      strategy: "jwe",
    },
  },
  socialProviders: {
    vercel: {
      clientId: requireEnvironmentVariable("VERCEL_APP_CLIENT_ID"),
      clientSecret: requireEnvironmentVariable("VERCEL_APP_CLIENT_SECRET"),
      scope: ["openid", "email", "profile"],
    },
  },
});
`},WEB_APP_TANSTACK_TEMPLATE_FILES={"tsconfig.json":`{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".output", ".vercel"]
}
`,"vite.config.ts":`import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackStart({ srcDirectory: "app" }), viteReact(), nitro()],
});
`},WEB_APP_TEMPLATE_PACKAGE_JSON={scripts:{build:`next build`,"build:eve":`eve build`,dev:`next dev`,"dev:eve":`eve dev`,start:`next start`,"start:eve":`eve start`,typecheck:`tsc --noEmit -p tsconfig.json`},dependencies:{"@shadcn/react":`0.3.1`,"@shikijs/core":`3.23.0`,"@shikijs/engine-javascript":`3.23.0`,"@shikijs/engine-oniguruma":`3.23.0`,"@streamdown/cjk":`1.0.3`,"@streamdown/code":`1.1.1`,"@streamdown/math":`1.0.2`,"@streamdown/mermaid":`1.0.2`,"@tailwindcss/postcss":`4.3.0`,"class-variance-authority":`0.7.1`,clsx:`2.1.1`,"lucide-react":`1.16.0`,nanoid:`5.1.11`,next:`16.3.6`,"radix-ui":`1.4.3`,react:`19.2.6`,"react-dom":`19.2.6`,shiki:`3.23.0`,streamdown:`2.5.0`,"tailwind-merge":`3.6.0`,tailwindcss:`4.3.0`,"tw-animate-css":`1.4.0`,"use-stick-to-bottom":`1.1.4`,zod:`4.5.4`},devDependencies:{"@types/node":`26`,"@types/react":`19.2.15`,"@types/react-dom":`19.2.3`,typescript:`6.0.3`}};export{WEB_APP_SIGN_IN_WITH_VERCEL_TEMPLATE_FILES,WEB_APP_TANSTACK_TEMPLATE_FILES,WEB_APP_TEMPLATE_FILES,WEB_APP_TEMPLATE_PACKAGE_JSON,WEB_CHANNEL_TEMPLATES};