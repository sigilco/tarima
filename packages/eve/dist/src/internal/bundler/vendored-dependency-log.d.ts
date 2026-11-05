/**
 * Rollup/Rolldown `onLog` handler that drops warnings raised only by
 * dependency code (`node_modules` or eve's compiled vendor modules), which the
 * user cannot act on, and forwards everything else.
 */
export declare function onVendoredDependencyLog<Level extends string, Log>(level: Level, log: Log, defaultHandler: (level: Level, log: Log) => void): void;
