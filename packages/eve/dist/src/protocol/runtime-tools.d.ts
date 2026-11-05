/**
 * Why `name` is taken, for errors to quote; undefined when the name is free.
 * Nothing authored or dynamic may be named `eve` or start with `eve__`: a
 * connection or extension named `eve` would own every `eve__` name.
 */
export declare function eveNamespaceReservation(name: string): string | undefined;
