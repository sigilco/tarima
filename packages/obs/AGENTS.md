# @tarima/obs

Owns: logging configuration (LogTape console + rotating JSONL sinks), the
audit-log helper, and LOG_* env parsing. This is the only package allowed to
touch @logtape/*.

Must never import: app packages (@tarima/contract, apps/*), databases, or
anything stateful. Obs is a leaf: no upward dependencies.
