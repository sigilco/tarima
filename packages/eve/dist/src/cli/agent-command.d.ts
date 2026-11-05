import type { Command } from "#compiled/commander/index.js";
import type { CliApplicationContext } from "./application-command.js";
type AgentCommandRequirement = (command: Command) => boolean;
/** Adds consistent workspace-agent selection to an agent-scoped command. */
export declare function agentCommand(command: Command, applicationContext: CliApplicationContext, requirement?: AgentCommandRequirement): Command;
export {};
