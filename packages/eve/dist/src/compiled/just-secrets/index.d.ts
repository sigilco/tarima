/** Identifies a credential within a service. */
export interface SecretsOptions {
  service: string;
  name: string;
}

export interface Secrets {
  /** Returns the stored secret, or null when it does not exist. */
  get(options: SecretsOptions): Promise<string | null>;
  get(service: string, name: string): Promise<string | null>;
  /** Creates or replaces a secret in the native credential store. */
  set(options: SecretsOptions & { value: string }): Promise<void>;
  set(service: string, name: string, value: string): Promise<void>;
  /** Returns true when deleted, or false when it does not exist. */
  delete(options: SecretsOptions): Promise<boolean>;
  delete(service: string, name: string): Promise<boolean>;
}

/** Native secret storage for Node.js 22+, using OS-provided credential tools. */
export declare const secrets: Secrets;
