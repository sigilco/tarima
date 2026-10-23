# @tarima/llm

Owns the two LLM tasks the chase pipeline needs (parseReply, draftOutreach),
their prompts, and the OpenAI-compatible transport that runs them.

Must never import: `@tarima/chase` (chase depends on this package's interface
at wiring time, so the dependency would be a cycle), any app, any db code, or
zod. The `LlmProvider` interface here is structurally identical to
`ChaseLlm`, so a provider from this package is assignable to chase without
touching chase. Schemas are valibot only. Prompts live in src/prompts.ts so
they can be reviewed without reading code, and they never contain em dashes.
Exports are narrow: only names listed in src/index.ts.
