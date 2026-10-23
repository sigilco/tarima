/**
 * LogTape sink construction from LOG_* env vars. The ONLY non-facade
 * touchpoint for @logtape/* in the repo. Ported (trimmed) from brioso's
 * packages/obs-js/src/logtape.ts: no OTel, no PostHog, no feature flags.
 *
 * Env:
 *   LOG_SINK   console | jsonl | both   (default console)
 *   LOG_LEVEL  error | warning | info | debug | trace (default info)
 *   LOG_FILE   path for the jsonl sink  (default .logs/tarima.jsonl)
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  configure,
  getConsoleSink,
  type LogRecord,
  type LogLevel,
  type Sink,
} from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";

export {
  configure,
  dispose,
  getLogger,
  getConsoleSink,
  type LogRecord,
  type Sink,
} from "@logtape/logtape";
export type { LogLevel } from "@logtape/logtape";
export { getRotatingFileSink } from "@logtape/file";

const LEVELS = new Set<LogLevel>(["trace", "debug", "info", "warning", "error", "fatal"]);

/** Parses LOG_LEVEL; unknown/missing values fall back to "info". */
export function logLevel(raw: string | undefined): LogLevel {
  const v = raw?.toLowerCase() as LogLevel | undefined;
  return v && LEVELS.has(v) ? v : "info";
}

const jsonlFormatter = (record: LogRecord): string =>
  JSON.stringify({
    ts: record.timestamp,
    lvl: record.level,
    cat: record.category.join("."),
    msg: record.message.map(String).join(""),
    ctx: record.properties,
  }) + "\n";

/**
 * Builds the sink set + level from env. Creates the log directory for the
 * jsonl sink as a side effect. Does not call configure(); the caller owns
 * that so it can shape the loggers block (category filters, parents, etc).
 */
export function createSinks(getEnv: (key: string) => string | undefined = (k) => process.env[k]): {
  sinks: Record<string, Sink>;
  level: LogLevel;
} {
  const sinkMode = getEnv("LOG_SINK") ?? "console";
  const level = logLevel(getEnv("LOG_LEVEL"));
  const logFile = getEnv("LOG_FILE") ?? ".logs/tarima.jsonl";

  const sinks: Record<string, Sink> = {};
  if (sinkMode === "console" || sinkMode === "both") {
    sinks.console = getConsoleSink();
  }
  if (sinkMode === "jsonl" || sinkMode === "both") {
    mkdirSync(dirname(logFile), { recursive: true });
    sinks.jsonl = getRotatingFileSink(logFile, {
      maxSize: 10 * 1024 * 1024, // 10 MiB per file, 3 files kept
      maxFiles: 3,
      formatter: jsonlFormatter,
    });
  }
  return { sinks, level };
}

/** Convenience: configure LogTape from env in one call (root "app" logger). */
export function initObs(getEnv?: (key: string) => string | undefined): void {
  const { sinks, level } = createSinks(getEnv);
  void configure({
    sinks,
    loggers: [
      { category: "app", lowestLevel: level, sinks: Object.keys(sinks) },
      { category: ["logtape", "meta"], lowestLevel: "warning", sinks: Object.keys(sinks) },
    ],
  });
}
