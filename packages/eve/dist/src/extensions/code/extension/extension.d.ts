import type { SandboxSession } from "eve/sandbox";
import { z } from "zod";
export type CredentialPolicyBroker = (sandbox: SandboxSession, rules: Record<string, Record<string, string>>) => Promise<void>;
declare const _default: import("eve/extension").ExtensionHandle<z.ZodObject<{
    vercel: z.ZodOptional<z.ZodObject<{
        connector: z.ZodString;
        delivery: z.ZodDefault<z.ZodEnum<{
            command: "command";
            firewall: "firewall";
        }>>;
    }, z.core.$strip>>;
    broker: z.ZodOptional<z.ZodCustom<CredentialPolicyBroker, CredentialPolicyBroker>>;
}, z.core.$strict>>;
export default _default;
