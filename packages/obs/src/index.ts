export { audit, type AuditContext } from "./audit.js";
export {
  configure,
  createSinks,
  dispose,
  getConsoleSink,
  getLogger,
  getRotatingFileSink,
  initObs,
  logLevel,
} from "./logtape.js";
export type { LogRecord, LogLevel, Sink } from "./logtape.js";
