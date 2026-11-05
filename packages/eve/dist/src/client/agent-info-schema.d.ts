import { z } from "#compiled/zod/index.js";
/** Bumped only for breaking reshapes; additive changes keep the version. */
export declare const AGENT_INFO_VERSION = 5;
/**
 * Runtime contract for the authoritative `/eve/v1/info` v5 response. Parsing is
 * tolerant so a server may add fields and enum values without a version bump:
 * unknown keys are stripped and unknown enum strings read as `"unrecognized"`.
 * Discriminated-union `kind` fields stay closed, so a new variant needs a
 * version bump.
 */
export declare const AgentInfoResultSchema: z.ZodObject<{
    agent: z.ZodObject<{
        agentRoot: z.ZodString;
        appRoot: z.ZodString;
        config: z.ZodObject<{
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            binding: z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>;
        }, z.core.$strip>;
        description: z.ZodOptional<z.ZodString>;
        model: z.ZodUnion<readonly [z.ZodObject<{
            contextWindowTokens: z.ZodOptional<z.ZodNumber>;
            providerOptions: z.ZodOptional<z.ZodUnknown>;
            reasoning: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
                high: "high";
                low: "low";
                medium: "medium";
                minimal: "minimal";
                none: "none";
                "provider-default": "provider-default";
                xhigh: "xhigh";
            }>>>;
            source: z.ZodOptional<z.ZodObject<{
                binding: z.ZodOptional<z.ZodObject<{
                    backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        externalDependencies: z.ZodArray<z.ZodString>;
                        extensionScope: z.ZodOptional<z.ZodObject<{
                            namespace: z.ZodString;
                            sourceRoot: z.ZodString;
                        }, z.core.$strip>>;
                        kind: z.ZodLiteral<"filesystem">;
                        mountId: z.ZodOptional<z.ZodString>;
                        sourcePath: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"programmatic">;
                        mountId: z.ZodOptional<z.ZodString>;
                        moduleId: z.ZodString;
                        registryId: z.ZodString;
                        revision: z.ZodString;
                        semanticRevision: z.ZodOptional<z.ZodString>;
                    }, z.core.$strip>], "kind">;
                    logicalPath: z.ZodString;
                    owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        kind: z.ZodLiteral<"application">;
                    }, z.core.$strip>, z.ZodObject<{
                        feature: z.ZodString;
                        kind: z.ZodLiteral<"framework">;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"extension">;
                        mountId: z.ZodOptional<z.ZodString>;
                        namespace: z.ZodString;
                        packageName: z.ZodString;
                    }, z.core.$strip>], "kind">;
                }, z.core.$strip>>;
                exportName: z.ZodOptional<z.ZodString>;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
                sourceId: z.ZodString;
                sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                    markdown: "markdown";
                    module: "module";
                    "skill-package": "skill-package";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            }, z.core.$strip>>;
            endpoint: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                kind: z.ZodLiteral<"external">;
                provider: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"chatgpt">;
                state: z.ZodUnion<readonly [z.ZodEnum<{
                    checking: "checking";
                    ready: "ready";
                    "reauth-required": "reauth-required";
                    "signed-out": "signed-out";
                    unavailable: "unavailable";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                accountLabel: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"gateway">;
                connected: z.ZodLiteral<true>;
                credential: z.ZodUnion<readonly [z.ZodEnum<{
                    "api-key": "api-key";
                    oauth: "oauth";
                    oidc: "oidc";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                team: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"gateway">;
                connected: z.ZodLiteral<false>;
            }, z.core.$strip>]>>;
            id: z.ZodString;
            routing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"gateway">;
                target: z.ZodString;
                byok: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"external">;
                provider: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>, z.ZodObject<{
            contextWindowTokens: z.ZodOptional<z.ZodNumber>;
            providerOptions: z.ZodOptional<z.ZodUnknown>;
            reasoning: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
                high: "high";
                low: "low";
                medium: "medium";
                minimal: "minimal";
                none: "none";
                "provider-default": "provider-default";
                xhigh: "xhigh";
            }>>>;
            source: z.ZodOptional<z.ZodObject<{
                binding: z.ZodOptional<z.ZodObject<{
                    backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        externalDependencies: z.ZodArray<z.ZodString>;
                        extensionScope: z.ZodOptional<z.ZodObject<{
                            namespace: z.ZodString;
                            sourceRoot: z.ZodString;
                        }, z.core.$strip>>;
                        kind: z.ZodLiteral<"filesystem">;
                        mountId: z.ZodOptional<z.ZodString>;
                        sourcePath: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"programmatic">;
                        mountId: z.ZodOptional<z.ZodString>;
                        moduleId: z.ZodString;
                        registryId: z.ZodString;
                        revision: z.ZodString;
                        semanticRevision: z.ZodOptional<z.ZodString>;
                    }, z.core.$strip>], "kind">;
                    logicalPath: z.ZodString;
                    owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        kind: z.ZodLiteral<"application">;
                    }, z.core.$strip>, z.ZodObject<{
                        feature: z.ZodString;
                        kind: z.ZodLiteral<"framework">;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"extension">;
                        mountId: z.ZodOptional<z.ZodString>;
                        namespace: z.ZodString;
                        packageName: z.ZodString;
                    }, z.core.$strip>], "kind">;
                }, z.core.$strip>>;
                exportName: z.ZodOptional<z.ZodString>;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
                sourceId: z.ZodString;
                sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                    markdown: "markdown";
                    module: "module";
                    "skill-package": "skill-package";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            }, z.core.$strip>>;
            endpoint: z.ZodOptional<z.ZodNever>;
            id: z.ZodOptional<z.ZodNever>;
            routing: z.ZodObject<{
                kind: z.ZodLiteral<"dynamic">;
                resolver: z.ZodObject<{
                    binding: z.ZodOptional<z.ZodObject<{
                        backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                            externalDependencies: z.ZodArray<z.ZodString>;
                            extensionScope: z.ZodOptional<z.ZodObject<{
                                namespace: z.ZodString;
                                sourceRoot: z.ZodString;
                            }, z.core.$strip>>;
                            kind: z.ZodLiteral<"filesystem">;
                            mountId: z.ZodOptional<z.ZodString>;
                            sourcePath: z.ZodString;
                        }, z.core.$strip>, z.ZodObject<{
                            kind: z.ZodLiteral<"programmatic">;
                            mountId: z.ZodOptional<z.ZodString>;
                            moduleId: z.ZodString;
                            registryId: z.ZodString;
                            revision: z.ZodString;
                            semanticRevision: z.ZodOptional<z.ZodString>;
                        }, z.core.$strip>], "kind">;
                        logicalPath: z.ZodString;
                        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                            kind: z.ZodLiteral<"application">;
                        }, z.core.$strip>, z.ZodObject<{
                            feature: z.ZodString;
                            kind: z.ZodLiteral<"framework">;
                        }, z.core.$strip>, z.ZodObject<{
                            kind: z.ZodLiteral<"extension">;
                            mountId: z.ZodOptional<z.ZodString>;
                            namespace: z.ZodString;
                            packageName: z.ZodString;
                        }, z.core.$strip>], "kind">;
                    }, z.core.$strip>>;
                    exportName: z.ZodOptional<z.ZodString>;
                    logicalPath: z.ZodString;
                    owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        kind: z.ZodLiteral<"application">;
                    }, z.core.$strip>, z.ZodObject<{
                        feature: z.ZodString;
                        kind: z.ZodLiteral<"framework">;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"extension">;
                        mountId: z.ZodOptional<z.ZodString>;
                        namespace: z.ZodString;
                        packageName: z.ZodString;
                    }, z.core.$strip>], "kind">;
                    sourceId: z.ZodString;
                    sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                        markdown: "markdown";
                        module: "module";
                        "skill-package": "skill-package";
                    }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                    slug: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>;
        }, z.core.$strip>]>;
        name: z.ZodString;
        nodeId: z.ZodString;
        outputSchema: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
    capabilities: z.ZodObject<{
        devRoutes: z.ZodBoolean;
    }, z.core.$strip>;
    channels: z.ZodObject<{
        routes: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            adapterKind: z.ZodOptional<z.ZodString>;
            method: z.ZodUnion<readonly [z.ZodEnum<{
                DELETE: "DELETE";
                GET: "GET";
                HEAD: "HEAD";
                OPTIONS: "OPTIONS";
                PATCH: "PATCH";
                POST: "POST";
                PUT: "PUT";
                WEBSOCKET: "WEBSOCKET";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            urlPath: z.ZodString;
        }, z.core.$strip>>;
        shadowed: z.ZodArray<z.ZodObject<{
            method: z.ZodUnion<readonly [z.ZodEnum<{
                DELETE: "DELETE";
                GET: "GET";
                HEAD: "HEAD";
                OPTIONS: "OPTIONS";
                PATCH: "PATCH";
                POST: "POST";
                PUT: "PUT";
                WEBSOCKET: "WEBSOCKET";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            source: z.ZodObject<{
                backing: z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">, z.ZodObject<{
                    kind: z.ZodLiteral<"resource">;
                    sourcePath: z.ZodString;
                }, z.core.$strip>]>;
                form: z.ZodUnion<readonly [z.ZodEnum<{
                    derived: "derived";
                    direct: "direct";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                layer: z.ZodUnion<readonly [z.ZodEnum<{
                    application: "application";
                    "extension-override": "extension-override";
                    "extension-package": "extension-package";
                    "framework-default": "framework-default";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
                sourceId: z.ZodString;
            }, z.core.$strip>;
            urlPath: z.ZodString;
            winnerSourceId: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    composition: z.ZodObject<{
        disabled: z.ZodArray<z.ZodObject<{
            kind: z.ZodUnion<readonly [z.ZodEnum<{
                disabled: "disabled";
                shadowed: "shadowed";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            winnerSourceId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        shadowed: z.ZodArray<z.ZodObject<{
            kind: z.ZodUnion<readonly [z.ZodEnum<{
                disabled: "disabled";
                shadowed: "shadowed";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            winnerSourceId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    connections: z.ZodArray<z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        connectionName: z.ZodString;
        description: z.ZodString;
        hasApproval: z.ZodBoolean;
        hasAuthorization: z.ZodBoolean;
        hasHeaders: z.ZodBoolean;
        protocol: z.ZodString;
        toolFilter: z.ZodOptional<z.ZodUnknown>;
        url: z.ZodString;
    }, z.core.$strip>>;
    diagnostics: z.ZodObject<{
        discoveryErrors: z.ZodNumber;
        discoveryWarnings: z.ZodNumber;
    }, z.core.$strip>;
    hooks: z.ZodArray<z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        eventNames: z.ZodArray<z.ZodString>;
        slug: z.ZodString;
    }, z.core.$strip>>;
    instructions: z.ZodObject<{
        dynamic: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            slug: z.ZodString;
        }, z.core.$strip>>;
        static: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            content: z.ZodString;
            role: z.ZodUnion<readonly [z.ZodEnum<{
                system: "system";
                user: "user";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    instrumentation: z.ZodOptional<z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
    }, z.core.$strip>>;
    kernelEffects: z.ZodArray<z.ZodObject<{
        action: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
            "subagent-call": "subagent-call";
            "workflow-tool-call": "workflow-tool-call";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>>;
        audience: z.ZodArray<z.ZodUnion<readonly [z.ZodEnum<{
            "root-session": "root-session";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>>;
        kind: z.ZodUnion<readonly [z.ZodEnum<{
            dispatch: "dispatch";
            "provider-tool": "provider-tool";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        sourceId: z.ZodString;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"eve-agent-info">;
    memories: z.ZodArray<z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        description: z.ZodOptional<z.ZodString>;
        slot: z.ZodString;
    }, z.core.$strip>>;
    mode: z.ZodUnion<readonly [z.ZodEnum<{
        development: "development";
        production: "production";
    }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
    remoteAgents: z.ZodObject<{
        entries: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            description: z.ZodString;
            nodeId: z.ZodString;
            parentNodeId: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        total: z.ZodNumber;
    }, z.core.$strip>;
    sandbox: z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        provider: z.ZodOptional<z.ZodString>;
        environmentExportName: z.ZodOptional<z.ZodString>;
        revisionHash: z.ZodString;
    }, z.core.$strip>;
    schedules: z.ZodArray<z.ZodObject<{
        binding: z.ZodOptional<z.ZodObject<{
            backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                externalDependencies: z.ZodArray<z.ZodString>;
                extensionScope: z.ZodOptional<z.ZodObject<{
                    namespace: z.ZodString;
                    sourceRoot: z.ZodString;
                }, z.core.$strip>>;
                kind: z.ZodLiteral<"filesystem">;
                mountId: z.ZodOptional<z.ZodString>;
                sourcePath: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"programmatic">;
                mountId: z.ZodOptional<z.ZodString>;
                moduleId: z.ZodString;
                registryId: z.ZodString;
                revision: z.ZodString;
                semanticRevision: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>], "kind">;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
        }, z.core.$strip>>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"application">;
        }, z.core.$strip>, z.ZodObject<{
            feature: z.ZodString;
            kind: z.ZodLiteral<"framework">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"extension">;
            mountId: z.ZodOptional<z.ZodString>;
            namespace: z.ZodString;
            packageName: z.ZodString;
        }, z.core.$strip>], "kind">;
        sourceId: z.ZodString;
        sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
            markdown: "markdown";
            module: "module";
            "skill-package": "skill-package";
        }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
        name: z.ZodString;
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        markdown: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    skills: z.ZodObject<{
        dynamic: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            slug: z.ZodString;
        }, z.core.$strip>>;
        static: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            description: z.ZodString;
            license: z.ZodOptional<z.ZodString>;
            markdown: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    subagents: z.ZodObject<{
        local: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            configResolver: z.ZodOptional<z.ZodObject<{
                binding: z.ZodOptional<z.ZodObject<{
                    backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        externalDependencies: z.ZodArray<z.ZodString>;
                        extensionScope: z.ZodOptional<z.ZodObject<{
                            namespace: z.ZodString;
                            sourceRoot: z.ZodString;
                        }, z.core.$strip>>;
                        kind: z.ZodLiteral<"filesystem">;
                        mountId: z.ZodOptional<z.ZodString>;
                        sourcePath: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"programmatic">;
                        mountId: z.ZodOptional<z.ZodString>;
                        moduleId: z.ZodString;
                        registryId: z.ZodString;
                        revision: z.ZodString;
                        semanticRevision: z.ZodOptional<z.ZodString>;
                    }, z.core.$strip>], "kind">;
                    logicalPath: z.ZodString;
                    owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                        kind: z.ZodLiteral<"application">;
                    }, z.core.$strip>, z.ZodObject<{
                        feature: z.ZodString;
                        kind: z.ZodLiteral<"framework">;
                    }, z.core.$strip>, z.ZodObject<{
                        kind: z.ZodLiteral<"extension">;
                        mountId: z.ZodOptional<z.ZodString>;
                        namespace: z.ZodString;
                        packageName: z.ZodString;
                    }, z.core.$strip>], "kind">;
                }, z.core.$strip>>;
                exportName: z.ZodOptional<z.ZodString>;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
                sourceId: z.ZodString;
                sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                    markdown: "markdown";
                    module: "module";
                    "skill-package": "skill-package";
                }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
                slug: z.ZodString;
            }, z.core.$strip>>;
            description: z.ZodOptional<z.ZodString>;
            entryPath: z.ZodString;
            nodeId: z.ZodString;
            parentNodeId: z.ZodString;
            rootPath: z.ZodString;
            summary: z.ZodObject<{
                channels: z.ZodNumber;
                connections: z.ZodNumber;
                hooks: z.ZodNumber;
                instructions: z.ZodNumber;
                memories: z.ZodNumber;
                schedules: z.ZodNumber;
                skills: z.ZodNumber;
                tools: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        total: z.ZodNumber;
    }, z.core.$strip>;
    tools: z.ZodObject<{
        dynamic: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            slug: z.ZodString;
        }, z.core.$strip>>;
        static: z.ZodArray<z.ZodObject<{
            binding: z.ZodOptional<z.ZodObject<{
                backing: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    externalDependencies: z.ZodArray<z.ZodString>;
                    extensionScope: z.ZodOptional<z.ZodObject<{
                        namespace: z.ZodString;
                        sourceRoot: z.ZodString;
                    }, z.core.$strip>>;
                    kind: z.ZodLiteral<"filesystem">;
                    mountId: z.ZodOptional<z.ZodString>;
                    sourcePath: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"programmatic">;
                    mountId: z.ZodOptional<z.ZodString>;
                    moduleId: z.ZodString;
                    registryId: z.ZodString;
                    revision: z.ZodString;
                    semanticRevision: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>], "kind">;
                logicalPath: z.ZodString;
                owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                    kind: z.ZodLiteral<"application">;
                }, z.core.$strip>, z.ZodObject<{
                    feature: z.ZodString;
                    kind: z.ZodLiteral<"framework">;
                }, z.core.$strip>, z.ZodObject<{
                    kind: z.ZodLiteral<"extension">;
                    mountId: z.ZodOptional<z.ZodString>;
                    namespace: z.ZodString;
                    packageName: z.ZodString;
                }, z.core.$strip>], "kind">;
            }, z.core.$strip>>;
            exportName: z.ZodOptional<z.ZodString>;
            logicalPath: z.ZodString;
            owner: z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"application">;
            }, z.core.$strip>, z.ZodObject<{
                feature: z.ZodString;
                kind: z.ZodLiteral<"framework">;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"extension">;
                mountId: z.ZodOptional<z.ZodString>;
                namespace: z.ZodString;
                packageName: z.ZodString;
            }, z.core.$strip>], "kind">;
            sourceId: z.ZodString;
            sourceKind: z.ZodUnion<readonly [z.ZodEnum<{
                markdown: "markdown";
                module: "module";
                "skill-package": "skill-package";
            }>, z.ZodPipe<z.ZodString, z.ZodTransform<"unrecognized", string>>]>;
            name: z.ZodString;
            description: z.ZodString;
            hasAuth: z.ZodBoolean;
            hasExecute: z.ZodBoolean;
            hasModelOutputProjection: z.ZodBoolean;
            hasOutputSchema: z.ZodBoolean;
            inputSchema: z.ZodUnknown;
            outputSchema: z.ZodOptional<z.ZodUnknown>;
            requiresApproval: z.ZodBoolean;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    version: z.ZodLiteral<5>;
    workspace: z.ZodObject<{
        resourceRoot: z.ZodUnknown;
        rootEntries: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
/**
 * Names which side to upgrade when an agent-info body carries another version,
 * so the caller sees one actionable issue instead of every reshaped field.
 */
export declare function describeAgentInfoVersionMismatch(payload: unknown): string | undefined;
export type { AgentInfoResult, AgentInfoSource, AgentInfoEntry, AgentInfoToolEntry, AgentInfoDynamicResolverEntry, AgentInfoTools, AgentInfoSkillEntry, AgentInfoInstructionsEntry, AgentInfoInstructions, AgentInfoScheduleEntry, AgentInfoSubagentEntry, AgentInfoRemoteAgentEntry, AgentInfoChannelEntry, AgentInfoChannels, AgentInfoConnectionEntry, AgentInfoHookEntry, AgentInfoMemoryEntry, AgentInfoSandboxEntry, } from "./agent-info-types.js";
