# @tarima/contract

Owns: every wire shape shared between web, api, CLI and MCP: valibot schemas
for access requests, projects, entities, outreach messages, auth
(request-otp/verify-otp), API keys, MCP tools, and the chase row state
machine enum.

Must never import: any other @tarima/* package, node builtins, or framework
code. Contract is the innermost leaf; everything else imports it, never the
reverse. Exports are narrow: only names listed in src/index.ts.
